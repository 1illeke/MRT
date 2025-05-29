import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { fetchPlayerStats, getMockPlayerData, clearPlayerCache, calculateStatsFromMatches } from '../utils/api'
import PlayerCard from '../components/profile/PlayerCard'
import RSProgressionChart from '../components/profile/RSProgressionChart'
import StatsDisplay from '../components/profile/StatsDisplay'
import MatchHistory from '../components/profile/MatchHistory'

const ProfilePage = () => {
  const { currentPlayer, apiKey } = useUser()
  const [playerData, setPlayerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cacheInfo, setCacheInfo] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  
  const getPlayerData = async (forceRefresh = false) => {
    if (!currentPlayer) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    setError(null)
    setCacheInfo(null)
    
    try {
      // Clear cache if force refresh
      if (forceRefresh) {
        clearPlayerCache(currentPlayer)
      }
      
      // Fetch basic player data
      const data = await fetchPlayerStats(currentPlayer, apiKey)
      
      // Set cache info for display
      if (data.isFromCache) {
        const ageInMinutes = Math.round(data.cacheAge / (1000 * 60))
        setCacheInfo({
          isFromCache: true,
          ageInMinutes,
          isOutdated: ageInMinutes > 5 // Consider outdated after 5 minutes
        })
      } else {
        setCacheInfo({ isFromCache: false })
      }

      // Fetch comprehensive stats from match history
      setStatsLoading(true)
      try {
        const calculatedStats = await calculateStatsFromMatches(currentPlayer, apiKey)
        
        // Merge calculated stats with player data
        const mergedData = {
          ...data,
          overall_stats: calculatedStats.overall_stats,
          ranked_stats: calculatedStats.ranked_stats,
          unranked_stats: calculatedStats.unranked_stats,
          hero_stats: calculatedStats.hero_stats,
          random_stats: calculatedStats.random_stats,
          total_matches_analyzed: calculatedStats.total_matches_analyzed,
          last_match_timestamp: calculatedStats.last_match_timestamp
        }
        
        setPlayerData(mergedData)
        
        // Update cache info if stats were also cached
        if (calculatedStats.isFromCache && !data.isFromCache) {
          const statsAgeInMinutes = Math.round(calculatedStats.cacheAge / (1000 * 60))
          setCacheInfo({
            isFromCache: true,
            ageInMinutes: statsAgeInMinutes,
            isOutdated: statsAgeInMinutes > 5
          })
        }
      } catch (statsError) {
        console.warn('Failed to calculate comprehensive stats, using basic data:', statsError)
        setPlayerData(data)
      }
      
    } catch (err) {
      console.error('Failed to fetch player data:', err)
      setError('Failed to load player data. Using mock data instead.')
      
      // Fall back to mock data for development/demo
      const mockData = getMockPlayerData()
      setPlayerData(mockData)
      setCacheInfo({ isFromCache: false })
    } finally {
      setLoading(false)
      setStatsLoading(false)
      setRefreshing(false)
    }
  }
  
  const handleRefresh = async () => {
    setRefreshing(true)
    await getPlayerData(true) // Force refresh
  }
  
  useEffect(() => {
    getPlayerData()
  }, [currentPlayer, apiKey])
  
  if (!currentPlayer) {
    return (
      <div className="pt-16 container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">No Player Selected</h2>
          <p className="text-gray-400">Please search for a player or set a default player in Settings.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="pt-16 container mx-auto px-4 py-8 max-w-5xl">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">{currentPlayer}'s Profile</h1>
          {playerData?.total_matches_analyzed && (
            <p className="text-sm text-gray-400">
              Stats calculated from {playerData.total_matches_analyzed} matches
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          <svg 
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-black border border-error text-error rounded-md">
          {error}
        </div>
      )}

      {/* Cache Status Warning */}
      {cacheInfo?.isFromCache && (
        <div className={`mb-4 p-3 rounded-md border ${
          cacheInfo.isOutdated 
            ? 'bg-yellow-900/20 border-yellow-600 text-yellow-300' 
            : 'bg-blue-900/20 border-blue-600 text-blue-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18z"/>
                <path d="M12 8v5l4.25 2.52.77-1.28L13 12V8z"/>
              </svg>
              <span>
                {cacheInfo.isOutdated 
                  ? `⚠️ This profile data is ${cacheInfo.ageInMinutes} minutes old and may be outdated`
                  : `ℹ️ Showing cached data from ${cacheInfo.ageInMinutes} minute${cacheInfo.ageInMinutes !== 1 ? 's' : ''} ago`
                }
              </span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-sm underline hover:no-underline"
            >
              Refresh now
            </button>
          </div>
        </div>
      )}

      {/* Stats Loading Indicator */}
      {statsLoading && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-600 text-blue-300 rounded-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-t-2 border-r-2 border-blue-300 rounded-full animate-spin"></div>
            <span>Calculating comprehensive stats from match history...</span>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <div className="w-12 h-12 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading player data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Player Card */}
            <div className="md:col-span-1">
              <PlayerCard playerData={playerData} />
            </div>
            
            {/* Right Column - Stats */}
            <div className="md:col-span-2 space-y-6">
              <RSProgressionChart rsHistory={playerData?.player?.rsHistory} />
              <StatsDisplay playerData={playerData} />
            </div>
          </div>

          {/* Match History Section */}
          <MatchHistory 
            playerName={currentPlayer} 
            apiKey={apiKey}
          />
        </div>
      )}
    </div>
  )
}

export default ProfilePage