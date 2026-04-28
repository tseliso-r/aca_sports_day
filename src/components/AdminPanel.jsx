import React, { useState } from 'react'
import { useGame } from '../context/GameContext'
import TeamList from './TeamList'
import { getFlagUrl } from '../data/countries'

const ADMIN_PASSWORD = 'admin123'

const SPORT_CONFIG = {
  padel: { icon: '🎾', label: 'Padel' },
  volleyball: { icon: '🏐', label: 'Volleyball' },
  football: { icon: '⚽', label: 'Football' },
}

function AdminPanel() {
  const { state, startTournament, deleteTeam, resetAll } = useGame()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true)
      setError('')
    } else {
      setError('Incorrect password.')
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-login-form">
        <h2>🔑 Admin Login</h2>
        <form onSubmit={handleLogin} className="registration-form">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Login</button>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🔑 Admin Panel</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              if (window.confirm('Reset ALL data? This cannot be undone.')) {
                resetAll()
              }
            }}
          >
            🗑 Reset All Data
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setIsLoggedIn(false)}>
            Logout
          </button>
        </div>
      </div>

      {Object.entries(SPORT_CONFIG).map(([sport, cfg]) => {
        const tournament = state.tournaments[sport]
        const isStarted = tournament?.started
        const teams = state.teams[sport] || []

        return (
          <div key={sport} className="admin-section">
            <div className="admin-section-header">
              {cfg.icon} {cfg.label}
            </div>
            <div className="admin-section-body">
              <div className="start-tournament-row">
                <div>
                  <span className={`tournament-status-badge ${isStarted ? 'badge-started' : 'badge-not-started'}`}>
                    {isStarted ? '🟢 Started' : '⏳ Not Started'}
                  </span>
                  <span style={{ marginLeft: 12, fontSize: '0.85rem', color: '#757575' }}>
                    {teams.length} team{teams.length !== 1 ? 's' : ''} registered
                  </span>
                </div>
                {!isStarted && (
                  <button
                    className={`btn btn-${sport} btn-sm`}
                    disabled={teams.length < 2}
                    onClick={() => {
                      if (window.confirm(`Start the ${cfg.label} tournament with ${teams.length} teams?`)) {
                        startTournament(sport)
                      }
                    }}
                    title={teams.length < 2 ? 'Need at least 2 teams' : ''}
                  >
                    🚀 Start Tournament
                  </button>
                )}
              </div>

              {teams.length > 0 && (
                <>
                  <hr className="divider" />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Teams</div>
                  {teams.map(team => (
                    <div key={team.id} className="admin-team-row">
                      <img src={getFlagUrl(team.countryCode)} alt={team.country} />
                      <span className="admin-team-row-name">
                        {team.country}
                        {team.forfeited && <span style={{ color: '#e64a19', marginLeft: 6, fontSize: '0.75rem' }}>FORFEITED</span>}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#9e9e9e' }}>
                        {team.players.join(', ')}
                      </span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (window.confirm(`Delete team ${team.country}?`)) {
                            deleteTeam(sport, team.id)
                          }
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AdminPanel
