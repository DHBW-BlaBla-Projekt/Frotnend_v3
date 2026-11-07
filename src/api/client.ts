export async function apiRequest<T>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  if (!baseUrl) {
    throw new Error('Die API-URL ist nicht konfiguriert.')
  }

  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.text()
    let message: string | undefined
    try {
      const parsed = JSON.parse(body) as { error?: string; message?: string }
      message = parsed.error || parsed.message
    } catch {
      // Fall back to the raw response when the server did not return JSON.
    }
    throw new Error(message || body || `HTTP ${response.status}`)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}
