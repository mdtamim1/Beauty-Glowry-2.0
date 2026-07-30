import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import AllProviders from './Providers.jsx'
import './index.css'
import FacebookPixelTracker from './seared/FacebookPixelTracker.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AllProviders>
        <FacebookPixelTracker />
        <App />
      </AllProviders>
    </BrowserRouter>
  </React.StrictMode>
)
