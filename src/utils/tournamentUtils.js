export function getNextPowerOf2(n) {
  if (n <= 1) return 1
  let p = 1
  while (p < n) p *= 2
  return p
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateBracket(teams, sport) {
  const shuffled = shuffle(teams)
  const size = getNextPowerOf2(shuffled.length)
  const padded = [...shuffled]
  while (padded.length < size) padded.push(null) // null = BYE

  // Build first round
  const firstRound = []
  for (let i = 0; i < padded.length; i += 2) {
    const matchId = `${sport}-r0-m${i / 2}`
    const t1 = padded[i]
    const t2 = padded[i + 1]
    const isBye = t1 === null || t2 === null
    firstRound.push({
      id: matchId,
      team1: t1 ? t1.id : null,
      team2: t2 ? t2.id : null,
      winner: null,
      isBye,
      status: 'pending',
      score: null,
    })
  }

  const totalRounds = Math.log2(size)
  const rounds = [firstRound]

  // Build subsequent rounds (empty slots)
  for (let r = 1; r < totalRounds; r++) {
    const prevRound = rounds[r - 1]
    const round = []
    for (let m = 0; m < prevRound.length / 2; m++) {
      round.push({
        id: `${sport}-r${r}-m${m}`,
        team1: null,
        team2: null,
        winner: null,
        isBye: false,
        status: 'pending',
        score: null,
      })
    }
    rounds.push(round)
  }

  return { rounds, totalRounds, sport }
}

export function advanceWinner(bracket, matchId, winnerId) {
  const { rounds } = bracket
  let matchRoundIdx = -1
  let matchIdx = -1

  for (let r = 0; r < rounds.length; r++) {
    for (let m = 0; m < rounds[r].length; m++) {
      if (rounds[r][m].id === matchId) {
        matchRoundIdx = r
        matchIdx = m
        break
      }
    }
    if (matchRoundIdx !== -1) break
  }

  if (matchRoundIdx === -1) return bracket

  const newRounds = rounds.map(r => r.map(m => ({ ...m })))
  newRounds[matchRoundIdx][matchIdx].winner = winnerId
  newRounds[matchRoundIdx][matchIdx].status = 'completed'

  // Advance to next round if exists
  const nextRound = matchRoundIdx + 1
  if (nextRound < newRounds.length) {
    const nextMatchIdx = Math.floor(matchIdx / 2)
    const slot = matchIdx % 2 === 0 ? 'team1' : 'team2'
    newRounds[nextRound][nextMatchIdx][slot] = winnerId

    // Check if next match now has both teams or is a bye
    const nextMatch = newRounds[nextRound][nextMatchIdx]
    if (nextMatch.team1 !== null && nextMatch.team2 !== null) {
      nextMatch.status = 'ready'
    } else if (nextMatch.team1 !== null || nextMatch.team2 !== null) {
      // Waiting for other team
      nextMatch.status = 'waiting'
    }
  }

  return { ...bracket, rounds: newRounds }
}

export function detectStage(roundIndex, totalRounds) {
  const fromEnd = totalRounds - 1 - roundIndex
  if (fromEnd === 0) return 'final'
  if (fromEnd === 1) return 'semifinal'
  if (fromEnd === 2) return 'quarterfinal'
  return 'regular'
}

export function getGamesNeededToWin(stage, sport) {
  if (sport === 'padel') return 1 // one set
  if (stage === 'final') return null // play all 6 games
  if (stage === 'semifinal') return 4 // best of 7
  return 3 // best of 5 (regular + quarterfinal)
}

export function getTotalGamesInSeries(stage, sport) {
  if (sport === 'padel') return 1
  if (stage === 'final') return 6
  if (stage === 'semifinal') return 7
  return 5
}

export function isByeMatch(match) {
  return match.team1 === null || match.team2 === null
}

export function autoAdvanceByes(bracket) {
  let updated = { ...bracket, rounds: bracket.rounds.map(r => r.map(m => ({ ...m }))) }

  for (let r = 0; r < updated.rounds.length; r++) {
    for (let m = 0; m < updated.rounds[r].length; m++) {
      const match = updated.rounds[r][m]
      if (match.winner !== null) continue
      if (match.team1 === null && match.team2 === null) continue
      if (match.team1 === null || match.team2 === null) {
        // BYE: advance the non-null team
        const winner = match.team1 !== null ? match.team1 : match.team2
        updated = advanceWinner(updated, match.id, winner)
        updated.rounds[r][m].isBye = true
        updated.rounds[r][m].winner = winner
        updated.rounds[r][m].status = 'bye'
      }
    }
  }
  return updated
}

export function getRoundLabel(roundIndex, totalRounds) {
  const fromEnd = totalRounds - 1 - roundIndex
  if (fromEnd === 0) return 'Final'
  if (fromEnd === 1) return 'Semi-finals'
  if (fromEnd === 2) return 'Quarter-finals'
  return `Round ${roundIndex + 1}`
}
