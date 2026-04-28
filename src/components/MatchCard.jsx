import React from 'react'
import { getFlagUrl } from '../data/countries'

function MatchCard({ match, team1, team2, onClick }) {
  const isBye = match.isBye || match.status === 'bye'
  const isCompleted = match.status === 'completed' || match.status === 'forfeit'
  const isInProgress = match.status === 'in-progress'
  const waiting = !match.team1 || !match.team2

  let className = 'match-card'
  if (isBye) className += ' bye-match'
  else if (isCompleted) className += ' completed'
  else if (isInProgress) className += ' in-progress'

  const score = match.score || {}

  function getDisplayScore(teamKey) {
    if (!score) return ''
    if (match.sport === 'padel') {
      return score[`${teamKey}Games`] !== undefined ? String(score[`${teamKey}Games`]) : ''
    }
    const gamesWon = score[`${teamKey}GamesWon`]
    return gamesWon !== undefined ? String(gamesWon) : ''
  }

  return (
    <div className={className} onClick={onClick} title={waiting ? 'Waiting for teams' : ''}>
      <TeamRow
        team={team1}
        teamKey="team1"
        isWinner={match.winner === match.team1}
        score={getDisplayScore('team1')}
        showScore={isCompleted || isInProgress}
        isBye={!match.team1}
        waiting={waiting}
      />
      <TeamRow
        team={team2}
        teamKey="team2"
        isWinner={match.winner === match.team2}
        score={getDisplayScore('team2')}
        showScore={isCompleted || isInProgress}
        isBye={!match.team2}
        waiting={waiting}
      />
      {isBye && <div className="match-bye-label">BYE</div>}
    </div>
  )
}

function TeamRow({ team, isWinner, score, showScore, isBye, waiting }) {
  if (isBye) {
    return (
      <div className="match-team" style={{ opacity: 0.4, fontStyle: 'italic' }}>
        <span className="match-team-name">BYE</span>
      </div>
    )
  }
  if (!team) {
    return (
      <div className="match-team" style={{ opacity: 0.4 }}>
        <span className="match-team-name">TBD</span>
      </div>
    )
  }

  return (
    <div className={`match-team ${isWinner ? 'winner' : ''}`}>
      <img
        src={getFlagUrl(team.countryCode)}
        alt={team.country}
        className="match-team-flag"
      />
      <span className="match-team-name">{team.country}</span>
      {showScore && score !== '' && (
        <span className="match-team-score">{score}</span>
      )}
      {isWinner && <span style={{ fontSize: '0.7rem', marginLeft: 4 }}>✓</span>}
    </div>
  )
}

export default MatchCard
