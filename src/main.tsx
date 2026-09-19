import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './ui/app'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Élément #root introuvable dans index.html')

createRoot(container).render(
  <StrictMode>
    {/* BASE_URL vaut "/" en local et "/<repo>/" une fois publié sur GitHub Pages. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
