import { useEffect, useState } from 'react'
import { cancelBooking, getMyBookingHistory, getMyBookings, type BookingResponse } from '../api/bookingApi'
import { createRating, getDriverRatings } from '../api/ratingApi'
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
  const [history, setHistory] = useState<BookingResponse[]>([])
  const [ratingBookingId, setRatingBookingId] = useState<number | null>(null)
  const [ratingValues, setRatingValues] = useState<Record<number, number>>({})
  const [ratingComments, setRatingComments] = useState<Record<number, string>>({})
  const [ratedRideIds, setRatedRideIds] = useState<Set<number>>(new Set())
  const [ratingLoadingId, setRatingLoadingId] = useState<number | null>(null)
  const activeBookings = bookings.filter((booking) => booking.status === 'CONFIRMED')

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    Promise.all([
      getMyBookings(auth.accessToken),
      getMyBookingHistory(auth.accessToken),
    ])
      .then(async ([nextBookings, nextHistory]) => {
        setBookings(nextBookings)
        setHistory(nextHistory)
        const drivers = [...new Set(nextHistory.map((booking) => booking.driverUsername).filter(Boolean))]
        const ratings = await Promise.all(drivers.map((driver) => getDriverRatings(driver!)))
        const ownRatings = ratings.flatMap((response) => response.ratings)
          .filter((rating) => rating.passengerUsername.toLowerCase() === auth.username.toLowerCase())
        setRatedRideIds(new Set(ownRatings.map((rating) => rating.rideId)))
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Deine Buchungen konnten nicht geladen werden.')
      })
      .finally(() => setLoading(false))
  }, [auth])

  async function handleRateBooking(booking: BookingResponse) {
    if (!auth || !booking.driverUsername) return

    const rating = ratingValues[booking.id] ?? 0
    if (rating < 1 || rating > 5) {
      setError('Bitte wähle eine Bewertung zwischen 1 und 5 Sternen.')
      return
    }

    setRatingLoadingId(booking.id)
    setError('')
    try {
      await createRating({
        rideId: booking.rideId,
        driverUsername: booking.driverUsername,
        rating,
        comment: ratingComments[booking.id]?.trim() || undefined,
      }, auth.accessToken)
      setRatedRideIds((current) => new Set(current).add(booking.rideId))
      setRatingBookingId(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Die Bewertung konnte nicht gespeichert werden.')
    } finally {
      setRatingLoadingId(null)
    }
  }

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
        {!loading && !error && activeBookings.length === 0 ? <p className="empty-state">Du hast noch keine Buchungen.</p> : null}

        <div className="bookings-list">
          {activeBookings.map((booking) => (
            <article className="card booking-card" key={booking.id}>
              <div className="booking-header">
                <div>
                  <span className="eyebrow">Mitfahrt</span>
                  <h2>
                    Booking #{booking.id}
                    {booking.startLocation || booking.endLocation
                      ? ` · ${booking.startLocation ?? 'Unbekannt'} → ${booking.endLocation ?? 'Unbekannt'}`
                      : ''}
                  </h2>
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

      <section aria-labelledby="booking-history">
        <h2 id="booking-history">Vergangene Fahrten</h2>
        {history.length === 0 ? <p className="empty-state">Noch keine vergangenen Fahrten.</p> : null}
        <div className="bookings-list">
          {history.map((booking) => (
            <article className="card booking-card" key={`history-${booking.id}`}>
              <div className="booking-header">
                <div>
                  <span className="eyebrow">Fahrt beendet</span>
                  <h2>
                    Booking #{booking.id} · {booking.startLocation ?? 'Unbekannt'} → {booking.endLocation ?? 'Unbekannt'}
                  </h2>
                </div>
                <span className="booking-status">BEWERTUNG</span>
              </div>
              <div className="booking-meta">
                <p><strong>Fahrer:</strong> {booking.driverUsername ?? 'Unbekannt'}</p>
                {booking.departureTime ? <p><strong>Abfahrt:</strong> {dateFormatter.format(new Date(booking.departureTime))}</p> : null}
              </div>

              {ratedRideIds.has(booking.rideId) ? (
                <p className="rating-complete">Du hast diese Fahrt bereits bewertet.</p>
              ) : ratingBookingId === booking.id ? (
                <div className="rating-form">
                  <div className="rating-stars" role="radiogroup" aria-label="Bewertung auswählen">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={value <= (ratingValues[booking.id] ?? 0) ? 'star-button selected' : 'star-button'}
                        onClick={() => setRatingValues((current) => ({ ...current, [booking.id]: value }))}
                        aria-label={`${value} Sterne`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={ratingComments[booking.id] ?? ''}
                    onChange={(event) => setRatingComments((current) => ({ ...current, [booking.id]: event.target.value }))}
                    placeholder="Optionaler Kommentar"
                    rows={3}
                  />
                  <div className="rating-actions">
                    <button type="button" onClick={() => void handleRateBooking(booking)} disabled={ratingLoadingId === booking.id}>
                      {ratingLoadingId === booking.id ? 'Speichere...' : 'Bewertung senden'}
                    </button>
                    <button type="button" className="secondary-button" onClick={() => setRatingBookingId(null)}>Abbrechen</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setRatingBookingId(booking.id)}>Fahrer bewerten</button>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
