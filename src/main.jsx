import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import CardGenerator from './CardGenerator.jsx'

const isCardPage = window.location.pathname === '/card'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isCardPage ? <CardGenerator /> : <App />}
  </React.StrictMode>
)
