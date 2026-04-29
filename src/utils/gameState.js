import { generateBracket, autoAdvanceByes, advanceWinner } from './tournamentUtils'

export function createInitialState() {
  return {
    teams: { padel: [], volleyball: [], football: [] },
    tournaments: { padel: null, volleyball: null, football: null },
    matches: {},
  }
}

export function normalizeGameState(state) {
  const baseState = createInitialState()

  if (!state || typeof state !== 'object') {
    return baseState
  }

  return {
    teams: {
      ...baseState.teams,
      ...(state.teams || {}),
    },
    tournaments: {
      ...baseState.tournaments,
      ...(state.tournaments || {}),
    },
    matches: {
      ...(state.matches || {}),
    },
  }
}

export function reduceGameState(state, action) {
  const currentState = normalizeGameState(state)

  switch (action.type) {
    case 'HYDRATE_STATE': {
      return normalizeGameState(action.state)
    }

    case 'REGISTER_TEAM': {
      const { sport, teamData } = action
      const teams = [...(currentState.teams[sport] || []), teamData]
      return {
        ...currentState,
        teams: { ...currentState.teams, [sport]: teams },
      }
    }

    case 'DELETE_TEAM': {
      const { sport, teamId } = action
      const tournament = currentState.tournaments[sport]
      if (!tournament || !tournament.started) {
        const teams = (currentState.teams[sport] || []).filter(t => t.id !== teamId)
        return {
          ...currentState,
          teams: { ...currentState.teams, [sport]: teams },
        }
      }

      const newMatches = { ...currentState.matches }
      Object.keys(newMatches).forEach(matchId => {
        const match = newMatches[matchId]
        if (match.sport === sport && (match.team1 === teamId || match.team2 === teamId) && !match.winner) {
          const winner = match.team1 === teamId ? match.team2 : match.team1
          newMatches[matchId] = { ...match, winner, status: 'forfeit', forfeit: teamId }
        }
      })

      const teams = currentState.teams[sport].map(team =>
        team.id === teamId ? { ...team, forfeited: true } : team
      )

      return {
        ...currentState,
        teams: { ...currentState.teams, [sport]: teams },
        matches: newMatches,
      }
    }

    case 'START_TOURNAMENT': {
      const { sport } = action
      const sportTeams = currentState.teams[sport] || []
      if (sportTeams.length < 2) return currentState

      let bracket = generateBracket(sportTeams, sport)
      bracket = autoAdvanceByes(bracket)

      const newMatches = { ...currentState.matches }
      bracket.rounds.forEach((round, roundIndex) => {
        round.forEach(match => {
          newMatches[match.id] = {
            ...match,
            sport,
            roundIndex,
            totalRounds: bracket.totalRounds,
          }
        })
      })

      return {
        ...currentState,
        tournaments: {
          ...currentState.tournaments,
          [sport]: { started: true, bracket },
        },
        matches: newMatches,
      }
    }

    case 'UPDATE_MATCH': {
      const { matchId, matchData } = action
      return {
        ...currentState,
        matches: {
          ...currentState.matches,
          [matchId]: { ...(currentState.matches[matchId] || {}), ...matchData },
        },
      }
    }

    case 'ADVANCE_MATCH_WINNER': {
      const { sport, matchId, winnerId } = action
      const tournament = currentState.tournaments[sport]
      if (!tournament) return currentState

      let bracket = advanceWinner(tournament.bracket, matchId, winnerId)
      bracket = autoAdvanceByes(bracket)

      const newMatches = { ...currentState.matches }
      bracket.rounds.forEach((round, roundIndex) => {
        round.forEach(match => {
          const existing = newMatches[match.id] || {}
          newMatches[match.id] = {
            ...existing,
            ...match,
            sport,
            roundIndex,
            totalRounds: bracket.totalRounds,
          }
        })
      })

      if (newMatches[matchId]) {
        newMatches[matchId].winner = winnerId
        newMatches[matchId].status = 'completed'
      }

      return {
        ...currentState,
        tournaments: {
          ...currentState.tournaments,
          [sport]: { ...tournament, bracket },
        },
        matches: newMatches,
      }
    }

    case 'RESET_ALL': {
      return createInitialState()
    }

    default:
      return currentState
  }
}
