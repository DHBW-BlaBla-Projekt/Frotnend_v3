import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyCars, type Car } from '../api/profileApi'
import { createRide } from '../api/rideApi'
import { useAuth } from '../context/useAuth'

export function CreateRidePage() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cars, setCars] = useState<Car[]>([])
  const [loadingCars, setLoadingCars] = useState(true)
  const [form, setForm] = useState({
    startLocation: '',
    endLocation: '',
    departureTime: '',
    availableSeats: '1',
    carId: '',
  })

  useEffect(() => {
    if (!auth) {
      setLoadingCars(false)
      return
    }

    getMyCars(auth.accessToken)
      .then(setCars)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Fahrzeuge konnten nicht geladen werden.')
      })
      .finally(() => setLoadingCars(false))
  }, [auth])

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth) return
    setError('')
    setSubmitting(true)
    try {
      await createRide({
        ...form,
        availableSeats: Number(form.availableSeats),
        carId: Number(form.carId),
      }, auth.accessToken)
      navigate('/')
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Fahrt konnte nicht erstellt werden.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell page">
      <section className="form-card">
        <span className="eyebrow">Neue Route</span>
        <h1>Fahrt anbieten</h1>
        <form className="form" onSubmit={handleSubmit}>

          <label>Start
          <input required value={form.startLocation} onChange={(event) => update('startLocation', event.target.value)} />
          </label>

          <label>Ziel
          <input required value={form.endLocation} onChange={(event) => update('endLocation', event.target.value)} />
          </label>

          <label>Abfahrt
          <input required type="datetime-local" value={form.departureTime} onChange={(event) => update('departureTime', event.target.value)} />
          </label>

          <label>Freie Plätze
          <input required min="1" type="number" value={form.availableSeats} onChange={(event) => update('availableSeats', event.target.value)} />
          </label>

          <label htmlFor="carId">Fahrzeug
          <select
            id="carId"
            required
            value={form.carId}
            disabled={loadingCars || cars.length === 0}
            onChange={(event) => update('carId', event.target.value)}
          >
            <option value="">
              {loadingCars ? 'Fahrzeuge werden geladen ...' : 'Fahrzeug auswählen'}
            </option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.name || `${car.brand} ${car.model}`} (ID: {car.id})
              </option>
            ))}
          </select>
          </label>

          {!loadingCars && cars.length === 0 && !error ? (
            <p className="error-message" role="alert">
              Du musst zuerst ein Fahrzeug in deinem Profil anlegen.
            </p>
          ) : null}

          {error ? <p className="error-message" role="alert">{error}</p> : null}

          <button disabled={submitting || loadingCars || cars.length === 0} type="submit">{submitting ? 'Wird veröffentlicht ...' : 'Fahrt veröffentlichen'}
          </button>
        </form>
      </section>
    </main>
  )
}
