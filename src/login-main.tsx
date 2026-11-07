import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { Footer } from './components/Footer'
import { LoginMpaPage } from './pages/LoginMpaPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <>
        <LoginMpaPage />
        <Footer />
      </>
    </AuthProvider>
  </StrictMode>,
)
