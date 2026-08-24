import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RiskProvider } from './context/RiskContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RiskProvider>
      <App />
    </RiskProvider>
  </StrictMode>,
)

