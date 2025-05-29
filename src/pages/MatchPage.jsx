import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { fetchMatchDetails, fetchMatchHistory, formatMatchDuration } from '../utils/api'

const MatchPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentPlayer, apiKey } = useUser()
  
  const [matchId, setMatchId] = useState(searchParams.get('id') || '')
  const [matchData, setMatchData] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const pageSize = 10

  // Load match details if match ID is provided
  useEffect(() => {
    const matchIdFromUrl = searchParams.get('id')
    if (matchIdFromUrl) {
      setMatchId(matchIdFromUrl)
      loadMatchDetails(matchIdFromUrl)
    } else if (currentPlayer) {
      loadMatchHistory()
    }
  }, [searchParams, currentPlayer])

  // Load match history when page changes
  useEffect(() => {
    if (!searchParams.get('id') && currentPlayer) {
      loadMatchHistory()
    }
  }, [currentPage, currentPlayer])

  const loadMatchDetails = async (id) => {
    setLoading(true)
    setError(null)
    try {
      console.log('Loading match details for:', id, 'with API key:', apiKey ? 'Present' : 'Missing')
      
      // Fetch detailed match data
      const detailData = await fetchMatchDetails(id, apiKey)
      
      // Try to get additional metadata from v2 match history
      let enrichedData = detailData
      if (currentPlayer) {
        try {
          // Search through recent matches to find this specific match
          const historyData = await fetchMatchHistory(currentPlayer, apiKey, { limit: 100, page: 1 })
          const matchInHistory = historyData.match_history?.find(match => match.match_uid === id)
          
          if (matchInHistory) {
            // Merge the additional data from v2 endpoint
            enrichedData = {
              ...detailData,
              match_details: {
                ...detailData.match_details,
                map_thumbnail: matchInHistory.map_thumbnail,
                match_play_duration: matchInHistory.match_play_duration,
                match_season: matchInHistory.match_season,
                match_time_stamp: matchInHistory.match_time_stamp,
                duration_formatted: matchInHistory.match_play_duration,
                // Add match score if available
                match_score: typeof matchInHistory.score_info === 'object' ? 'Score Unavailable' : (matchInHistory.score_info || 'Score Unavailable')
              }
            }
          }
        } catch (enrichError) {
          console.warn('Could not fetch additional match metadata:', enrichError)
          // Continue with basic data if enrichment fails
        }
      }
      
      setMatchData(enrichedData)
      setMatches([])
    } catch (err) {
      console.error('Failed to fetch match details:', err)
      if (err.response?.status === 401) {
        setError('Authentication failed. Unable to access match details.')
      } else {
        setError('Failed to load match details')
      }
      setMatchData(null)
    } finally {
      setLoading(false)
    }
  }

  const loadMatchHistory = async () => {
    if (!currentPlayer) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMatchHistory(currentPlayer, apiKey, { 
        page: currentPage, 
        limit: pageSize 
      })
      setMatches(data.match_history || [])
      setPagination(data.pagination)
      setMatchData(null)
    } catch (err) {
      console.error('Failed to fetch match history:', err)
      setError('Failed to load match history')
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (matchId.trim()) {
      setSearchParams({ id: matchId.trim() })
    } else {
      setSearchParams({})
      if (currentPlayer) {
        loadMatchHistory()
      }
    }
  }

  const clearSearch = () => {
    setMatchId('')
    setSearchParams({})
    if (currentPlayer) {
      loadMatchHistory()
    }
  }

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

  const formatMatchDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
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

  // Hero ID to name mapping (common heroes)
  const getHeroNameFromId = (heroId) => {
    const heroMap = {
      1011: 'Thor',
      1016: 'Loki', 
      1018: 'Doctor Strange',
      1023: 'Rocket Raccoon',
      1025: 'Cloak & Dagger',
      1029: 'Magik',
      1030: 'Moon Knight',
      1031: 'Luna Snow',
      1032: 'Squirrel Girl',
      1034: 'Iron Man',
      1036: 'Magneto',
      1037: 'Magneto',
      1042: 'Peni Parker',
      1048: 'Psylocke',
      1049: 'Wolverine',
      1050: 'Invisible Woman',
      1051: 'The Thing',
      1052: 'Storm',
      1053: 'Emma Frost'
    }
    return heroMap[heroId] || `Hero ${heroId}`
  }

  // Parse hero name to be more readable
  const parseHeroName = (heroName, heroIcon) => {
    // If we have a clean hero name from v2 API, use it
    if (heroName && heroName !== 'Unknown Hero' && !heroName.includes('_')) {
      return heroName.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    }
    
    // Extract hero name from hero_icon path if available
    if (heroIcon && typeof heroIcon === 'string') {
      const match = heroIcon.match(/\/heroes\/transformations\/([^-]+)/)
      if (match) {
        const name = match[1]
        return name.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
      }
    }
    
    return 'Unknown Hero'
  }

  // Calculate hit rate from player heroes data
  const calculateHitRate = (player) => {
    if (player.player_heroes && player.player_heroes.length > 0) {
      const hero = player.player_heroes[0]
      if (hero.session_hit_rate) {
        // API returns decimal values (0.53 = 53%), so multiply by 100
        return (hero.session_hit_rate * 100).toFixed(1) + '%'
      }
    }
    return 'N/A'
  }

  const renderMatchDetails = () => {
    if (!matchData?.match_details) return null

    const match = matchData.match_details
    const players = match.match_players || []
    
    // Find MVP and SVP
    const mvpPlayer = players.find(p => p.player_uid === match.mvp_uid)
    const svpPlayer = players.find(p => p.player_uid === match.svp_uid)
    
    // Find current player to determine friendly/enemy teams
    const currentPlayerData = players.find(p => 
      p.nick_name?.toLowerCase() === currentPlayer?.toLowerCase() ||
      p.player_uid?.toString() === currentPlayer?.toString()
    )
    const currentPlayerTeam = currentPlayerData?.camp

    return (
      <div className="space-y-6">
        {/* Match Overview */}
        <div className="bg-black border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Map Image */}
              {match.map_thumbnail && (
                <img
                  src={getMapImageUrl(match.map_thumbnail)}
                  alt={match.map_name || 'Map'}
                  className="w-20 h-12 rounded object-cover border border-gray-600"
                  onError={(e) => {
                    e.target.src = 'https://images.pexels.com/photos/1586298/pexels-photo-1586298.jpeg?auto=compress&cs=tinysrgb&w=80&h=48&dpr=1'
                  }}
                />
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {match.map_name || (match.map_thumbnail ? `Map ${match.match_map_id || ''}` : 'Map Information Unavailable')}
                </h2>
                <p className="text-gray-400">{match.game_mode?.game_mode_name || match.game_mode_name || 'Unknown Mode'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">
                {typeof match.match_score === 'object' ? 'Score Unavailable' : (match.match_score || 'Score Unavailable')}
              </p>
              <p className="text-sm text-gray-400">
                Duration: {match.duration_formatted || match.match_play_duration || formatMatchDuration(match.match_duration || 0)}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">Match ID</p>
              <p className="font-medium text-sm">{match.match_uid}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Replay ID</p>
              <p className="font-medium text-sm">{match.replay_id || 'Not Available'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Season</p>
              <p className="font-medium">{match.match_season || 'Current'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Date</p>
              <p className="font-medium">{match.match_time_stamp ? formatMatchDate(match.match_time_stamp) : 'Recent'}</p>
            </div>
          </div>
        </div>

        {/* MVP & SVP */}
        {(mvpPlayer || svpPlayer) && (
          <div className="bg-black border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Match Awards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {mvpPlayer && (
                <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-600 text-black px-2 py-1 rounded text-sm font-bold">MVP</div>
                    <div>
                      <p className="font-medium">{mvpPlayer.nick_name || `Player ${mvpPlayer.player_uid}`}</p>
                      <p className="text-sm text-gray-400 capitalize">{parseHeroName(mvpPlayer.cur_hero_name, mvpPlayer.cur_hero_icon)}</p>
                    </div>
                  </div>
                </div>
              )}
              {svpPlayer && (
                <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold">SVP</div>
                    <div>
                      <p className="font-medium">{svpPlayer.nick_name || `Player ${svpPlayer.player_uid}`}</p>
                      <p className="text-sm text-gray-400 capitalize">{parseHeroName(svpPlayer.cur_hero_name, svpPlayer.cur_hero_icon)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Banned Heroes */}
            {match.dynamic_fields?.ban_pick_info && (
              <div>
                <h4 className="text-md font-semibold mb-2">Banned Heroes</h4>
                <div className="flex flex-wrap gap-2">
                  {match.dynamic_fields.ban_pick_info
                    .filter(item => item.is_pick === 0) // 0 means ban, 1 means pick
                    .map((bannedItem, index) => (
                      <div key={index} className="bg-red-900/20 border border-red-600 rounded-lg px-3 py-1">
                        <span className="text-sm text-red-300">{getHeroNameFromId(bannedItem.hero_id)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {/* Players List */}
        <div className="bg-black border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Players ({players.length})</h3>
          <div className="space-y-3">
            {players.map((player, index) => {
              const heroes = player.player_heroes || []
              const mainHero = heroes[0] || {}
              
              return (
                <div 
                  key={`${player.player_uid}_${index}`}
                  className={`border rounded-lg p-4 ${
                    player.is_win ? 'border-green-800 bg-green-900/10' : 'border-red-800 bg-red-900/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Player Info */}
                    <div className="flex items-center space-x-4">
                      {mainHero.hero_icon && (
                        <img
                          src={getHeroImageUrl(mainHero.hero_icon)}
                          alt={mainHero.hero_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                          onError={(e) => {
                            e.target.src = 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1'
                          }}
                        />
                      )}
                      <div>
                        <p className="font-medium">
                          {player.nick_name || `Player ${player.player_uid}`}
                        </p>
                        <p className="text-sm text-gray-400 capitalize">
                          {parseHeroName(player.cur_hero_name || mainHero.hero_name, player.cur_hero_icon || mainHero.hero_icon)}
                        </p>
                        <p className={`text-sm font-semibold ${
                          player.is_win ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {player.is_win ? 'Victory' : 'Defeat'} • 
                          {currentPlayerTeam !== undefined 
                            ? (player.camp === currentPlayerTeam ? ' Friendly' : ' Enemy')
                            : ` Team ${player.camp}`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex space-x-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-400">K/D/A</p>
                        <p className="font-medium">
                          {player.kills || 0}/{player.deaths || 0}/{player.assists || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400">KDA</p>
                        <p className="font-medium">
                          {calculateKDA(player.kills || 0, player.deaths || 0, player.assists || 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400">Damage</p>
                        <p className="font-medium">{Math.round(player.total_hero_damage || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400">Healing</p>
                        <p className="font-medium">{Math.round(player.total_hero_heal || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400">Hit Rate</p>
                        <p className="font-medium">{calculateHitRate(player)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderMatchHistory = () => (
    <div className="bg-black border border-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Matches for {currentPlayer}</h3>
        {pagination && (
          <span className="text-sm text-gray-400">
            {pagination.total_matches} total matches
          </span>
        )}
      </div>

      {matches.length === 0 ? (
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
                  className={`border rounded-lg p-4 transition-colors cursor-pointer hover:border-blue-600 ${
                    isWin ? 'border-green-800 bg-green-900/10' : 'border-red-800 bg-red-900/10'
                  }`}
                  onClick={() => setSearchParams({ id: match.match_uid })}
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
                          {parseHeroName(hero?.hero_name, hero?.hero_icon) || 'Unknown Hero'}
                        </p>
                        <p className={`text-sm font-semibold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                          {isWin ? 'Victory' : 'Defeat'}
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

                    {/* Right side - Map and date */}
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

  return (
    <div className="pt-16 container mx-auto px-4 py-8 max-w-5xl">
      {/* Header with Search */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Match Details</h1>
        
        {/* Search Bar */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            placeholder="Enter match ID to view details..."
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Search
          </button>
          {searchParams.get('id') && (
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      ) : error ? (
        <div className="bg-black border border-gray-800 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => searchParams.get('id') ? loadMatchDetails(searchParams.get('id')) : loadMatchHistory()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      ) : matchData ? (
        renderMatchDetails()
      ) : currentPlayer ? (
        renderMatchHistory()
      ) : (
        <div className="bg-black border border-gray-800 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2">No Player Selected</h2>
          <p className="text-gray-400 mb-4">Please search for a player or set a default player in Settings to view match history.</p>
          <button
            onClick={() => navigate('/settings')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Go to Settings
          </button>
        </div>
      )}
    </div>
  )
}

export default MatchPage