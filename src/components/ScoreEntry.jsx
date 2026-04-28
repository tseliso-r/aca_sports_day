import React from 'react'
import PadelScoreEntry from './PadelScoreEntry'
import RegularScoreEntry from './RegularScoreEntry'

function ScoreEntry({ match, sport, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <h2>
            {sport === 'padel' ? '🎾' : sport === 'volleyball' ? '🏐' : '⚽'}
            {' '}Score Entry
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {sport === 'padel' ? (
            <PadelScoreEntry match={match} onClose={onClose} />
          ) : (
            <RegularScoreEntry match={match} sport={sport} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  )
}

export default ScoreEntry
