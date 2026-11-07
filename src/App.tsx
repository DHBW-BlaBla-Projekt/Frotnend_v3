import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { BookingsPage } from './pages/BookingsPage'
import { CreateCarPage } from './pages/CreateCarPage'
import { CreateRidePage } from './pages/CreateRidePage'
import { ImpressumPage } from './pages/ImpressumPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { RidesPage } from './pages/RidesPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<RidesPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/rides/new" element={<CreateRidePage />} />
            <Route path="/cars/new" element={<CreateCarPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
