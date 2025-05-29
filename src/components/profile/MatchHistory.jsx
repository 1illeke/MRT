import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { fetchMatchHistory, formatMatchDuration } from '../../utils/api'

const MatchHistory = ({ playerName, apiKey }) => {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  const pageSize = 10

  useEffect(() => {
    const getMatchHistory = async () => {
      if (!playerName) return

      setLoading(true)
      setError(null)

      try {
        const data = await fetchMatchHistory(playerName, apiKey, { 
          page: currentPage, 
          limit: pageSize 
        })
        setMatches(data.match_history || [])
        setPagination(data.pagination)
      } catch (err) {
        console.error('Failed to fetch match history:', err)
        setError('Failed to load match history')
        setMatches([])
      } finally {
        setLoading(false)
      }
    }

    getMatchHistory()
  }, [playerName, apiKey, currentPage])

  const getHeroImageUrl = (heroType) => {
    if (!heroType) return null
    if (heroType.startsWith('/')) {
      return `https://marvelrivalsapi.com/rivals${heroType}`
    }
    return heroType
  }

  const getMapImageUrl = (mapThumbnail) => {
    if (!mapThumbnail) return null
    if (mapThumbnail.startsWith('/')) {
      return `https://marvelrivalsapi.com/rivals${mapThumbnail}`
    }
    return mapThumbnail
  }

  const formatResult = (isWin) => {
    return isWin ? 'Victory' : 'Defeat'
  }

  const getResultColor = (isWin) => {
    return isWin ? 'text-green-400' : 'text-red-400'
  }

  const formatMatchDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateKDA = (kills, deaths, assists) => {
    if (!deaths || deaths === 0) return (kills + assists).toFixed(2)
    return ((kills + assists) / deaths).toFixed(2)
  }

  const handleViewMatch = (matchUid) => {
    navigate(`/match?id=${matchUid}`)
  }

  if (!playerName) {
    return (
      <div className="bg-black border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Match History</h3>
        <p className="text-gray-400">No player selected</p>
      </div>
    )
  }

  return (
    <div className="bg-black border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Match History</h3>
        {pagination && (
          <span className="text-sm text-gray-400">
            {pagination.total_matches} total matches
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No matches found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {matches.map((match, index) => {
              const player = match.match_player
              const hero = player?.player_hero
              const isWin = player?.is_win?.is_win || false

              return (
                <div 
                  key={`${match.match_uid}_${index}`}
                  className={`border rounded-lg p-4 transition-colors ${
                    isWin ? 'border-green-800 bg-green-900/10' : 'border-red-800 bg-red-900/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left side - Hero and result */}
                    <div className="flex items-center space-x-4">
                      {hero?.hero_type && (
                        <img
                          src={getHeroImageUrl(hero.hero_type)}
                          alt={hero.hero_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                          onError={(e) => {
                            e.target.src = 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1'
                          }}
                        />
                      )}
                      <div>
                        <p className="font-medium capitalize">
                          {hero?.hero_name || 'Unknown Hero'}
                        </p>
                        <p className={`text-sm font-semibold ${getResultColor(isWin)}`}>
                          {formatResult(isWin)}
                        </p>
                      </div>
                    </div>

                    {/* Center - Stats */}
                    <div className="flex space-x-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-400">K/D/A</p>
                        <p className="font-medium">
                          {player?.kills || 0}/{player?.deaths || 0}/{player?.assists || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400">KDA</p>
                        <p className="font-medium">
                          {calculateKDA(player?.kills || 0, player?.deaths || 0, player?.assists || 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400">Duration</p>
                        <p className="font-medium">{formatMatchDuration(match.match_play_duration)}</p>
                      </div>
                    </div>

                    {/* Right side - Map, date and view button */}
                    <div className="flex items-center space-x-4">
                      {match.map_thumbnail && (
                        <img
                          src={getMapImageUrl(match.map_thumbnail)}
                          alt="Map"
                          className="w-16 h-10 rounded object-cover border border-gray-600"
                          onError={(e) => {
                            e.target.src = 'https://images.pexels.com/photos/1586298/pexels-photo-1586298.jpeg?auto=compress&cs=tinysrgb&w=64&h=40&dpr=1'
                          }}
                        />
                      )}
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          Season {match.match_season}
                        </p>
                        <p className="text-sm">
                          {formatMatchDate(match.match_time_stamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleViewMatch(match.match_uid)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                      >
                        View Match
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
              >
                Previous
              </button>
              
              <span className="px-3 py-1 text-gray-400">
                Page {currentPage} of {pagination.total_pages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
                disabled={currentPage === pagination.total_pages}
                className="px-3 py-1 rounded bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

MatchHistory.propTypes = {
  playerName: PropTypes.string,
  apiKey: PropTypes.string
}

export default MatchHistory 