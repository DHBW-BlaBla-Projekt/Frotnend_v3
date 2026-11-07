import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createBooking, getMyBookings } from '../api/bookingApi'
import { cancelRide, getAvailableRides, type Ride } from '../api/rideApi'
import { RouteMap } from '../components/RouteMap'
import { useAuth } from '../context/useAuth'

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
})

export function RidesPage() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [rides, setRides] = useState<Ride[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [bookingRideId, setBookingRideId] = useState<number | null>(null)
  const [cancellingRideId, setCancellingRideId] = useState<number | null>(null)
  const [expandedRideId, setExpandedRideId] = useState<number | null>(null)
  const [bookedRideIds, setBookedRideIds] = useState<Set<number>>(new Set())

  function hasRoute(ride: Ride) {
    return Boolean(
      ride.routeGeometry
      && ride.startLatitude !== null
      && ride.startLongitude !== null
      && ride.endLatitude !== null
      && ride.endLongitude !== null,
    )
  }

  async function loadRides() {
    try {
      const nextRides = await getAvailableRides()
      setRides(nextRides)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Fahrten konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRides()
  }, [])

  useEffect(() => {
    if (!auth) {
      setBookedRideIds(new Set())
      return
    }

    void getMyBookings(auth.accessToken)
      .then((bookings) => {
        setBookedRideIds(new Set(
          bookings
            .filter((booking) => booking.status === 'CONFIRMED')
            .map((booking) => booking.rideId),
        ))
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : 'Deine Buchungen konnten nicht geladen werden.')
      })
  }, [auth])

  async function handleBookRide(ride: Ride) {
    if (!auth) {
      navigate('/login')
      return
    }

    if (ride.driverUsername === auth.username) {
      setError('Du kannst deine eigene Fahrt nicht buchen.')
      return
    }

    if (ride.availableSeats <= 0) {
      setError('Für diese Mitfahrt sind keine Plätze mehr verfügbar.')
      return
    }

    setBookingRideId(ride.id)
    setError('')

    try {
      await createBooking(ride.id, auth.accessToken)
      setBookedRideIds((current) => new Set(current).add(ride.id))
      await loadRides()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Die Buchung konnte nicht erstellt werden.')
    } finally {
      setBookingRideId(null)
    }
  }

  async function handleCancelRide(ride: Ride) {
    if (!auth) return

    setCancellingRideId(ride.id)
    setError('')

    try {
      await cancelRide(ride.id, auth.accessToken)
      await loadRides()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Die Fahrt konnte nicht storniert werden.')
    } finally {
      setCancellingRideId(null)
    }
  }

  return (
    <main className="app-shell page">
      <section className="hero">
        <span className="eyebrow">Gemeinsam unterwegs</span>
        <h1>Deine nächste Fahrt beginnt hier.</h1>
        <p className="lead">Finde freie Plätze, teile deine Route und mach deinen Weg ein bisschen einfacher.</p>
      </section>
      <section aria-labelledby="available-rides">
        <h2 id="available-rides">Verfügbare Fahrten</h2>
        {loading ? <p className="empty-state">Fahrten werden geladen ...</p> : null}
        {error ? <p className="error-message" role="alert">Fehler: {error}</p> : null}
        {!loading && !error && rides.length === 0 ? <p className="empty-state">Aktuell sind keine Fahrten verfügbar.</p> : null}
        <div className="ride-grid">
          {rides.map((ride) => (
            <article
              className={`card${hasRoute(ride) ? ' card-clickable' : ''}`}
              key={ride.id}
              onClick={() => {
                if (hasRoute(ride)) {
                  setExpandedRideId((current) => current === ride.id ? null : ride.id)
                }
              }}
              onKeyDown={(event) => {
                if (hasRoute(ride) && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault()
                  setExpandedRideId(ride.id)
                }
              }}
              role={hasRoute(ride) ? 'button' : undefined}
              tabIndex={hasRoute(ride) ? 0 : undefined}
            >
              <span className="eyebrow">{ride.status}</span>
              <div className="route">
                <strong>{ride.startLocation}</strong><span aria-hidden="true">→</span><strong>{ride.endLocation}</strong>
              </div>
              {hasRoute(ride) ? <p className="route-link">Strecke auf Karte anzeigen</p> : null}
              {expandedRideId === ride.id && hasRoute(ride) ? (
                <RouteMap
                  geometry={ride.routeGeometry!}
                  start={[ride.startLatitude!, ride.startLongitude!]}
                  end={[ride.endLatitude!, ride.endLongitude!]}
                />
              ) : null}
              {ride.routeDistanceKm !== null && ride.routeDurationMinutes !== null ? (
                <p className="route-summary">
                  {ride.routeDistanceKm.toFixed(1)} km · ca. {Math.round(ride.routeDurationMinutes)} min
                </p>
              ) : null}
              <div className="ride-meta">
                <p>{dateFormatter.format(new Date(ride.departureTime))}</p>
                <p>{ride.availableSeats} freie Plätze · Fahrer: {ride.driverUsername}</p>
              </div>

              <div className="ride-actions">
                {auth ? (
                  ride.driverUsername === auth.username ? (
                    <button type="button" disabled={cancellingRideId === ride.id} onClick={(event) => {
                      event.stopPropagation()
                      void handleCancelRide(ride)
                    }}>
                      {cancellingRideId === ride.id ? 'Storniere...' : 'Stornieren'}
                    </button>
                  ) : bookedRideIds.has(ride.id) ? (
                    <span className="ride-badge">Gebucht</span>
                  ) : (
                    <button type="button" disabled={bookingRideId === ride.id} onClick={(event) => {
                      event.stopPropagation()
                      void handleBookRide(ride)
                    }}>
                      {bookingRideId === ride.id
                        ? 'Buchung...'
                        : ride.estimatedCost != null
                          ? `Buchen (${currencyFormatter.format(ride.estimatedCost)})`
                          : 'Buchen'}
                    </button>
                  )
                ) : (
                  <Link className="button button-secondary" to="/login">Zum Buchen anmelden</Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
