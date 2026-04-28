import React, { useState } from 'react'
import { useGame } from '../context/GameContext'
import { getFlagUrl } from '../data/countries'
import { detectStage, getGamesNeededToWin } from '../utils/tournamentUtils'

function RegularScoreEntry({ match, sport, onClose }) {
  const { state, updateMatch, advanceMatchWinner } = useGame()
  const teams = state.teams[sport] || []
  const team1 = teams.find(t => t.id === match.team1)
  const team2 = teams.find(t => t.id === match.team2)

  const stage = detectStage(match.roundIndex || 0, match.totalRounds || 1)
  const gamesNeeded = getGamesNeededToWin(stage, sport)
  const isFinal = stage === 'final'
  const totalGamesInSeries = isFinal ? 6 : (stage === 'semifinal' ? 7 : 5)

  const [score, setScore] = useState(() => {
    if (match.score?.regularState) return match.score.regularState
    return {
      team1GamesWon: 0,
      team2GamesWon: 0,
      currentGame: { team1: 0, team2: 0 },
      gameHistory: [],
      matchWinner: null,
    }
  })

  const { team1GamesWon, team2GamesWon, currentGame, gameHistory, matchWinner } = score
  const currentGameNum = gameHistory.length + 1

  function checkMatchWinner(t1Won, t2Won, history) {
    if (isFinal) {
      if (history.length === 6) {
        return t1Won > t2Won ? match.team1 : (t2Won > t1Won ? match.team2 : null)
      }
      return null
    }
    if (t1Won >= gamesNeeded) return match.team1
    if (t2Won >= gamesNeeded) return match.team2
    // If all games played in series exhausted
    const remaining = totalGamesInSeries - history.length
    if (remaining === 0) {
      return t1Won > t2Won ? match.team1 : (t2Won > t1Won ? match.team2 : null)
    }
    return null
  }

  function adjustCurrentScore(team, delta) {
    if (matchWinner) return
    const next = Math.max(0, currentGame[team] + delta)
    const newCurrent = { ...currentGame, [team]: next }
    const newScore = { ...score, currentGame: newCurrent }
    setScore(newScore)
    updateMatch(match.id, {
      score: { ...newScore, regularState: newScore },
      status: 'in-progress',
    })
  }

  function endCurrentGame() {
    if (matchWinner) return
    const newHistory = [...gameHistory, { ...currentGame, gameNum: currentGameNum }]
    const t1Wins = currentGame.team1 > currentGame.team2 ? team1GamesWon + 1 : team1GamesWon
    const t2Wins = currentGame.team2 > currentGame.team1 ? team2GamesWon + 1 : team2GamesWon
    const winner = checkMatchWinner(t1Wins, t2Wins, newHistory)

    const newScore = {
      team1GamesWon: t1Wins,
      team2GamesWon: t2Wins,
      currentGame: { team1: 0, team2: 0 },
      gameHistory: newHistory,
      matchWinner: winner,
    }
    setScore(newScore)

    const matchData = {
      score: { ...newScore, regularState: newScore, team1GamesWon: t1Wins, team2GamesWon: t2Wins },
      status: winner ? 'completed' : 'in-progress',
    }
    if (winner) {
      matchData.winner = winner
    }
    updateMatch(match.id, matchData)

    if (winner) {
      advanceMatchWinner(sport, match.id, winner)
    }
  }

  const canEndGame = !matchWinner && (
    isFinal
      ? currentGameNum <= 6
      : true
  )

  const winnerTeam = matchWinner === match.team1 ? team1 : (matchWinner === match.team2 ? team2 : null)

  const stageLabel = stage === 'final' ? 'Final' : stage === 'semifinal' ? 'Semi-final' : 'Round'

  return (
    <div className="regular-scoreboard">
      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#757575', fontWeight: 600, marginBottom: 4 }}>
        {stageLabel} · {sport === 'volleyball' ? '🏐' : '⚽'}
        {isFinal && ' · Play all 6 games'}
        {stage === 'semifinal' && ' · First to 4 games'}
        {stage === 'regular' && ' · First to 3 games'}
        {stage === 'quarterfinal' && ' · First to 3 games'}
      </div>

      {/* Series Status */}
      <div className="series-status">
        <div className="series-team">
          {team1 && <img src={getFlagUrl(team1.countryCode)} alt="" className="series-team-flag" />}
          <div className="series-team-name">{team1?.country || 'Team 1'}</div>
          <div className={`series-games-won ${team1GamesWon > team2GamesWon ? 'leading' : ''}`}>
            {team1GamesWon}
          </div>
        </div>
        <div className="series-divider">GAMES</div>
        <div className="series-team">
          {team2 && <img src={getFlagUrl(team2.countryCode)} alt="" className="series-team-flag" />}
          <div className="series-team-name">{team2?.country || 'Team 2'}</div>
          <div className={`series-games-won ${team2GamesWon > team1GamesWon ? 'leading' : ''}`}>
            {team2GamesWon}
          </div>
        </div>
      </div>

      {/* Match won */}
      {winnerTeam && (
        <div className="match-won-banner">
          <h3>🏆 {winnerTeam.country} wins the match!</h3>
          <p>Series: {team1GamesWon} – {team2GamesWon}</p>
        </div>
      )}

      {/* Current Game */}
      {!matchWinner && (
        <div className="current-game-box">
          <div className="current-game-label">Game {currentGameNum}</div>
          <div className="current-game-scores">
            <div className="game-team-col">
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{team1?.country || 'Team 1'}</div>
              <div className="game-score-number">{currentGame.team1}</div>
              <div className="game-controls-row">
                <button className="score-btn score-btn-plus" onClick={() => adjustCurrentScore('team1', 1)}>+</button>
                <button className="score-btn score-btn-minus" onClick={() => adjustCurrentScore('team1', -1)} disabled={currentGame.team1 === 0}>−</button>
              </div>
            </div>
            <div className="game-score-vs-text">:</div>
            <div className="game-team-col">
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{team2?.country || 'Team 2'}</div>
              <div className="game-score-number">{currentGame.team2}</div>
              <div className="game-controls-row">
                <button className="score-btn score-btn-plus" onClick={() => adjustCurrentScore('team2', 1)}>+</button>
                <button className="score-btn score-btn-minus" onClick={() => adjustCurrentScore('team2', -1)} disabled={currentGame.team2 === 0}>−</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End game button */}
      {!matchWinner && canEndGame && (
        <div className="end-game-btn-row">
          <button
            className={`btn btn-${sport === 'volleyball' ? 'volleyball' : 'football'} btn-full`}
            onClick={endCurrentGame}
          >
            ✓ End Game {currentGameNum}
          </button>
        </div>
      )}

      {/* Games history */}
      {gameHistory.length > 0 && (
        <div>
          <div className="section-title" style={{ fontSize: '0.9rem' }}>Completed Games</div>
          <div className="games-history">
            {gameHistory.map((g, i) => {
              const t1wins = g.team1 > g.team2
              const t2wins = g.team2 > g.team1
              return (
                <div key={i} className="game-history-item">
                  <span className="game-history-num">Game {i + 1}</span>
                  <span className="game-history-score">{g.team1} – {g.team2}</span>
                  <span className="game-history-winner">
                    {t1wins ? `${team1?.country || 'T1'} ✓` : t2wins ? `${team2?.country || 'T2'} ✓` : 'Draw'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {matchWinner && (
        <button className={`btn btn-${sport === 'volleyball' ? 'volleyball' : 'football'} btn-full`} onClick={onClose}>
          Close & Continue
        </button>
      )}
    </div>
  )
}

export default RegularScoreEntry
