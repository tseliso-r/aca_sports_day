import React from 'react'
import { useGame } from '../context/GameContext'
import { getFlagUrl } from '../data/countries'

const SPORT_CONFIG = {
  padel: { icon: '🎾', label: 'Padel', playersPerTeam: 2 },
  volleyball: { icon: '🏐', label: 'Volleyball', playersPerTeam: '5-6' },
  football: { icon: '⚽', label: 'Football', playersPerTeam: 5 },
}

function HomePage({ setPage }) {
  const { state } = useGame()

  const activeMatches = Object.values(state.matches).filter(
    m => m.status === 'in-progress'
  )

  return (
    <div>
      <div className="home-hero">
        <h1>🏆 ACA Sports Day</h1>
        <p>Track teams, brackets, and live scores across all sports</p>
      </div>

      <div className="stats-grid">
        {Object.entries(SPORT_CONFIG).map(([sport, cfg]) => {
          const teamCount = (state.teams[sport] || []).length
          const tournament = state.tournaments[sport]
          return (
            <div key={sport} className={`stat-card ${sport}`}>
              <div className="stat-card-icon">{cfg.icon}</div>
              <div className="stat-card-label">{cfg.label}</div>
              <div className="stat-card-value">{teamCount}</div>
              <div className="stat-card-sub">
                {tournament?.started ? '🟢 Tournament started' : '⏳ Awaiting start'}
              </div>
            </div>
          )
        })}
        <div className="stat-card">
          <div className="stat-card-icon">⚡</div>
          <div className="stat-card-label">Active Matches</div>
          <div className="stat-card-value">{activeMatches.length}</div>
          <div className="stat-card-sub">In progress right now</div>
        </div>
      </div>

      <div className="section-title">Quick Navigation</div>
      <div className="sport-nav-grid">
        {Object.entries(SPORT_CONFIG).map(([sport, cfg]) => (
          <button
            key={sport}
            className={`sport-nav-btn ${sport}-btn`}
            onClick={() => setPage(sport)}
          >
            <span className="btn-icon">{cfg.icon}</span>
            <span>{cfg.label}</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              {(state.teams[sport] || []).length} teams registered
            </span>
          </button>
        ))}
      </div>

      {activeMatches.length > 0 && (
        <>
          <div className="section-title">Active Matches</div>
          <div className="active-matches-list">
            {activeMatches.map(match => {
              const t1 = (state.teams[match.sport] || []).find(t => t.id === match.team1)
              const t2 = (state.teams[match.sport] || []).find(t => t.id === match.team2)
              return (
                <div key={match.id} className="active-match-item">
                  <span className={`active-match-sport ${match.sport}`}>
                    {SPORT_CONFIG[match.sport]?.icon} {SPORT_CONFIG[match.sport]?.label}
                  </span>
                  <div className="flex-row">
                    {t1 && <img src={getFlagUrl(t1.countryCode)} alt="" width="24" height="16" style={{ borderRadius: 2, objectFit: 'cover' }} />}
                    <span style={{ fontWeight: 600 }}>{t1?.country || 'TBD'}</span>
                  </div>
                  <span style={{ color: '#999' }}>vs</span>
                  <div className="flex-row">
                    {t2 && <img src={getFlagUrl(t2.countryCode)} alt="" width="24" height="16" style={{ borderRadius: 2, objectFit: 'cover' }} />}
                    <span style={{ fontWeight: 600 }}>{t2?.country || 'TBD'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {activeMatches.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">⚽</div>
          <h3>No active matches</h3>
          <p>Register teams and start a tournament to begin</p>
        </div>
      )}
    </div>
  )
}

export default HomePage
