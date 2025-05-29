import axios from 'axios'

const BASE_URL = 'https://marvelrivalsapi.com/api/v1'
const BASE_URL_V2 = 'https://marvelrivalsapi.com/api/v2'

// Cache to store API responses
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper function to calculate win percentage
const calculateWinPercentage = (wins, totalMatches) => {
  if (!totalMatches || totalMatches === 0) return 0
  return (wins / totalMatches) * 100
}

// Helper function to calculate KDA
const calculateKDA = (kills, deaths, assists) => {
  if (!deaths || deaths === 0) return kills + assists
  return (kills + assists) / deaths
}

// Helper function to format time played
const formatTimePlayed = (rawTime) => {
  if (!rawTime) return '0s'
  
  const hours = Math.floor(rawTime / 3600)
  const minutes = Math.floor((rawTime % 3600) / 60)
  const seconds = Math.floor(rawTime % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

// Helper function to format match duration
export const formatMatchDuration = (duration) => {
  // Handle null, undefined, or falsy values
  if (!duration && duration !== 0) return '0m 0s'
  
  // If it's already a string, return it as is
  if (typeof duration === 'string') {
    // Additional safety check for the string
    if (duration.includes('m') || duration.includes('s')) {
      return duration
    }
    // If it's a string but not formatted, try to parse it as a number
    const parsed = parseFloat(duration)
    if (isNaN(parsed)) return '0m 0s'
    duration = parsed
  }
  
  // Handle objects or other non-numeric types
  if (typeof duration === 'object') {
    // Try to extract duration from object properties
    if (duration.raw) return formatMatchDuration(duration.raw)
    if (duration.seconds) return formatMatchDuration(duration.seconds)
    if (duration.duration) return formatMatchDuration(duration.duration)
    return '0m 0s'
  }
  
  // Convert to number if it's not already
  const durationNum = Number(duration)
  if (isNaN(durationNum)) return '0m 0s'
  
  // Calculate minutes and seconds
  const minutes = Math.floor(Math.abs(durationNum) / 60)
  const seconds = Math.floor(Math.abs(durationNum) % 60)
  return `${minutes}m ${seconds}s`
}

// Clear player cache
export const clearPlayerCache = (playerName) => {
  const keysToDelete = []
  for (const key of cache.keys()) {
    if (key.includes(playerName)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => cache.delete(key))
}

// Get cached data
const getCachedData = (key) => {
  const cached = cache.get(key)
  if (!cached) return null
  
  const now = Date.now()
  if (now - cached.timestamp > CACHE_DURATION) {
    cache.delete(key)
    return null
  }
  
  return {
    ...cached.data,
    isFromCache: true,
    cacheAge: now - cached.timestamp
  }
}

// Set cached data
const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

// Fetch match history using v2 API
export const fetchMatchHistory = async (playerName, apiKey = null, options = {}) => {
  const { page = 1, limit = 40, season, game_mode, timestamp } = options
  const cacheKey = `match_history_v2_${playerName}_${page}_${limit}_${season || 'all'}_${game_mode || 'all'}`
  
  // Check cache first
  const cached = getCachedData(cacheKey)
  if (cached) return cached
  
  try {
    const headers = apiKey ? { 'x-api-key': apiKey } : {}
    
    let url = `${BASE_URL_V2}/player/${playerName}/match-history?page=${page}&limit=${limit}`
    if (season) url += `&season=${season}`
    if (game_mode) url += `&game_mode=${game_mode}`
    if (timestamp) url += `&timestamp=${timestamp}`
    
    const response = await axios.get(url, { headers })
    
    // Cache the response
    setCachedData(cacheKey, response.data)
    
    return response.data
  } catch (error) {
    console.error('Error fetching match history:', error)
    throw error
  }
}

// Fetch single match details
export const fetchMatchDetails = async (matchUid, apiKey = null) => {
  const cacheKey = `match_details_${matchUid}`
  
  // Check cache first
  const cached = getCachedData(cacheKey)
  if (cached) return cached
  
  try {
    const headers = apiKey ? { 'x-api-key': apiKey } : {}
    
    const response = await axios.get(`${BASE_URL}/match/${matchUid}`, { headers })
    
    // Cache the response
    setCachedData(cacheKey, response.data)
    
    return response.data
  } catch (error) {
    console.error('Error fetching match details:', error)
    throw error
  }
}

// Calculate comprehensive stats from match history
export const calculateStatsFromMatches = async (playerName, apiKey = null, limit = 500) => {
  const cacheKey = `calculated_stats_${playerName}_${limit}`
  
  // Check cache first
  const cached = getCachedData(cacheKey)
  if (cached) return cached
  
  try {
    // Fetch all match history with large limit
    const matchData = await fetchMatchHistory(playerName, apiKey, { limit, page: 1 })
    const matches = matchData.match_history || []
    
    if (matches.length === 0) {
      throw new Error('No matches found for player')
    }
    
    // Initialize stats
    let overall = { matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0, damage: 0, healing: 0 }
    let ranked = { matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0, damage: 0, healing: 0 }
    let unranked = { matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0, damage: 0, healing: 0 }
    
    // Hero stats tracking
    const heroStats = new Map()
    
    // Random stats tracking
    let bestGame = null
    let worstGame = null
    let mostKills = { value: 0, match: null }
    let mostDeaths = { value: 0, match: null }
    let mostDamage = { value: 0, match: null }
    let mostHealing = { value: 0, match: null }
    
    // Process each match
    matches.forEach(match => {
      const player = match.match_player
      const hero = player?.player_hero
      const isWin = player?.is_win?.is_win || false
      const kills = player?.kills || hero?.kills || 0
      const deaths = player?.deaths || hero?.deaths || 0
      const assists = player?.assists || hero?.assists || 0
      const damage = hero?.total_hero_damage || 0
      const healing = hero?.total_hero_heal || 0
      
      // Determine if ranked - game_mode_id 2 is competitive/ranked
      const isRanked = match.game_mode_id === 2
      
      // Update overall stats
      overall.matches++
      if (isWin) overall.wins++
      overall.kills += kills
      overall.deaths += deaths
      overall.assists += assists
      overall.damage += damage
      overall.healing += healing
      
      // Update ranked/unranked stats
      const targetStats = isRanked ? ranked : unranked
      targetStats.matches++
      if (isWin) targetStats.wins++
      targetStats.kills += kills
      targetStats.deaths += deaths
      targetStats.assists += assists
      targetStats.damage += damage
      targetStats.healing += healing
      
      // Update hero stats
      if (hero?.hero_name) {
        const heroName = hero.hero_name
        if (!heroStats.has(heroName)) {
          heroStats.set(heroName, {
            hero_name: heroName,
            hero_id: hero.hero_id,
            matches: 0,
            wins: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
            damage: 0,
            healing: 0,
            play_time: 0
          })
        }
        
        const heroStat = heroStats.get(heroName)
        heroStat.matches++
        if (isWin) heroStat.wins++
        heroStat.kills += kills
        heroStat.deaths += deaths
        heroStat.assists += assists
        heroStat.damage += damage
        heroStat.healing += healing
        heroStat.play_time += hero.play_time?.raw || 0
      }
      
      // Track random stats
      if (kills > mostKills.value) {
        mostKills = { value: kills, match }
      }
      
      if (deaths > mostDeaths.value) {
        mostDeaths = { value: deaths, match }
      }
      
      if (damage > mostDamage.value) {
        mostDamage = { value: damage, match }
      }
      
      if (healing > mostHealing.value) {
        mostHealing = { value: healing, match }
      }
      
      // Best game (high K/A, low D)
      const gameScore = (kills + assists) - deaths
      if (!bestGame || gameScore > ((bestGame.kills + bestGame.assists) - bestGame.deaths)) {
        bestGame = { kills, deaths, assists, match }
      }
      
      // Worst game (low K/A, high D)
      if (!worstGame || gameScore < ((worstGame.kills + worstGame.assists) - worstGame.deaths)) {
        worstGame = { kills, deaths, assists, match }
      }
    })
    
    // Calculate final stats
    const calculateFinalStats = (stats) => ({
      total_matches: stats.matches,
      wins: stats.wins,
      losses: stats.matches - stats.wins,
      win_percentage: calculateWinPercentage(stats.wins, stats.matches),
      kda: calculateKDA(stats.kills, stats.deaths, stats.assists),
      average_damage: stats.matches > 0 ? Math.round(stats.damage / stats.matches) : 0,
      average_healing: stats.matches > 0 ? Math.round(stats.healing / stats.matches) : 0,
      total_kills: stats.kills,
      total_deaths: stats.deaths,
      total_assists: stats.assists,
      total_damage: stats.damage,
      total_healing: stats.healing
    })
    
    // Process hero stats
    const processedHeroStats = Array.from(heroStats.values())
      .map(hero => ({
        ...hero,
        win_percentage: calculateWinPercentage(hero.wins, hero.matches),
        kda: calculateKDA(hero.kills, hero.deaths, hero.assists),
        average_damage: hero.matches > 0 ? Math.round(hero.damage / hero.matches) : 0,
        average_healing: hero.matches > 0 ? Math.round(hero.healing / hero.matches) : 0,
        time_played_formatted: formatTimePlayed(hero.play_time)
      }))
      .sort((a, b) => b.matches - a.matches) // Sort by most played
    
    // Random stats
    const randomStats = {
      average_damage: overall.matches > 0 ? Math.round(overall.damage / overall.matches) : 0,
      most_damage: mostDamage,
      average_healing: overall.matches > 0 ? Math.round(overall.healing / overall.matches) : 0,
      most_healing: mostHealing,
      average_kills: overall.matches > 0 ? Math.round(overall.kills / overall.matches) : 0,
      most_kills: mostKills,
      average_deaths: overall.matches > 0 ? Math.round(overall.deaths / overall.matches) : 0,
      most_deaths: mostDeaths,
      best_game: bestGame,
      worst_game: worstGame
    }
    
    const result = {
      overall_stats: calculateFinalStats(overall),
      ranked_stats: calculateFinalStats(ranked),
      unranked_stats: calculateFinalStats(unranked),
      hero_stats: processedHeroStats,
      random_stats: randomStats,
      total_matches_analyzed: matches.length,
      last_match_timestamp: matches.length > 0 ? matches[0].match_time_stamp : null
    }
    
    // Cache the result
    setCachedData(cacheKey, result)
    
    return result
  } catch (error) {
    console.error('Error calculating stats from matches:', error)
    throw error
  }
}

// Process raw API data into format expected by components
const processPlayerData = (rawData) => {
  if (!rawData) return null

  const { player, overall_stats, match_history, rank_history } = rawData

  // Process player info
  const processedPlayer = {
    name: player?.name || rawData.name,
    uid: player?.uid || rawData.uid,
    level: player?.level || '??',
    icon: player?.icon?.player_icon || null,
    rank: player?.rank ? {
      rank: player.rank.rank,
      image: player.rank.image
    } : null,
    info: {
      login_os: player?.info?.login_os || 'PC',
      completed_achievements: player?.info?.completed_achievements,
      last_seen: null // Not available in example data
    }
  }

  // Process overall stats
  const totalMatches = overall_stats?.total_matches || 0
  const totalWins = overall_stats?.total_wins || 0
  const totalLosses = totalMatches - totalWins

  // Calculate stats from match history if available
  let totalKills = 0, totalDeaths = 0, totalAssists = 0
  let totalDamage = 0, totalHealing = 0, totalMitigation = 0
  let matchCount = 0

  if (match_history && Array.isArray(match_history)) {
    match_history.forEach(match => {
      if (match.player_performance) {
        const perf = match.player_performance
        totalKills += perf.kills || 0
        totalDeaths += perf.deaths || 0
        totalAssists += perf.assists || 0
        matchCount++
      }
    })
  }

  const processedOverallStats = {
    total_matches: totalMatches,
    wins: totalWins,
    losses: totalLosses,
    win_percentage: calculateWinPercentage(totalWins, totalMatches),
    kda: calculateKDA(totalKills, totalDeaths, totalAssists),
    average_damage: matchCount > 0 ? Math.round(totalDamage / matchCount) : 0,
    average_healing: matchCount > 0 ? Math.round(totalHealing / matchCount) : 0,
    average_mitigation: matchCount > 0 ? Math.round(totalMitigation / matchCount) : 0
  }

  // Process ranked stats
  const rankedStats = overall_stats?.ranked || {}
  const rankedMatches = rankedStats.total_matches || 0
  const rankedWins = rankedStats.total_wins || 0
  const rankedLosses = rankedMatches - rankedWins

  const processedRankedStats = {
    total_matches: rankedMatches,
    wins: rankedWins,
    losses: rankedLosses,
    win_percentage: calculateWinPercentage(rankedWins, rankedMatches),
    kda: calculateKDA(
      rankedStats.total_kills || 0, 
      rankedStats.total_deaths || 0, 
      rankedStats.total_assists || 0
    ),
    average_damage: 0, // Calculate from match history 
    average_healing: 0,
    average_mitigation: 0,
    total_time_played: formatTimePlayed(rankedStats.total_time_played_raw)
  }

  // Process unranked stats
  const unrankedStats = overall_stats?.unranked || {}
  const unrankedMatches = unrankedStats.total_matches || 0
  const unrankedWins = unrankedStats.total_wins || 0
  const unrankedLosses = unrankedMatches - unrankedWins

  const processedUnrankedStats = {
    total_matches: unrankedMatches,
    wins: unrankedWins,
    losses: unrankedLosses,
    win_percentage: calculateWinPercentage(unrankedWins, unrankedMatches),
    kda: calculateKDA(
      unrankedStats.total_kills || 0, 
      unrankedStats.total_deaths || 0, 
      unrankedStats.total_assists || 0
    ),
    average_damage: 0, // Calculate from match history
    average_healing: 0,
    average_mitigation: 0,
    total_time_played: formatTimePlayed(unrankedStats.total_time_played_raw)
  }

  // Process RS progression from rank_history
  let rsHistory = []
  if (rank_history && Array.isArray(rank_history)) {
    rsHistory = rank_history.map(entry => ({
      date: new Date(entry.match_time_stamp * 1000).toISOString().split('T')[0],
      rs: Math.round(entry.score_progression?.total_score || 0),
      delta: Math.round(entry.score_progression?.add_score || 0)
    })).reverse() // Reverse to show chronological order
  }

  // Add current rank score if available
  if (player?.info?.rank_game_season) {
    const currentSeason = Object.values(player.info.rank_game_season)[0]
    if (currentSeason && rsHistory.length > 0) {
      // Update the last entry with current score
      rsHistory[rsHistory.length - 1].rs = Math.round(currentSeason.rank_score)
    } else if (currentSeason) {
      // Add current score as single data point
      rsHistory = [{
        date: new Date().toISOString().split('T')[0],
        rs: Math.round(currentSeason.rank_score),
        delta: 0
      }]
    }
  }

  processedPlayer.rsHistory = rsHistory

  return {
    player: processedPlayer,
    overall_stats: processedOverallStats,
    ranked_stats: processedRankedStats,
    unranked_stats: processedUnrankedStats,
    match_history: match_history || [],
    hero_matchups: rawData.hero_matchups || [],
    team_mates: rawData.team_mates || [],
    maps: rawData.maps || []
  }
}

export const fetchPlayerStats = async (playerName, apiKey = null) => {
  try {
    const headers = apiKey ? { 'X-API-Key': apiKey } : {}
    
    const response = await axios.get(
      `${BASE_URL}/player/${playerName}`, 
      { headers }
    )
    
    // Log rate limit information if available
    const rateLimitHeaders = {
      limit: response.headers['x-ratelimit-limit'],
      remaining: response.headers['x-ratelimit-remaining'],
      reset: response.headers['x-ratelimit-reset']
    }
    
    if (rateLimitHeaders.limit || rateLimitHeaders.remaining || rateLimitHeaders.reset) {
      console.log('\n=== API Rate Limit Info ===')
      
      if (rateLimitHeaders.limit) {
        console.log(`Rate Limit: ${rateLimitHeaders.limit} requests per window`)
      }
      
      if (rateLimitHeaders.remaining) {
        console.log(`Remaining Requests: ${rateLimitHeaders.remaining}`)
      }
      
      if (rateLimitHeaders.reset) {
        // Convert Unix timestamp to readable date
        const resetDate = new Date(parseInt(rateLimitHeaders.reset) * 1000)
        console.log(`Rate Limit Resets: ${resetDate.toLocaleString()}`)
        
        // Also show time until reset
        const now = new Date()
        const timeUntilReset = resetDate.getTime() - now.getTime()
        if (timeUntilReset > 0) {
          const minutes = Math.floor(timeUntilReset / (1000 * 60))
          const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000)
          console.log(`Time until reset: ${minutes}m ${seconds}s`)
        }
      }
      
      console.log('=========================\n')
    }
    
    // Process the raw data before returning
    return processPlayerData(response.data)
  } catch (error) {
    console.error('Error fetching player stats:', error)
    
    // Also log rate limit info on error if available
    if (error.response && error.response.headers) {
      const rateLimitHeaders = {
        limit: error.response.headers['x-ratelimit-limit'],
        remaining: error.response.headers['x-ratelimit-remaining'],
        reset: error.response.headers['x-ratelimit-reset']
      }
      
      if (rateLimitHeaders.limit || rateLimitHeaders.remaining || rateLimitHeaders.reset) {
        console.log('\n=== API Rate Limit Info (Error Response) ===')
        
        if (rateLimitHeaders.limit) {
          console.log(`Rate Limit: ${rateLimitHeaders.limit} requests per window`)
        }
        
        if (rateLimitHeaders.remaining) {
          console.log(`Remaining Requests: ${rateLimitHeaders.remaining}`)
        }
        
        if (rateLimitHeaders.reset) {
          const resetDate = new Date(parseInt(rateLimitHeaders.reset) * 1000)
          console.log(`Rate Limit Resets: ${resetDate.toLocaleString()}`)
        }
        
        // Check if this is a rate limit error
        if (error.response.status === 429) {
          console.log('❌ Rate limit exceeded! Please wait before making more requests.')
        }
        
        console.log('==========================================\n')
      }
    }
    
    throw error
  }
}

// Mock data for development/fallback (using processed structure)
export const getMockPlayerData = () => {
  // Simulate the example.txt data structure processed
  const mockRawData = {
    uid: 1647698721,
    name: "lilleke",
    player: {
      uid: 1647698721,
      level: "30",
      name: "lilleke",
      icon: {
        player_icon: "/players/heads/player_head_30000001.png"
      },
      rank: {
        rank: "Platinum III",
        image: "/ranked/platinum.png"
      },
      info: {
        login_os: "PC",
        completed_achievements: "93",
        rank_game_season: {
          "1001004": {
            rank_score: 3907.0407896359516,
            win_count: 47
          }
        }
      }
    },
    overall_stats: {
      total_matches: 20,
      total_wins: 10,
      unranked: {
        total_matches: 11,
        total_wins: 5,
        total_kills: 118,
        total_deaths: 69,
        total_assists: 34,
        total_time_played_raw: 5641.943462610245
      },
      ranked: {
        total_matches: 9,
        total_wins: 5,
        total_kills: 170,
        total_deaths: 61,
        total_assists: 37,
        total_time_played_raw: 5394.898412942886
      }
    },
    rank_history: [
      {
        match_time_stamp: 1747956590,
        score_progression: {
          add_score: -22.56584642271264,
          total_score: 3562.015489190801
        }
      },
      {
        match_time_stamp: 1747954181,
        score_progression: {
          add_score: 34.741206876633896,
          total_score: 3609.816662143732
        }
      }
    ]
  }
  
  return processPlayerData(mockRawData)
}