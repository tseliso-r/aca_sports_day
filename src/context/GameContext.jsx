import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { generateBracket, autoAdvanceByes, advanceWinner } from '../utils/tournamentUtils'

const STORAGE_KEY = 'aca_sports_day_data'

const GameContext = createContext(null)

const initialState = {
  teams: { padel: [], volleyball: [], football: [] },
  tournaments: { padel: null, volleyball: null, football: null },
  matches: {},
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    return JSON.parse(raw)
  } catch {
    return initialState
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

function reducer(state, action) {
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
        // Remove from registration
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

      // Build matches map from bracket
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

      // Update all bracket matches back into matches map
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

      // Update the current match winner
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
  const [state, dispatch] = useReducer(reducer, null, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const actions = {
    registerTeam: (sport, teamData) => dispatch({ type: 'REGISTER_TEAM', sport, teamData }),
    deleteTeam: (sport, teamId) => dispatch({ type: 'DELETE_TEAM', sport, teamId }),
    startTournament: (sport) => dispatch({ type: 'START_TOURNAMENT', sport }),
    updateMatch: (matchId, matchData) => dispatch({ type: 'UPDATE_MATCH', matchId, matchData }),
    advanceMatchWinner: (sport, matchId, winnerId) =>
      dispatch({ type: 'ADVANCE_MATCH_WINNER', sport, matchId, winnerId }),
    resetAll: () => dispatch({ type: 'RESET_ALL' }),
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
