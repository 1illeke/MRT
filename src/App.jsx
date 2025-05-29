import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import ProfilePage from './pages/ProfilePage'
import MatchPage from './pages/MatchPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {!isLanding && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App