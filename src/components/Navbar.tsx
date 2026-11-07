import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function Navbar() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link className="brand" to="/">BlaBla</Link>
        <nav aria-label="Hauptnavigation">
          <NavLink to="/">Fahrten</NavLink>
          {auth ? <NavLink to="/rides/new">Fahrt anbieten</NavLink> : null}
          {auth ? <NavLink to="/cars/new">Fahrzeug erstellen</NavLink> : null}
          {auth ? <NavLink to="/bookings">Meine Buchungen</NavLink> : null}
          {auth ? (
            <button className="link-button" onClick={handleLogout} type="button">Abmelden</button>
          ) : (
            <a className="nav-cta" href="/login.html">Anmelden</a>
          )}
        </nav>
      </div>
    </header>
  )
}
