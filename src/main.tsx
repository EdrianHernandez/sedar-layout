import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { EngineRoomProvider } from './context/EngineRoomContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <EngineRoomProvider>
        <App />
      </EngineRoomProvider>
    </BrowserRouter>
  </StrictMode>,
)
