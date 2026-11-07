import { useState, type FormEvent } from 'react'
import { login } from '../api/authApi'
import { useAuth } from '../context/useAuth'

export function LoginMpaPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { setAuth } = useAuth()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      setAuth(await login({ username, password }))
      window.location.assign('/')
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Anmeldung fehlgeschlagen.')
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell page">
      <section className="form-card">
        <span className="eyebrow">Willkommen zurück</span>
        <h1>Anmelden</h1>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Benutzername
            <input required value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            Passwort
            <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <p className="error-message" role="alert">{error}</p> : null}
          <button disabled={submitting} type="submit">
            {submitting ? 'Wird angemeldet ...' : 'Anmelden'}
          </button>
        </form>
        <p className="form-footer">
          Noch kein Konto? <a href="/register">Jetzt registrieren</a>
        </p>
        <p className="form-footer">
          <a href="/">Zurück zu den Fahrten</a>
        </p>
      </section>
    </main>
  )
}
