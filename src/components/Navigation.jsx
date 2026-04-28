import React from 'react'

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'padel', label: 'Padel', icon: '🎾' },
  { id: 'volleyball', label: 'Volleyball', icon: '🏐' },
  { id: 'football', label: 'Football', icon: '⚽' },
  { id: 'admin', label: 'Admin', icon: '🔑' },
]

function Navigation({ currentPage, setPage }) {
  return (
    <nav className="nav">
      <div className="nav-brand">🏆 ACA Sports Day</div>
      <div className="nav-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${currentPage === tab.id ? `active-${tab.id}` : ''}`}
            onClick={() => setPage(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export default Navigation
