const Footer = () => {
  return (
    <footer className="bg-black border-t border-gray-800 py-4 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-gray-400">
          Powered by{' '}
          <a 
            href="https://marvelrivalsapi.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors underline"
          >
            Marvel Rivals API
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer 