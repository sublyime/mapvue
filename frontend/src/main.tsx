import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WindowizedMapVue from './WindowizedMapVue.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WindowizedMapVue />
  </StrictMode>,
)
