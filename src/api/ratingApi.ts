import { apiRequest } from './client'

const PROFILE_URL = import.meta.env.VITE_PROFILE_API_URL

export interface Rating {
  id: number
  passengerUsername: string
  rideId: number
  driverUsername: string
  rating: number
  comment: string | null
  createdAt: string
}

export function createRating(
  request: {
    rideId: number
    driverUsername: string
    rating: number
    comment?: string
  },
  token: string,
) {
  return apiRequest<{ rating: Rating }>(PROFILE_URL, '/api/profile/rate', {
    method: 'POST',
    body: JSON.stringify(request),
  }, token)
}

export function getDriverRatings(username: string) {
  return apiRequest<{ ratings: Rating[]; count: number }>(
    PROFILE_URL,
    `/api/profile/users/${encodeURIComponent(username)}/ratings`,
  )
}
