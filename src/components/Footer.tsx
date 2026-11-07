import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function Footer() {
  const { auth } = useAuth()

  return (
    <footer className="site-footer">
      <nav className="app-shell site-footer-inner" aria-label="Footer-Navigation">
        <Link to="/">Fahrten</Link>
        {auth ? (
          <>
            <Link to="/rides/new">Fahrt anbieten</Link>
            <Link to="/cars/new">Fahrzeug erstellen</Link>
            <Link to="/bookings">Meine Buchungen</Link>
          </>
        ) : (
          <>
            <Link to="/login">Anmelden</Link>
            <Link to="/register">Registrieren</Link>
          </>
        )}
        <Link to="/impressum">Impressum</Link>
      </nav>
    </footer>
  )
}
