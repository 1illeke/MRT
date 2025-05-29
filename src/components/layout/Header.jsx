import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '../../context/UserContext'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { searchInput, setSearchInput, setCurrentPlayer } = useUser()
  
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setCurrentPlayer(searchInput.trim())
      navigate('/profile')
    }
  }
  
  return (
    <header className="h-16 bg-black border-b border-gray-800 w-full px-4 flex items-center justify-between fixed top-0 z-10">
      {/* Logo */}
      <div 
        className="font-bold text-2xl cursor-pointer"
        onClick={() => navigate('/')}
      >
        MR
      </div>
      
      {/* Search (only on Profile view) */}
      {location.pathname === '/profile' && (
        <form onSubmit={handleSearch} className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-xs">
          <input
            type="text"
            placeholder="Enter username or UID..."
            className="w-full h-10 bg-black border border-gray-700 rounded-md px-4 py-2 text-sm focus:border-white transition-colors"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      )}
      
      {/* Navigation */}
      <nav className="flex items-center space-x-6">
        <button
          className={`text-sm font-medium hover:underline ${location.pathname === '/profile' ? 'text-white' : 'text-gray-400'}`}
          onClick={() => navigate('/profile')}
        >
          Profile
        </button>
        <button
          className={`text-sm font-medium hover:underline ${location.pathname === '/match' ? 'text-white' : 'text-gray-400'}`}
          onClick={() => navigate('/match')}
        >
          Match
        </button>
        <button
          className={`hover:text-white ${location.pathname === '/settings' ? 'text-white' : 'text-gray-400'}`}
          onClick={() => navigate('/settings')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </nav>
    </header>
  )
}

export default Header