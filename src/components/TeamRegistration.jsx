import React, { useState, useRef, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import { COUNTRIES, getFlagUrl } from '../data/countries'

const SPORT_CONFIG = {
  padel: { minPlayers: 2, maxPlayers: 2, label: 'Padel', cls: 'padel' },
  volleyball: { minPlayers: 5, maxPlayers: 6, label: 'Volleyball', cls: 'volleyball' },
  football: { minPlayers: 5, maxPlayers: 5, label: 'Football', cls: 'football' },
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function TeamRegistration({ sport }) {
  const { state, registerTeam } = useGame()
  const cfg = SPORT_CONFIG[sport]
  const takenCodes = (state.teams[sport] || []).map(t => t.countryCode)

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [players, setPlayers] = useState(Array(cfg.minPlayers).fill(''))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    function onClickOut(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function selectCountry(c) {
    if (takenCodes.includes(c.code)) return
    setSelected(c)
    setSearch(c.name)
    setShowDropdown(false)
  }

  function setPlayer(i, val) {
    const arr = [...players]
    arr[i] = val
    setPlayers(arr)
  }

  function addPlayer() {
    if (players.length < cfg.maxPlayers) {
      setPlayers([...players, ''])
    }
  }

  function removePlayer(i) {
    if (players.length > cfg.minPlayers) {
      setPlayers(players.filter((_, idx) => idx !== i))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selected) {
      setError('Please select a country.')
      return
    }
    if (takenCodes.includes(selected.code)) {
      setError('This country is already registered for this sport.')
      return
    }
    const filled = players.filter(p => p.trim())
    if (filled.length < cfg.minPlayers) {
      setError(`Please enter at least ${cfg.minPlayers} player names.`)
      return
    }

    const teamData = {
      id: generateId(),
      country: selected.name,
      countryCode: selected.code,
      players: players.map(p => p.trim()).filter(Boolean),
      sport,
    }

    registerTeam(sport, teamData)
    setSuccess(`${selected.name} registered successfully!`)
    setSelected(null)
    setSearch('')
    setPlayers(Array(cfg.minPlayers).fill(''))
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <form className="registration-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="form-group">
        <label className="form-label">Country / Team Identity</label>
        <div className="country-search-container" ref={dropdownRef}>
          <input
            type="text"
            className={`form-input ${cfg.cls}`}
            placeholder="Search for a country..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setSelected(null)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            autoComplete="off"
          />
          {showDropdown && filtered.length > 0 && (
            <div className="country-dropdown">
              {filtered.map(c => (
                <div
                  key={c.code}
                  className={`country-option ${takenCodes.includes(c.code) ? 'disabled' : ''}`}
                  onClick={() => selectCountry(c)}
                >
                  <img src={getFlagUrl(c.code)} alt={c.name} />
                  <span>{c.name}</span>
                  {takenCodes.includes(c.code) && <span style={{ color: '#e64a19', fontSize: '0.75rem', marginLeft: 'auto' }}>Taken</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        {selected && (
          <div className="country-preview">
            <img src={getFlagUrl(selected.code)} alt={selected.name} />
            <span>{selected.name}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">
          Players ({cfg.minPlayers}{cfg.minPlayers !== cfg.maxPlayers ? `–${cfg.maxPlayers}` : ''} required)
        </label>
        <div className="player-inputs">
          {players.map((p, i) => (
            <div key={i} className="flex-row">
              <input
                type="text"
                className={`form-input ${cfg.cls}`}
                placeholder={`Player ${i + 1} name`}
                value={p}
                onChange={e => setPlayer(i, e.target.value)}
              />
              {players.length > cfg.minPlayers && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removePlayer(i)}
                  style={{ flexShrink: 0 }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {players.length < cfg.maxPlayers && (
            <button type="button" className="btn btn-outline btn-sm" onClick={addPlayer}>
              + Add Player
            </button>
          )}
        </div>
      </div>

      <button type="submit" className={`btn btn-${cfg.cls} btn-full`}>
        Register Team
      </button>
    </form>
  )
}

export default TeamRegistration
