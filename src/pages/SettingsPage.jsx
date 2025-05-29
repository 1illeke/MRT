import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { fetchPlayerStats } from '../utils/api'

const SettingsPage = () => {
  const navigate = useNavigate()
  const { defaultPlayer, setDefaultPlayer, setCurrentPlayer, apiKey } = useUser()
  
  const [playerInput, setPlayerInput] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  
  // Handle icon path - convert relative paths to full URLs or use placeholder
  const getIconUrl = (iconPath) => {
    if (!iconPath) {
      return 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1'
    }
    if (iconPath.startsWith('/')) {
      return `https://marvelrivalsapi.com/rivals${iconPath}`
    }
    
    // Fallback to placeholder if path format is unexpected
    return 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1'
  }
  
  useEffect(() => {
    // Initialize form with stored values
    setPlayerInput(defaultPlayer || '')
    
    // Fetch real player data for preview
    if (defaultPlayer) {
      loadPreviewData(defaultPlayer)
    }
  }, [defaultPlayer])

  const loadPreviewData = async (playerName) => {
    if (!playerName) {
      setPreviewData(null)
      return
    }

    setPreviewLoading(true)
    try {
      const data = await fetchPlayerStats(playerName, apiKey)
      setPreviewData(data)
    } catch (error) {
      console.error('Failed to load preview data:', error)
      // Fallback to a basic preview
      setPreviewData({
        player: {
          name: playerName,
          icon: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1'
        }
      })
    } finally {
      setPreviewLoading(false)
    }
  }
  
  const handleSaveSettings = () => {
    setDefaultPlayer(playerInput)
    setCurrentPlayer(playerInput)
    
    // Show saved message and start countdown
    setSavedMessage('Settings saved successfully! Redirecting to profile...')
    setCountdown(3)
    
    // Load preview data for the new player
    if (playerInput) {
      loadPreviewData(playerInput)
    } else {
      setPreviewData(null)
    }

    // Start countdown and redirect
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          navigate('/profile')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
  
  return (
    <div className="pt-16 container mx-auto px-4 py-8 max-w-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Settings</h2>
      
      {/* Preview section */}
      {previewData && (
        <div className="mb-8 flex flex-col items-center">
          {previewLoading ? (
            <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-white mb-2 animate-pulse"></div>
          ) : (
            <img 
              src={getIconUrl(previewData.player.icon)} 
              alt="Player Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-white mb-2"
              onError={(e) => {
                e.target.src = 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1'
              }}
            />
          )}
          <p className="text-lg font-medium">{previewData.player.name}</p>
          {previewData.player.level && (
            <p className="text-sm text-gray-400">Level {previewData.player.level}</p>
          )}
        </div>
      )}
      
      {/* Settings Card */}
      <div className="bg-black border border-gray-800 rounded-lg p-6">
        {savedMessage && (
          <div className="mb-4 p-3 bg-black border border-success text-success text-sm rounded text-center">
            {savedMessage}
            {countdown > 0 && (
              <div className="mt-2">
                <span className="text-lg font-bold text-blue-400">{countdown}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="defaultPlayer" className="block text-sm font-medium text-gray-300 mb-2">
            Default Player (Name or UID)
          </label>
          <input
            type="text"
            id="defaultPlayer"
            className="w-full h-10 bg-black border border-gray-700 rounded-md px-4 py-2 text-sm focus:border-white transition-colors"
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            placeholder="Enter player name or UID"
            disabled={countdown > 0}
          />
          <p className="mt-1 text-xs text-gray-500">
            Set your default player to automatically load their profile.
          </p>
        </div>
        
        <button
          onClick={handleSaveSettings}
          disabled={countdown > 0}
          className="w-full bg-white text-black font-medium py-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {countdown > 0 ? 'Redirecting...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

export default SettingsPage