import React from 'react'
import { useGame } from '../context/GameContext'
import MatchCard from './MatchCard'
import { getRoundLabel } from '../utils/tournamentUtils'

function TournamentBracket({ sport, onMatchSelect }) {
  const { state } = useGame()
  const tournament = state.tournaments[sport]

  if (!tournament || !tournament.bracket) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🏆</div>
        <h3>Tournament not started</h3>
        <p>Admin needs to start the tournament.</p>
      </div>
    )
  }

  const { rounds, totalRounds } = tournament.bracket
  const teams = state.teams[sport] || []

  function getTeam(id) {
    return teams.find(t => t.id === id) || null
  }

  return (
    <div className="bracket-container">
      <div className="bracket">
        {rounds.map((round, rIdx) => (
          <div key={rIdx} className="bracket-round">
            <div className="bracket-round-header">
              {getRoundLabel(rIdx, totalRounds)}
            </div>
            <div className="bracket-matches" style={{ gap: getGap(rIdx, rounds, totalRounds) }}>
              {round.map((match, mIdx) => {
                const matchData = state.matches[match.id] || match
                return (
                  <div key={match.id} className="bracket-match-wrapper">
                    <MatchCard
                      match={matchData}
                      team1={getTeam(matchData.team1)}
                      team2={getTeam(matchData.team2)}
                      onClick={() => {
                        if (matchData.isBye || matchData.status === 'bye') return
                        if (!matchData.team1 || !matchData.team2) return
                        onMatchSelect(matchData)
                      }}
                    />
                    {rIdx < rounds.length - 1 && (
                      <div className="bracket-connector">
                        <ConnectorLine matchIdx={mIdx} roundIdx={rIdx} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getGap(rIdx, rounds, totalRounds) {
  // Increase gap exponentially as rounds progress
  const base = 8
  return `${base * Math.pow(2, rIdx)}px`
}

function ConnectorLine({ matchIdx, roundIdx }) {
  const isTop = matchIdx % 2 === 0
  return (
    <svg width="32" height="100%" style={{ overflow: 'visible', position: 'absolute', left: 180 }}>
      <line
        x1="0" y1="18"
        x2="32" y2={isTop ? 18 : -14}
        stroke="#bdbdbd"
        strokeWidth="2"
      />
    </svg>
  )
}

export default TournamentBracket
