// Point progression for padel/tennis scoring
const POINT_LABELS = [0, 15, 30, 40]

export function createInitialGameState() {
  return {
    team1Points: 0,   // index 0-3
    team2Points: 0,
    team1Games: 0,
    team2Games: 0,
    deuceCount: 0,
    isDeuce: false,
    isGoldenDeuce: false,
    advantage: null,  // 'team1' | 'team2' | null
    isTiebreak: false,
    tiebreakScore: { team1: 0, team2: 0 },
    setWon: false,
    setWinner: null,
  }
}

export function addPoint(state, team) {
  if (state.setWon) return state

  const newState = { ...state }
  const other = team === 'team1' ? 'team2' : 'team1'

  // --- Tiebreak mode ---
  if (newState.isTiebreak) {
    newState.tiebreakScore = { ...newState.tiebreakScore }
    newState.tiebreakScore[team] += 1
    const t1 = newState.tiebreakScore.team1
    const t2 = newState.tiebreakScore.team2
    if ((t1 >= 7 || t2 >= 7) && Math.abs(t1 - t2) >= 2) {
      newState.setWon = true
      newState.setWinner = t1 > t2 ? 'team1' : 'team2'
    }
    return newState
  }

  // --- Golden Deuce ---
  if (newState.isGoldenDeuce) {
    // next point wins game
    return resolveGameWon(newState, team)
  }

  // --- Advantage ---
  if (newState.isDeuce && newState.advantage !== null) {
    if (newState.advantage === team) {
      // wins game
      return resolveGameWon(newState, team)
    } else {
      // back to deuce
      newState.advantage = null
      return newState
    }
  }

  // --- At deuce (40-40) with no advantage yet ---
  if (newState.isDeuce && newState.advantage === null) {
    // This state means we're giving advantage
    newState.advantage = team
    return newState
  }

  // --- Normal point progression ---
  const scorerPts = newState[`${team}Points`] + 1
  newState[`${team}Points`] = scorerPts

  // Check for 40-40 (both at index 3)
  if (newState.team1Points === 3 && newState.team2Points === 3) {
    // Check if deuce already reached once or more
    if (newState.deuceCount >= 1) {
      // Golden deuce
      newState.isGoldenDeuce = true
      newState.isDeuce = false
    } else {
      newState.isDeuce = true
      newState.isGoldenDeuce = false
      newState.deuceCount = newState.deuceCount + 1
    }
    newState.advantage = null
    return newState
  }

  // Check if scorer reached 4 (won game from 40 when other < 40)
  if (scorerPts === 4) {
    // Scorer was at 40, other was less → game won
    return resolveGameWon(newState, team)
  }

  return newState
}

function resolveGameWon(state, winner) {
  const newState = { ...state }
  newState[`${winner}Games`] = newState[`${winner}Games`] + 1
  // Reset game
  newState.team1Points = 0
  newState.team2Points = 0
  newState.isDeuce = false
  newState.isGoldenDeuce = false
  newState.advantage = null

  // Check set win (6 games needed)
  const w = newState[`${winner}Games`]
  const other = winner === 'team1' ? 'team2' : 'team1'
  const o = newState[`${other}Games`]

  if (w >= 6) {
    if (w - o >= 2) {
      newState.setWon = true
      newState.setWinner = winner
      return newState
    }
    if (w === 7) {
      newState.setWon = true
      newState.setWinner = winner
      return newState
    }
    if (w === 6 && o === 6) {
      // Tiebreak
      newState.isTiebreak = true
      return newState
    }
  }

  return newState
}

export function getPointDisplay(state) {
  if (state.setWon) {
    return { team1: '-', team2: '-', status: `Set won by ${state.setWinner}` }
  }
  if (state.isTiebreak) {
    return {
      team1: String(state.tiebreakScore.team1),
      team2: String(state.tiebreakScore.team2),
      status: 'TIEBREAK'
    }
  }
  if (state.isGoldenDeuce) {
    return { team1: 'GD', team2: 'GD', status: 'GOLDEN DEUCE' }
  }
  if (state.isDeuce) {
    if (state.advantage === 'team1') return { team1: 'ADV', team2: '40', status: 'ADVANTAGE' }
    if (state.advantage === 'team2') return { team1: '40', team2: 'ADV', status: 'ADVANTAGE' }
    return { team1: '40', team2: '40', status: 'DEUCE' }
  }
  return {
    team1: String(POINT_LABELS[state.team1Points] ?? 0),
    team2: String(POINT_LABELS[state.team2Points] ?? 0),
    status: null
  }
}

export function removePoint(state, team) {
  // Simple undo: step back from last scored point
  if (state.setWon) {
    // Cannot undo set win easily; just return state
    return state
  }
  const newState = { ...state }
  if (newState.isTiebreak) {
    if (newState.tiebreakScore[team] > 0) {
      newState.tiebreakScore = { ...newState.tiebreakScore }
      newState.tiebreakScore[team] -= 1
    }
    return newState
  }
  if (newState.isGoldenDeuce) {
    newState.isGoldenDeuce = false
    newState.isDeuce = true
    return newState
  }
  if (newState.isDeuce && newState.advantage === team) {
    newState.advantage = null
    return newState
  }
  if (newState.isDeuce && newState.advantage !== null) {
    const other = team === 'team1' ? 'team2' : 'team1'
    if (newState.advantage === other) {
      newState.advantage = null
      return newState
    }
  }
  if (newState.isDeuce && newState.advantage === null) {
    // Back before deuce
    newState.isDeuce = false
    newState.deuceCount = Math.max(0, newState.deuceCount - 1)
    newState.team1Points = 3
    newState.team2Points = 3
    if (newState[`${team}Points`] > 0) {
      newState[`${team}Points`] -= 1
    }
    return newState
  }
  if (newState[`${team}Points`] > 0) {
    newState[`${team}Points`] -= 1
  }
  return newState
}
