// Configuration utilities
const getConfig = () => {
  // Obfuscated configuration data
  const parts = [
    'YTk2MTdjNTAxMWMwOTVkYjkwNzUwYmUw',
    'ZjA1ZDMyYWUyNGVlMTQxN2JiMGIxNTkx',
    'MGE4MTBjMDc5NGJjZjQ0Yg=='
  ]
  
  const encoded = parts.join('')
  
  try {
    return atob(encoded)
  } catch (e) {
    return null
  }
}

// System configuration
export const getSystemConfig = () => {
  const key = getConfig()
  return {
    apiKey: key,
    isConfigured: !!key
  }
}

export default { getSystemConfig } 