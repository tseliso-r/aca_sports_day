import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { createInitialState, normalizeGameState, reduceGameState } from '../utils/gameState'

const STORAGE_KEY = 'aca_sports_day_data'
const SYNC_STATE_URL = '/api/state'
const SYNC_LIVE_URL = '/api/live'

const GameContext = createContext(null)

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    return normalizeGameState(JSON.parse(raw))
  } catch {
    return createInitialState()
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

const isBrowser = typeof window !== 'undefined'
const reducer = reduceGameState

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)
  const syncEnabledRef = useRef(true)
  const socketRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const requestQueueRef = useRef(Promise.resolve())

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    if (!isBrowser) return undefined

    let cancelled = false

    async function connectSync() {
      if (!syncEnabledRef.current) return

      try {
        const response = await fetch(SYNC_STATE_URL, { cache: 'no-store' })
        if (response.status === 404) {
          syncEnabledRef.current = false
          return
        }

        if (!response.ok) {
          throw new Error(`Sync bootstrap failed with ${response.status}`)
        }

        const payload = await response.json()
        if (!cancelled && payload?.state) {
          dispatch({ type: 'HYDRATE_STATE', state: payload.state })
        }

        const liveUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${SYNC_LIVE_URL}`
        const socket = new WebSocket(liveUrl)
        socketRef.current = socket

        socket.addEventListener('message', event => {
          try {
            const message = JSON.parse(event.data)
            if (message?.type === 'snapshot' && message.state) {
              dispatch({ type: 'HYDRATE_STATE', state: message.state })
            }
          } catch {
            // Ignore malformed messages.
          }
        })

        socket.addEventListener('close', () => {
          if (cancelled || !syncEnabledRef.current) return
          socketRef.current = null
          reconnectTimerRef.current = window.setTimeout(connectSync, 3000)
        })

        socket.addEventListener('error', () => {
          try {
            socket.close()
          } catch {
            // ignore
          }
        })
      } catch {
        if (cancelled || !syncEnabledRef.current) return
        reconnectTimerRef.current = window.setTimeout(connectSync, 5000)
      }
    }

    connectSync()

    return () => {
      cancelled = true
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
      }
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [])

  function dispatchLocal(action) {
    dispatch(action)
  }

  function syncAction(action) {
    if (!syncEnabledRef.current) {
      dispatchLocal(action)
      return
    }

    requestQueueRef.current = requestQueueRef.current
      .then(async () => {
        const response = await fetch(SYNC_STATE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        })

        if (response.status === 404) {
          syncEnabledRef.current = false
          dispatchLocal(action)
          return
        }

        if (!response.ok) {
          throw new Error(`Sync update failed with ${response.status}`)
        }

        const payload = await response.json()
        if (payload?.state) {
          dispatch({ type: 'HYDRATE_STATE', state: payload.state })
        }
      })
      .catch(() => {
        dispatchLocal(action)
      })
  }

  const actions = {
    registerTeam: (sport, teamData) => syncAction({ type: 'REGISTER_TEAM', sport, teamData }),
    deleteTeam: (sport, teamId) => syncAction({ type: 'DELETE_TEAM', sport, teamId }),
    startTournament: (sport) => syncAction({ type: 'START_TOURNAMENT', sport }),
    updateMatch: (matchId, matchData) => syncAction({ type: 'UPDATE_MATCH', matchId, matchData }),
    advanceMatchWinner: (sport, matchId, winnerId) =>
      syncAction({ type: 'ADVANCE_MATCH_WINNER', sport, matchId, winnerId }),
    resetAll: () => syncAction({ type: 'RESET_ALL' }),
  }

  return (
    <GameContext.Provider value={{ state, ...actions }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
