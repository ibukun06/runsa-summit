import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Agenda from './Agenda.jsx'
import CardGenerator from './CardGenerator.jsx'

const path = window.location.pathname

const renderTarget =
  path === '/agenda' ? <Agenda /> :
  path === '/card'   ? <CardGenerator /> :
                       <App />

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{renderTarget}</React.StrictMode>
)
