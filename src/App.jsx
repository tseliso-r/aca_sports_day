import React, { useState } from 'react'
import { GameProvider } from './context/GameContext'
import Navigation from './components/Navigation'
import HomePage from './components/HomePage'
import SportPage from './components/SportPage'
import AdminPanel from './components/AdminPanel'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage setPage={setCurrentPage} />
      case 'padel': return <SportPage sport="padel" />
      case 'volleyball': return <SportPage sport="volleyball" />
      case 'football': return <SportPage sport="football" />
      case 'admin': return <AdminPanel />
      default: return <HomePage setPage={setCurrentPage} />
    }
  }

  return (
    <GameProvider>
      <div className="app">
        <Navigation currentPage={currentPage} setPage={setCurrentPage} />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </GameProvider>
  )
}

export default App
