import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createProfileCar,
  getVehicleDetails,
  getVehicleMakes,
  getVehicleModels,
  getVehicleOptions,
  getVehicleYears,
  type CreateCarRequest,
  type VehicleDetails,
  type VehicleMenuItem,
  type VehicleOption,
} from '../api/profileApi'
import { useAuth } from '../context/useAuth'

type FuelType = CreateCarRequest['fuelType']

const fuelTypes: { value: FuelType; label: string }[] = [
  { value: 'PETROL', label: 'Benzin' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'ELECTRIC', label: 'Elektrisch' },
  { value: 'HYBRID', label: 'Hybrid' },
]

function suggestedFuelType(fuelType: string): FuelType | '' {
  const fuel = fuelType.toLowerCase()
  if (fuel.includes('hybrid') || fuel.includes('and electricity') || fuel.includes('electricity and')) return 'HYBRID'
  if (fuel.includes('diesel')) return 'DIESEL'
  if (fuel.includes('electric')) return 'ELECTRIC'
  if (fuel.includes('gasoline') || fuel.includes('regular') || fuel.includes('premium') || fuel.includes('midgrade')) return 'PETROL'
  return ''
}

export function CreateCarPage() {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [years, setYears] = useState<VehicleMenuItem[]>([])
  const [makes, setMakes] = useState<VehicleMenuItem[]>([])
  const [models, setModels] = useState<VehicleMenuItem[]>([])
  const [options, setOptions] = useState<VehicleOption[]>([])
  const [details, setDetails] = useState<VehicleDetails | null>(null)
  const [year, setYear] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [fuelType, setFuelType] = useState<FuelType | ''>('')
  const [consumption, setConsumption] = useState('')
  const [name, setName] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [loading, setLoading] = useState<Record<string, boolean>>({ years: true })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const selectionRequest = useRef(0)

  function setLoadingStep(step: string, isLoading: boolean) {
    setLoading((current) => ({ ...current, [step]: isLoading }))
  }

  useEffect(() => {
    let active = true
    getVehicleYears()
      .then((result) => { if (active) setYears(result) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Baujahre konnten nicht geladen werden.') })
      .finally(() => { if (active) setLoadingStep('years', false) })
    return () => { active = false }
  }, [])

  async function handleYearChange(value: string) {
    const requestId = ++selectionRequest.current
    setYear(value); setMake(''); setMakes([]); setModel(''); setModels([]); setVehicleId(''); setOptions([]); setDetails(null); setError(''); setLoading({})
    if (!value) return
    setLoadingStep('makes', true)
    try {
      const result = await getVehicleMakes(value)
      if (requestId === selectionRequest.current) setMakes(result)
    } catch (reason: unknown) {
      if (requestId === selectionRequest.current) setError(reason instanceof Error ? reason.message : 'Marken konnten nicht geladen werden.')
    } finally {
      if (requestId === selectionRequest.current) setLoadingStep('makes', false)
    }
  }

  async function handleMakeChange(value: string) {
    const requestId = ++selectionRequest.current
    setMake(value); setModel(''); setModels([]); setVehicleId(''); setOptions([]); setDetails(null); setError(''); setLoading({})
    if (!year || !value) return
    setLoadingStep('models', true)
    try {
      const result = await getVehicleModels(year, value)
      if (requestId === selectionRequest.current) setModels(result)
    } catch (reason: unknown) {
      if (requestId === selectionRequest.current) setError(reason instanceof Error ? reason.message : 'Modelle konnten nicht geladen werden.')
    } finally {
      if (requestId === selectionRequest.current) setLoadingStep('models', false)
    }
  }

  async function handleModelChange(value: string) {
    const requestId = ++selectionRequest.current
    setModel(value); setVehicleId(''); setOptions([]); setDetails(null); setError(''); setLoading({})
    if (!year || !make || !value) return
    setLoadingStep('options', true)
    try {
      const result = await getVehicleOptions(year, make, value)
      if (requestId === selectionRequest.current) setOptions(result)
    } catch (reason: unknown) {
      if (requestId === selectionRequest.current) setError(reason instanceof Error ? reason.message : 'Fahrzeugoptionen konnten nicht geladen werden.')
    } finally {
      if (requestId === selectionRequest.current) setLoadingStep('options', false)
    }
  }

  async function handleOptionChange(value: string) {
    const requestId = ++selectionRequest.current
    setVehicleId(value); setDetails(null); setError(''); setFuelType(''); setConsumption(''); setLoading({})
    if (!value) return
    setLoadingStep('details', true)
    try {
      const vehicleDetails = await getVehicleDetails(Number(value))
      if (requestId === selectionRequest.current) {
        setDetails(vehicleDetails)
        setFuelType(suggestedFuelType(vehicleDetails.fuelType))
        setConsumption(vehicleDetails.consumptionLPer100Km?.toString() ?? '')
      }
    } catch (reason: unknown) {
      if (requestId === selectionRequest.current) setError(reason instanceof Error ? reason.message : 'Fahrzeugdetails konnten nicht geladen werden.')
    } finally {
      if (requestId === selectionRequest.current) setLoadingStep('details', false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth || !details || !fuelType) return
    setError(''); setSubmitting(true)
    const request: CreateCarRequest = {
      brand: details.make,
      model: details.model,
      averageConsumptionLPer100km: Number(consumption),
      fuelType,
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(licensePlate.trim() ? { licensePlate: licensePlate.trim() } : {}),
    }
    try {
      await createProfileCar(request, auth.accessToken)
      navigate('/rides/new')
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Fahrzeug konnte nicht gespeichert werden.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell page">
      <section className="form-card vehicle-form-card">
        <Link className="back-link" to="/">← Fahrten</Link>
        <span className="eyebrow">Fahrzeugprofil</span>
        <h1>Auto hinzufügen</h1>
        <p className="lead">Wähle dein Fahrzeug aus der Fuel-Economy-Datenbank aus.</p>
        <form className="form" onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="vehicle-year">1. Baujahr</label>
          <select id="vehicle-year" required value={year} disabled={loading.years} onChange={(event) => void handleYearChange(event.target.value)}>
            <option value="">{loading.years ? 'Baujahre werden geladen ...' : 'Baujahr auswählen'}</option>
            {years.map((item) => <option key={item.value} value={item.value}>{item.text}</option>)}
          </select>
          <label htmlFor="vehicle-make">2. Marke</label>
          <select id="vehicle-make" required value={make} disabled={!year || loading.makes} onChange={(event) => void handleMakeChange(event.target.value)}>
            <option value="">{loading.makes ? 'Marken werden geladen ...' : 'Marke auswählen'}</option>
            {makes.map((item) => <option key={item.value} value={item.value}>{item.text}</option>)}
          </select>
          <label htmlFor="vehicle-model">3. Modell</label>
          <select id="vehicle-model" required value={model} disabled={!make || loading.models} onChange={(event) => void handleModelChange(event.target.value)}>
            <option value="">{loading.models ? 'Modelle werden geladen ...' : 'Modell auswählen'}</option>
            {models.map((item) => <option key={item.value} value={item.value}>{item.text}</option>)}
          </select>
          <label htmlFor="vehicle-option">4. Fahrzeugoption</label>
          <select id="vehicle-option" required value={vehicleId} disabled={!model || loading.options} onChange={(event) => void handleOptionChange(event.target.value)}>
            <option value="">{loading.options ? 'Optionen werden geladen ...' : 'Option auswählen'}</option>
            {options.map((item) => <option key={item.vehicleId} value={item.vehicleId}>{item.label}</option>)}
          </select>
          {loading.details ? <p className="empty-state">Fahrzeugdetails werden geladen ...</p> : null}
          {details ? (
            <section className="vehicle-details" aria-labelledby="vehicle-details-title">
              <h2 id="vehicle-details-title">5. Fahrzeugdetails</h2>
              <p>{details.year ?? year} {details.make} {details.model}</p>
              <p><strong>Verbrauch:</strong> {details.consumptionLPer100Km == null ? 'Keine Angabe' : `${details.consumptionLPer100Km} l/100 km`}</p>
              <p><strong>Kraftstoff laut API:</strong> {details.fuelType || 'Keine Angabe'}</p>
              <label htmlFor="vehicle-consumption">Durchschnittsverbrauch (l/100 km)</label>
              <input id="vehicle-consumption" required min="0" step="any" type="number" value={consumption} onChange={(event) => setConsumption(event.target.value)} />
              <label htmlFor="vehicle-fuel">Kraftstoffart für dein Profil</label>
              <select id="vehicle-fuel" required value={fuelType} onChange={(event) => setFuelType(event.target.value as FuelType)}>
                <option value="">Kraftstoffart auswählen</option>
                {fuelTypes.map((fuel) => <option key={fuel.value} value={fuel.value}>{fuel.label}</option>)}
              </select>
              <label htmlFor="vehicle-name">Fahrzeugname (optional)</label>
              <input id="vehicle-name" maxLength={50} value={name} onChange={(event) => setName(event.target.value)} />
              <label htmlFor="vehicle-license">Kennzeichen (optional)</label>
              <input id="vehicle-license" value={licensePlate} onChange={(event) => setLicensePlate(event.target.value)} />
            </section>
          ) : null}
          {error ? <p className="error-message" role="alert">{error}</p> : null}
          <button disabled={!details || submitting || loading.details} type="submit">{submitting ? 'Wird gespeichert ...' : 'Fahrzeug speichern'}</button>
        </form>
      </section>
    </main>
  )
}
