import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { initSyncEngine } from './db/syncEngine'
import App from './App'
import './index.css'

// Init sync engine (offline-first auto sync)
initSyncEngine()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
