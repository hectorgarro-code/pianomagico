import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MusicSuite from './modules/core/MusicSuite.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MusicSuite />
  </StrictMode>,
)
