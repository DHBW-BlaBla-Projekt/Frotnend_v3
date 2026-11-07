import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/authApi'

export function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(username, password)
      setSuccess(true)
      window.setTimeout(() => navigate('/login'), 1200)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Registrierung fehlgeschlagen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell page">
      <section className="form-card">
        <span className="eyebrow">BlaBla beitreten</span>
        <h1>Registrieren</h1>
        <form className="form" onSubmit={handleSubmit}>
          <label>Benutzername<input required minLength={3} value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label>Passwort<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error ? <p className="error-message" role="alert">{error}</p> : null}
          {success ? <p className="empty-state" role="status">Konto erstellt. Weiterleitung zur Anmeldung ...</p> : null}
          <button disabled={submitting || success} type="submit">{submitting ? 'Wird erstellt ...' : 'Konto erstellen'}</button>
        </form>
        <p className="form-footer">Schon registriert? <Link to="/login">Anmelden</Link></p>
      </section>
    </main>
  )
}
