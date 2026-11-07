# BlaBla Frontend v1

React + Vite + TypeScript frontend for the BlaBla carpooling project.

The project intentionally demonstrates both rendering models:

- The main application (`/`) is a SPA. React Router changes pages without
  loading a new HTML document.
- The login is an MPA entry point (`/login.html`). It has its own HTML document,
  JavaScript entry point, and full-page navigation back to `/` after login.

## Local development

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The application uses the following backend endpoints:

- `VITE_AUTH_API_URL` for login and registration
- `VITE_RIDE_API_URL` for public rides and creating rides
- `VITE_BOOKING_API_URL` for future booking functionality

Routes are calculated by the ride-offer backend with OpenRouteService when a
ride is created. The backend stores the route geometry, coordinates, distance,
and duration; the frontend renders these values with Leaflet and OpenStreetMap.

The application is available at `http://localhost:5173`.

Open `http://localhost:5173/login.html` to test the MPA login directly. Vite
detects `login.html` as a second build entry and emits it separately into
`dist/login.html`.

## Commands

```powershell
npm run build
npm run lint
```
