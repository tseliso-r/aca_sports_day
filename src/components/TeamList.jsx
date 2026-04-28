import React from 'react'
import { useGame } from '../context/GameContext'
import { getFlagUrl } from '../data/countries'

function TeamList({ sport, isAdmin = false }) {
  const { state, deleteTeam } = useGame()
  const teams = state.teams[sport] || []

  if (teams.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">👥</div>
        <h3>No teams registered yet</h3>
        <p>Be the first to register a team!</p>
      </div>
    )
  }

  return (
    <div className="teams-grid">
      {teams.map(team => (
        <div key={team.id} className={`team-card ${team.forfeited ? 'forfeited' : ''}`}>
          <img
            src={getFlagUrl(team.countryCode)}
            alt={team.country}
            className="team-flag"
          />
          <div className="team-country">{team.country}</div>
          {team.forfeited && (
            <span style={{ color: '#e64a19', fontSize: '0.75rem', fontWeight: 700 }}>FORFEITED</span>
          )}
          <ul className="team-player-list">
            {team.players.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
          {isAdmin && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (window.confirm(`Delete team ${team.country}?`)) {
                  deleteTeam(sport, team.id)
                }
              }}
            >
              🗑 Delete
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default TeamList
