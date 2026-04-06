// Description: Application entry point — mounts React app to #root with StrictMode.
// Imports global styles (Tailwind + Neural Dark CSS variables).

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/globals.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
