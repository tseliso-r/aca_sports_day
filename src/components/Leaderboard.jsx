import React from 'react'
import { useGame } from '../context/GameContext'
import { getFlagUrl } from '../data/countries'

function Leaderboard({ sport }) {
  const { state } = useGame()
  const tournament = state.tournaments[sport]
  const teams = state.teams[sport] || []

  if (!tournament?.started) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h3>Tournament not started</h3>
        <p>Standings will appear once the tournament begins.</p>
      </div>
    )
  }

  // Build standings from matches
  const standings = {}
  teams.forEach(t => {
    standings[t.id] = { team: t, wins: 0, losses: 0, played: 0 }
  })

  Object.values(state.matches).forEach(m => {
    if (m.sport !== sport || !m.winner || m.status === 'bye') return
    if (m.team1 && standings[m.team1]) {
      standings[m.team1].played++
      if (m.winner === m.team1) standings[m.team1].wins++
      else standings[m.team1].losses++
    }
    if (m.team2 && standings[m.team2]) {
      standings[m.team2].played++
      if (m.winner === m.team2) standings[m.team2].wins++
      else standings[m.team2].losses++
    }
  })

  const sorted = Object.values(standings).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    return a.losses - b.losses
  })

  return (
    <div className="card">
      <div className="card-header">📊 Standings</div>
      <div className="card-body" style={{ padding: 0 }}>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Played</th>
              <th>Won</th>
              <th>Lost</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row.team.id} className={i === 0 && row.wins > 0 ? 'champion' : ''}>
                <td className="leaderboard-rank">
                  {i === 0 && row.wins > 0 ? '🏆' : i + 1}
                </td>
                <td>
                  <div className="leaderboard-team">
                    <img src={getFlagUrl(row.team.countryCode)} alt="" className="leaderboard-flag" />
                    {row.team.country}
                  </div>
                </td>
                <td>{row.played}</td>
                <td style={{ color: '#2e7d32', fontWeight: 700 }}>{row.wins}</td>
                <td style={{ color: '#c62828' }}>{row.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Leaderboard
