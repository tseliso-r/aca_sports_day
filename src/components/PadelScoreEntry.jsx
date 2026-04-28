import React, { useState } from 'react'
import { useGame } from '../context/GameContext'
import { getFlagUrl } from '../data/countries'
import {
  createInitialGameState,
  addPoint,
  removePoint,
  getPointDisplay,
} from '../utils/padelScoring'

function PadelScoreEntry({ match, onClose }) {
  const { state, updateMatch, advanceMatchWinner } = useGame()
  const teams = state.teams[match.sport] || []
  const team1 = teams.find(t => t.id === match.team1)
  const team2 = teams.find(t => t.id === match.team2)

  const [gameState, setGameState] = useState(() => {
    if (match.score?.padelState) return match.score.padelState
    return createInitialGameState()
  })

  const display = getPointDisplay(gameState)

  function handlePoint(team) {
    const next = addPoint(gameState, team)
    setGameState(next)

    const scoreData = {
      team1Games: next.team1Games,
      team2Games: next.team2Games,
      padelState: next,
    }

    if (next.setWon) {
      updateMatch(match.id, {
        score: scoreData,
        status: 'completed',
        winner: next.setWinner === 'team1' ? match.team1 : match.team2,
      })
      advanceMatchWinner(
        match.sport,
        match.id,
        next.setWinner === 'team1' ? match.team1 : match.team2
      )
    } else {
      updateMatch(match.id, {
        score: scoreData,
        status: 'in-progress',
      })
    }
  }

  function handleUndo(team) {
    const next = removePoint(gameState, team)
    setGameState(next)
    const scoreData = {
      team1Games: next.team1Games,
      team2Games: next.team2Games,
      padelState: next,
    }
    updateMatch(match.id, { score: scoreData, status: 'in-progress' })
  }

  const isComplete = gameState.setWon
  const winner = isComplete
    ? (gameState.setWinner === 'team1' ? team1 : team2)
    : null

  function getPointClass(val) {
    if (val === 'DEUCE' || val === '40' && display.status === 'DEUCE') return 'deuce-text'
    if (val === 'ADV') return 'adv-text'
    if (val === 'GD') return 'golden-text'
    return ''
  }

  return (
    <div className="padel-scoreboard">
      {/* Set Score */}
      <div className="set-scores">
        <div className="set-team">
          {team1 && <img src={getFlagUrl(team1.countryCode)} alt="" className="set-team-flag" />}
          <div className="set-team-name">{team1?.country || 'Team 1'}</div>
          <div className="set-games-count" style={{ color: '#00897b' }}>{gameState.team1Games}</div>
        </div>
        <div className="set-divider">–</div>
        <div className="set-team">
          {team2 && <img src={getFlagUrl(team2.countryCode)} alt="" className="set-team-flag" />}
          <div className="set-team-name">{team2?.country || 'Team 2'}</div>
          <div className="set-games-count" style={{ color: '#00897b' }}>{gameState.team2Games}</div>
        </div>
      </div>

      {/* Status badges */}
      {display.status === 'DEUCE' && (
        <div className="padel-status-badge status-deuce">🔥 DEUCE</div>
      )}
      {display.status === 'GOLDEN DEUCE' && (
        <div className="padel-status-badge status-golden">⚡ GOLDEN DEUCE – Next point wins!</div>
      )}
      {display.status === 'ADVANTAGE' && (
        <div className="padel-status-badge status-adv">
          ★ ADVANTAGE: {display.team1 === 'ADV' ? (team1?.country || 'Team 1') : (team2?.country || 'Team 2')}
        </div>
      )}
      {display.status === 'TIEBREAK' && (
        <div className="padel-status-badge status-adv">🎯 TIEBREAK</div>
      )}

      {/* Current game score */}
      {!isComplete && (
        <div className="game-score-display">
          <div className="game-score-title">Current Game</div>
          <div className="game-score-row">
            <div className="game-score-team">
              <div className={`game-score-points ${getPointClass(display.team1)}`}>
                {display.team1}
              </div>
            </div>
            <div className="game-score-vs">:</div>
            <div className="game-score-team">
              <div className={`game-score-points ${getPointClass(display.team2)}`}>
                {display.team2}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Winner banner */}
      {isComplete && winner && (
        <div className="match-won-banner">
          <h3>🏆 {winner.country} wins the set!</h3>
          <p>Final: {gameState.team1Games} – {gameState.team2Games}</p>
        </div>
      )}

      {/* Controls */}
      {!isComplete && (
        <div className="score-controls">
          <div className="score-team-control">
            {team1 && <img src={getFlagUrl(team1.countryCode)} alt="" width="32" height="21" style={{ borderRadius: 2, objectFit: 'cover' }} />}
            <div className="score-team-control-name">{team1?.country || 'Team 1'}</div>
            <button className="score-btn score-btn-plus" onClick={() => handlePoint('team1')}>+</button>
            <button className="score-btn score-btn-minus" onClick={() => handleUndo('team1')}>−</button>
          </div>
          <div className="score-team-control">
            {team2 && <img src={getFlagUrl(team2.countryCode)} alt="" width="32" height="21" style={{ borderRadius: 2, objectFit: 'cover' }} />}
            <div className="score-team-control-name">{team2?.country || 'Team 2'}</div>
            <button className="score-btn score-btn-plus" onClick={() => handlePoint('team2')}>+</button>
            <button className="score-btn score-btn-minus" onClick={() => handleUndo('team2')}>−</button>
          </div>
        </div>
      )}

      {isComplete && (
        <button className="btn btn-padel btn-full" onClick={onClose}>
          Close & Continue
        </button>
      )}
    </div>
  )
}

export default PadelScoreEntry
