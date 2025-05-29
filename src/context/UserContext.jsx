import { createContext, useState, useEffect, useContext } from 'react'
import { getSystemConfig } from '../utils/config'

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [defaultPlayer, setDefaultPlayer] = useState('')
  const [currentPlayer, setCurrentPlayer] = useState('')
  const [searchInput, setSearchInput] = useState('')
  
  // Get system API key
  const { apiKey } = getSystemConfig()
  
  // Load stored values on init
  useEffect(() => {
    const storedPlayer = localStorage.getItem('defaultPlayer')
    
    if (storedPlayer) {
      setDefaultPlayer(storedPlayer)
      setCurrentPlayer(storedPlayer)
    }
    
    // Clean up any old API key from localStorage
    localStorage.removeItem('apiKey')
  }, [])
  
  // Update localStorage when values change
  useEffect(() => {
    if (defaultPlayer) {
      localStorage.setItem('defaultPlayer', defaultPlayer)
    }
  }, [defaultPlayer])
  
  return (
    <UserContext.Provider 
      value={{
        defaultPlayer,
        setDefaultPlayer,
        apiKey,
        currentPlayer,
        setCurrentPlayer,
        searchInput,
        setSearchInput,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)

export default UserContext