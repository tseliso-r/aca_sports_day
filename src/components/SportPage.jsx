import React, { useState } from 'react'
import { useGame } from '../context/GameContext'
import TeamRegistration from './TeamRegistration'
import TeamList from './TeamList'
import TournamentBracket from './TournamentBracket'
import ScoreEntry from './ScoreEntry'

const SPORT_CONFIG = {
  padel: {
    icon: '🎾',
    label: 'Padel',
    description: 'Register 2-player teams and compete in a bracket tournament',
    className: 'padel',
  },
  volleyball: {
    icon: '🏐',
    label: 'Volleyball',
    description: 'Register 5-6 player teams and compete in a bracket tournament',
    className: 'volleyball',
  },
  football: {
    icon: '⚽',
    label: 'Five-a-side Football',
    description: 'Register 5-player teams and compete in a bracket tournament',
    className: 'football',
  },
}

function SportPage({ sport }) {
  const { state } = useGame()
  const [selectedMatch, setSelectedMatch] = useState(null)
  const cfg = SPORT_CONFIG[sport]
  const tournament = state.tournaments[sport]
  const isStarted = tournament?.started

  return (
    <div>
      <div className={`sport-header ${cfg.className}`}>
        <h1>{cfg.icon} {cfg.label}</h1>
        <p>{cfg.description}</p>
      </div>

      {!isStarted && (
        <div className="sport-content">
          <div className="card">
            <div className="card-header">Register a Team</div>
            <div className="card-body">
              <TeamRegistration sport={sport} />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              Registered Teams
              <span style={{ fontWeight: 400, color: '#757575', fontSize: '0.85rem' }}>
                {(state.teams[sport] || []).length} teams
              </span>
            </div>
            <div className="card-body">
              <TeamList sport={sport} />
            </div>
          </div>
        </div>
      )}

      {isStarted && (
        <TournamentBracket
          sport={sport}
          onMatchSelect={setSelectedMatch}
        />
      )}

      {selectedMatch && (
        <ScoreEntry
          match={selectedMatch}
          sport={sport}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  )
}

export default SportPage
