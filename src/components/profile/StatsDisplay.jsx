import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

const StatsDisplay = ({ playerData }) => {
  const [activeTab, setActiveTab] = useState('overall')
  const navigate = useNavigate()

  if (!playerData) {
    return (
      <div className="bg-black border border-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Statistics</h3>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-t-2 border-r-2 border-white rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading stats...</p>
        </div>
      </div>
    )
  }

  const { overall_stats, ranked_stats, unranked_stats, random_stats, hero_stats, total_matches_analyzed } = playerData

  // Tab configuration
  const tabs = [
    { id: 'overall', label: 'Overall', stats: overall_stats },
    { id: 'ranked', label: 'Ranked', stats: ranked_stats },
    { id: 'unranked', label: 'Unranked', stats: unranked_stats },
    { id: 'random', label: 'Random Stats', stats: random_stats }
  ]

  const handleMatchClick = (match) => {
    if (match?.match_uid) {
      navigate(`/match?id=${match.match_uid}`)
    }
  }

  const StatCard = ({ title, value, subtitle, clickable = false, onClick }) => (
    <div 
      className={`text-center p-3 rounded-lg border bg-gray-900/50 border-gray-700 ${
        clickable ? 'cursor-pointer hover:bg-gray-800/70 hover:border-blue-600 transition-all' : ''
      }`}
      onClick={clickable ? onClick : undefined}
    >
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="font-medium text-lg">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  )

  const ClickableStatCard = ({ title, value, subtitle, match }) => (
    <StatCard
      title={title}
      value={value}
      subtitle={subtitle}
      clickable={!!match}
      onClick={() => handleMatchClick(match)}
    />
  )

  const renderOverallStats = (stats) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title="Matches" value={stats.total_matches || 0} />
      <StatCard title="Win Rate" value={`${(stats.win_percentage || 0).toFixed(1)}%`} />
      <StatCard title="W/L" value={`${stats.wins || 0}/${stats.losses || 0}`} />
      <StatCard title="KDA" value={(stats.kda || 0).toFixed(2)} />
      <StatCard title="Total Kills" value={stats.total_kills || 0} />
      <StatCard title="Total Deaths" value={stats.total_deaths || 0} />
      <StatCard title="Total Assists" value={stats.total_assists || 0} />
      <StatCard title="Avg Damage" value={(stats.average_damage || 0).toLocaleString()} />
    </div>
  )

  const renderRandomStats = (stats) => (
    <div className="space-y-6">
      {/* Averages */}
      <div>
        <h4 className="text-md font-semibold mb-3">Averages</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Avg Damage" value={(stats.average_damage || 0).toLocaleString()} />
          <StatCard title="Avg Healing" value={(stats.average_healing || 0).toLocaleString()} />
          <StatCard title="Avg Kills" value={(stats.average_kills || 0).toFixed(1)} />
          <StatCard title="Avg Deaths" value={(stats.average_deaths || 0).toFixed(1)} />
        </div>
      </div>

      {/* Records */}
      <div>
        <h4 className="text-md font-semibold mb-3">Records</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ClickableStatCard
            title="Most Damage"
            value={(stats.most_damage?.value || 0).toLocaleString()}
            subtitle="Click to view match"
            match={stats.most_damage?.match}
          />
          <ClickableStatCard
            title="Most Healing"
            value={(stats.most_healing?.value || 0).toLocaleString()}
            subtitle="Click to view match"
            match={stats.most_healing?.match}
          />
          <ClickableStatCard
            title="Most Kills"
            value={stats.most_kills?.value || 0}
            subtitle="Click to view match"
            match={stats.most_kills?.match}
          />
          <ClickableStatCard
            title="Most Deaths"
            value={stats.most_deaths?.value || 0}
            subtitle="Click to view match"
            match={stats.most_deaths?.match}
          />
        </div>
      </div>

      {/* Best/Worst Games */}
      <div>
        <h4 className="text-md font-semibold mb-3">Game Highlights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ClickableStatCard
            title="Best Game"
            value={`${stats.best_game?.kills || 0}/${stats.best_game?.deaths || 0}/${stats.best_game?.assists || 0}`}
            subtitle="Most kills, least deaths - Click to view"
            match={stats.best_game?.match}
          />
          <ClickableStatCard
            title="Worst Game"
            value={`${stats.worst_game?.kills || 0}/${stats.worst_game?.deaths || 0}/${stats.worst_game?.assists || 0}`}
            subtitle="Most deaths, least kills - Click to view"
            match={stats.worst_game?.match}
          />
        </div>
      </div>
    </div>
  )

  const HeroStatCard = ({ hero, rank }) => (
    <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h5 className="font-medium capitalize text-sm">{hero.hero_name}</h5>
          <p className="text-xs text-gray-400">#{rank}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{hero.matches} games</p>
          <p className="text-xs font-medium">{hero.win_percentage.toFixed(1)}% WR</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <p className="text-gray-400">KDA</p>
          <p className="font-medium">{hero.kda.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400">Avg DMG</p>
          <p className="font-medium">{hero.average_damage.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400">Time</p>
          <p className="font-medium">{hero.time_played_formatted}</p>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab)
    const stats = currentTab?.stats

    if (!stats) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">No statistics available for this category</p>
        </div>
      )
    }

    if (activeTab === 'random') {
      if (!random_stats || Object.keys(random_stats).length === 0) {
        return (
          <div className="text-center py-8">
            <p className="text-gray-400">Random statistics will be available after match analysis</p>
          </div>
        )
      }
      return renderRandomStats(random_stats)
    }

    return (
      <div className="space-y-6">
        {renderOverallStats(stats)}
      </div>
    )
  }

  return (
    <div className="bg-black border border-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Statistics</h3>
        {total_matches_analyzed && (
          <span className="text-xs text-gray-400">
            From {total_matches_analyzed} matches
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* No Stats Available */}
      {(!overall_stats || overall_stats.total_matches === 0) && activeTab !== 'random' && (
        <div className="text-center py-8">
          <p className="text-gray-400">No match statistics available</p>
          <p className="text-xs text-gray-500 mt-1">
            Stats will appear after matches are played
          </p>
        </div>
      )}
    </div>
  )
}

StatsDisplay.propTypes = {
  playerData: PropTypes.object
}

export default StatsDisplay