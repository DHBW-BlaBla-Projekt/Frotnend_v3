import { useEffect, useState } from 'react'
import { cancelBooking, getMyBookings, type BookingResponse } from '../api/bookingApi'
import { useAuth } from '../context/useAuth'

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function BookingsPage() {
  const { auth } = useAuth()
  const [bookings, setBookings] = useState<BookingResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    getMyBookings(auth.accessToken)
      .then(setBookings)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Deine Buchungen konnten nicht geladen werden.')
      })
      .finally(() => setLoading(false))
  }, [auth])

  async function handleCancelBooking(bookingId: number) {
    if (!auth) return

    setCancellingId(bookingId)
    try {
      await cancelBooking(bookingId, auth.accessToken)
      setBookings((current) => current.filter((booking) => booking.id !== bookingId))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Buchung konnte nicht gelöscht werden.')
    } finally {
      setCancellingId(null)
    }
  }

  if (!auth) {
    return (
      <main className="app-shell page">
        <section className="hero">
          <span className="eyebrow">Anmeldung erforderlich</span>
          <h1>Meine Buchungen</h1>
          <p className="lead">Melde dich an, um deine Reservierungen zu sehen und zu stornieren.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell page">
      <section aria-labelledby="my-bookings">
        <h1 id="my-bookings">Meine Buchungen</h1>
        {loading ? <p className="empty-state">Buchungen werden geladen ...</p> : null}
        {error ? <p className="error-message" role="alert">Fehler: {error}</p> : null}
        {!loading && !error && bookings.length === 0 ? <p className="empty-state">Du hast noch keine Buchungen.</p> : null}

        <div className="bookings-list">
          {bookings.map((booking) => (
            <article className="card booking-card" key={booking.id}>
              <div className="booking-header">
                <div>
                  <span className="eyebrow">Mitfahrt</span>
                  <h2>Booking #{booking.id}</h2>
                </div>
                <span className="booking-status">{booking.status}</span>
              </div>

              <div className="booking-meta">
                <p><strong>Ride-ID:</strong> {booking.rideId}</p>
                <p><strong>Fahrgast:</strong> {booking.passengerUsername}</p>
                {booking.createdAt ? <p><strong>Erstellt:</strong> {dateFormatter.format(new Date(booking.createdAt))}</p> : null}
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={() => handleCancelBooking(booking.id)}
                disabled={cancellingId === booking.id}
              >
                {cancellingId === booking.id ? 'Wird storniert...' : 'Buchung stornieren'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
