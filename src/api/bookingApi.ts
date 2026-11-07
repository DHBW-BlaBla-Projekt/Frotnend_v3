import { apiRequest } from './client'

const BOOKING_URL = import.meta.env.VITE_BOOKING_API_URL

export interface BookingResponse {
  id: number
  rideId: number
  passengerUsername: string
  status: string
  createdAt?: string
}

export function getMyBookings(token: string) {
  return apiRequest<BookingResponse[]>(BOOKING_URL, '/api/bookings/my-bookings', {}, token)
}

export function createBooking(rideId: number, token: string) {
  return apiRequest<BookingResponse>(BOOKING_URL, '/api/bookings', {
    method: 'POST',
    body: JSON.stringify({ rideId }),
  }, token)
}

export function cancelBooking(bookingId: number, token: string) {
  return apiRequest<void>(BOOKING_URL, `/api/bookings/${bookingId}`, {
    method: 'DELETE',
  }, token)
}
