import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { DesignQA } from '../DesignQA'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DesignQA imgbbApiKey={import.meta.env.VITE_IMGBB_API_KEY} />
    <App />
  </React.StrictMode>
)
