import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

const LandingPage = () => {
  const navigate = useNavigate()
  const { defaultPlayer } = useUser()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (defaultPlayer) {
      // Start countdown
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
      
      return () => clearInterval(countdownInterval)
    }
  }, [defaultPlayer, navigate])

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold uppercase tracking-wider mb-4 animate-pulse-slow">
        Marvel Rivals Tracker
      </h1>
      <p className="text-lg sm:text-xl text-gray-400">
        MVP WIP
      </p>
      
      {defaultPlayer ? (
        <div className="mt-8 text-center">
          <div className="text-sm text-gray-500 mb-2">
            Redirecting to profile...
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {countdown}
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <button
            onClick={() => navigate('/settings')}
            className="px-6 py-3 bg-black border border-white rounded hover:bg-gray-900 transition"
          >
            Set Up Profile
          </button>
        </div>
      )}
    </div>
  )
}

export default LandingPage