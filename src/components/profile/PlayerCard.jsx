import PropTypes from 'prop-types'

const PlayerCard = ({ playerData }) => {
  const { player, hero_stats, overall_stats } = playerData || { player: {} }
  
  if (!player || !player.name) {
    return (
      <div className="bg-gray-900 p-6 rounded-md flex flex-col items-center animate-pulse">
        <div className="w-40 h-40 rounded-full bg-gray-800 mb-4" />
        <div className="h-6 w-32 bg-gray-800 rounded mb-2" />
        <div className="h-4 w-24 bg-gray-800 rounded" />
      </div>
    )
  }

  const renderOsIcon = (os) => {
    switch (os?.toLowerCase()) {
      case 'pc':
      case 'windows':
        return (
          <div className="px-2 py-1 text-xs rounded-md bg-gray-800 flex items-center" title="PC">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.351"/>
            </svg>
          </div>
        )
      case 'playstation':
      case 'ps5':
      case 'ps4':
        return (
          <div className="px-2 py-1 text-xs rounded-md bg-gray-800 flex items-center" title="PlayStation">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.794.69.794 1.151v12.796l3.794-1.261v-2.412c0-.762-.444-1.207-1.111-1.397l-1.572.261z"/>
              <path d="M18.583 16.302c-.667.19-1.111.635-1.111 1.397v2.412l3.794-1.261v-2.412c0-.762-.444-1.207-1.111-1.397l-1.572.261z"/>
              <path d="M1.738 14.928c-1.579.508-1.738 1.332-1.738 1.968v1.714l3.794-1.261v-1.714c0-.636-.159-1.46-1.738-1.968l-.318.261z"/>
            </svg>
          </div>
        )
      case 'xbox':
        return (
          <div className="px-2 py-1 text-xs rounded-md bg-gray-800 flex items-center" title="Xbox">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c1.5 1.201 2.982 2.765 4.166 4.274a11.931 11.931 0 0 0-1.441-4.309 12.04 12.04 0 0 0-2.725-3.965zm-6.52 0c-1.021-.965-2.07-1.81-2.725-3.965a11.931 11.931 0 0 0-1.441 4.309c1.184-1.509 2.666-3.073 4.166-4.274zM12 6.396c-1.021 1.119-2.302 2.303-3.582 3.488 1.28 1.185 2.561 2.369 3.582 3.488 1.021-1.119 2.302-2.303 3.582-3.488C14.302 8.699 13.021 7.515 12 6.396z"/>
            </svg>
          </div>
        )
      default:
        return (
          <div className="px-2 py-1 text-xs rounded-md bg-gray-800 flex items-center" title="Unknown Platform">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
          </div>
        )
    }
  }

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

  // Handle rank image path
  const getRankImageUrl = (imagePath) => {
    if (!imagePath) return null

    if (imagePath.startsWith('/')) {
      return `https://marvelrivalsapi.com/rivals${imagePath}`
    }

    return null
  }

  // Get hero image URL
  const getHeroImageUrl = (heroName) => {
    if (!heroName) return null
    // Convert hero name to a more standard format for image lookup
    const cleanName = heroName.toLowerCase().replace(/\s+/g, '_')
    return `https://marvelrivalsapi.com/rivals/heroes/${cleanName}.jpg`
  }

  // Calculate time since last match
  const getTimeSinceLastMatch = () => {
    if (!overall_stats?.total_matches || overall_stats.total_matches === 0) {
      return "No recent matches"
    }
    
    // Check if we have last match timestamp from the calculated stats
    if (playerData.last_match_timestamp) {
      const now = new Date()
      const lastMatch = new Date(playerData.last_match_timestamp * 1000)
      const diffMs = now - lastMatch
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)
      
      if (diffDays > 0) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
      } else {
        const diffMins = Math.floor(diffMs / (1000 * 60))
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
      }
    }
    
    return "Active recently"
  }

  return (
    <div className="bg-black border border-gray-800 p-6 rounded-lg flex flex-col items-center mb-6">
      <div className="relative mb-4">
        <img
          src={getIconUrl(player.icon)}
          alt={player.name}
          className="w-40 h-40 rounded-full object-cover border-2 border-white"
        />
      </div>
      
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">{player.name}</h2>
      </div>
      
      <div className="flex items-center space-x-3 mb-2">
        <div className="px-3 py-1 border border-white rounded-full text-sm">
          Level {player.level || '??'}
        </div>
        
        {player.info && renderOsIcon(player.info.login_os)}
        
        {player.rank && (
          <div className="flex items-center space-x-2">
            {player.rank.image && (
              <img 
                src={getRankImageUrl(player.rank.image)} 
                alt="Rank" 
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
            <span className="text-sm">{player.rank.rank || 'Unranked'}</span>
          </div>
        )}
      </div>
      
      {player.info?.completed_achievements && (
        <div className="text-xs text-gray-500">
          {player.info.completed_achievements} achievements completed
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        {player.info?.last_seen ? (
          <>Last active: {new Date(player.info.last_seen).toLocaleDateString()}</>
        ) : (
          <>UID: {player.uid}</>
        )}
      </div>
      
      {/* Last Match Info */}
      <div className="text-xs text-gray-400 mt-2">
        {getTimeSinceLastMatch()}
      </div>
      
      {/* Most Played Heroes */}
      {hero_stats && hero_stats.length > 0 && (
        <div className="w-full mt-6">
          <h4 className="text-sm font-semibold mb-3 text-center">Most Played Heroes</h4>
          <div className="flex justify-center space-x-3">
            {hero_stats.slice(0, 3).map((hero, index) => (
              <div key={hero.hero_name} className="text-center">
                <img
                  src={getHeroImageUrl(hero.hero_name)}
                  alt={hero.hero_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-600 mb-1"
                  onError={(e) => {
                    e.target.src = 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=48&h=48&dpr=1'
                  }}
                />
                <p className="text-xs text-gray-400 capitalize">{hero.hero_name}</p>
                <p className="text-xs text-gray-500">{hero.matches} games</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

PlayerCard.propTypes = {
  playerData: PropTypes.object
}

export default PlayerCard