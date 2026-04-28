import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { generateBracket, autoAdvanceByes, advanceWinner } from '../utils/tournamentUtils'

const FIRESTORE_DOC = 'aca_sports/state'

const GameContext = createContext(null)

const initialState = {
  teams: { padel: [], volleyball: [], football: [] },
  tournaments: { padel: null, volleyball: null, football: null },
  matches: {},
}

// Write the full state to Firestore
async function saveState(state) {
  await setDoc(doc(db, 'aca_sports', 'state'), state)
}

// Compute new state from an action using pure reducer logic
function applyAction(state, action) {
  switch (action.type) {
    case 'REGISTER_TEAM': {
      const { sport, teamData } = action
      const teams = [...(state.teams[sport] || []), teamData]
      return {
        ...state,
        teams: { ...state.teams, [sport]: teams },
      }
    }

    case 'DELETE_TEAM': {
      const { sport, teamId } = action
      const tournament = state.tournaments[sport]
      if (!tournament || !tournament.started) {
        const teams = (state.teams[sport] || []).filter(t => t.id !== teamId)
        return {
          ...state,
          teams: { ...state.teams, [sport]: teams },
        }
      } else {
        // Mark as forfeit in matches
        const newMatches = { ...state.matches }
        Object.keys(newMatches).forEach(mid => {
          const m = newMatches[mid]
          if (m.sport === sport && (m.team1 === teamId || m.team2 === teamId) && !m.winner) {
            const winner = m.team1 === teamId ? m.team2 : m.team1
            newMatches[mid] = { ...m, winner, status: 'forfeit', forfeit: teamId }
          }
        })
        const teams = state.teams[sport].map(t =>
          t.id === teamId ? { ...t, forfeited: true } : t
        )
        return {
          ...state,
          teams: { ...state.teams, [sport]: teams },
          matches: newMatches,
        }
      }
    }

    case 'START_TOURNAMENT': {
      const { sport } = action
      const sportTeams = state.teams[sport] || []
      if (sportTeams.length < 2) return state

      let bracket = generateBracket(sportTeams, sport)
      bracket = autoAdvanceByes(bracket)

      const newMatches = { ...state.matches }
      bracket.rounds.forEach((round, rIdx) => {
        round.forEach((match) => {
          newMatches[match.id] = {
            ...match,
            sport,
            roundIndex: rIdx,
            totalRounds: bracket.totalRounds,
          }
        })
      })

      return {
        ...state,
        tournaments: {
          ...state.tournaments,
          [sport]: { started: true, bracket },
        },
        matches: newMatches,
      }
    }

    case 'UPDATE_MATCH': {
      const { matchId, matchData } = action
      return {
        ...state,
        matches: {
          ...state.matches,
          [matchId]: { ...state.matches[matchId], ...matchData },
        },
      }
    }

    case 'ADVANCE_MATCH_WINNER': {
      const { sport, matchId, winnerId } = action
      const tournament = state.tournaments[sport]
      if (!tournament) return state

      let bracket = advanceWinner(tournament.bracket, matchId, winnerId)
      bracket = autoAdvanceByes(bracket)

      const newMatches = { ...state.matches }
      bracket.rounds.forEach((round, rIdx) => {
        round.forEach((match) => {
          const existing = newMatches[match.id] || {}
          newMatches[match.id] = {
            ...existing,
            ...match,
            sport,
            roundIndex: rIdx,
            totalRounds: bracket.totalRounds,
          }
        })
      })

      if (newMatches[matchId]) {
        newMatches[matchId].winner = winnerId
        newMatches[matchId].status = 'completed'
      }

      return {
        ...state,
        tournaments: {
          ...state.tournaments,
          [sport]: { ...tournament, bracket },
        },
        matches: newMatches,
      }
    }

    case 'RESET_ALL': {
      return initialState
    }

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, setState] = useState(initialState)
  const [loading, setLoading] = useState(true)
  // Track the latest state in a ref so action handlers always see current state
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // Subscribe to Firestore real-time updates
  useEffect(() => {
    const ref = doc(db, 'aca_sports', 'state')
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        setState(snapshot.data())
      } else {
        setState(initialState)
      }
      setLoading(false)
    }, () => {
      // On error (e.g. offline) fall back gracefully and stop loading
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Dispatch an action: compute next state locally, then persist to Firestore
  function dispatch(action) {
    const next = applyAction(stateRef.current, action)
    stateRef.current = next
    setState(next)
    saveState(next)
  }

  const actions = {
    registerTeam: (sport, teamData) => dispatch({ type: 'REGISTER_TEAM', sport, teamData }),
    deleteTeam: (sport, teamId) => dispatch({ type: 'DELETE_TEAM', sport, teamId }),
    startTournament: (sport) => dispatch({ type: 'START_TOURNAMENT', sport }),
    updateMatch: (matchId, matchData) => dispatch({ type: 'UPDATE_MATCH', matchId, matchData }),
    advanceMatchWinner: (sport, matchId, winnerId) =>
      dispatch({ type: 'ADVANCE_MATCH_WINNER', sport, matchId, winnerId }),
    resetAll: () => dispatch({ type: 'RESET_ALL' }),
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#757575' }}>
        Connecting…
      </div>
    )
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
