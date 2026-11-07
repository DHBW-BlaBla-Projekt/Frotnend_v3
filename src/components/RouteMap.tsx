import { useMemo, useRef, useState } from 'react'

interface RouteMapProps {
  geometry: string
  start: [number, number]
  end: [number, number]
}

interface Point {
  longitude: number
  latitude: number
}

const WIDTH = 1000
const HEIGHT = 460
const TILE_SIZE = 256
const FIT_PADDING = 48
const MAX_LATITUDE = 85.05112878

interface ProjectedPoint {
  x: number
  y: number
}

interface MapTile {
  key: string
  url: string
  left: number
  top: number
}

interface Viewport {
  x: number
  y: number
  width: number
  height: number
}

function project(longitude: number, latitude: number, zoom: number): ProjectedPoint {
  const scale = TILE_SIZE * 2 ** zoom
  const safeLatitude = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude))
  const latitudeRadians = safeLatitude * Math.PI / 180

  return {
    x: (longitude + 180) / 360 * scale,
    y: (1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2 * scale,
  }
}

function getTiles(center: ProjectedPoint, zoom: number): MapTile[] {
  const left = center.x - WIDTH / 2
  const top = center.y - HEIGHT / 2
  const firstTileX = Math.floor(left / TILE_SIZE)
  const lastTileX = Math.floor((left + WIDTH) / TILE_SIZE)
  const firstTileY = Math.floor(top / TILE_SIZE)
  const lastTileY = Math.floor((top + HEIGHT) / TILE_SIZE)
  const tileCount = 2 ** zoom
  const tiles: MapTile[] = []

  for (let tileY = firstTileY; tileY <= lastTileY; tileY += 1) {
    if (tileY < 0 || tileY >= tileCount) {
      continue
    }

    for (let tileX = firstTileX; tileX <= lastTileX; tileX += 1) {
      const wrappedTileX = ((tileX % tileCount) + tileCount) % tileCount
      tiles.push({
        key: `${zoom}-${tileX}-${tileY}`,
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedTileX}/${tileY}.png`,
        left: tileX * TILE_SIZE - left,
        top: tileY * TILE_SIZE - top,
      })
    }
  }

  return tiles
}

export function RouteMap({ geometry, start, end }: RouteMapProps) {
  const route = useMemo(() => {
    try {
      const parsed = JSON.parse(geometry) as { type?: string; coordinates?: unknown }
      if (parsed.type !== 'LineString' || !Array.isArray(parsed.coordinates)) {
        return { error: 'Die gespeicherten Routendaten sind ungültig.' }
      }

      const points = parsed.coordinates
        .filter((coordinate): coordinate is [number, number] => (
          Array.isArray(coordinate)
          && coordinate.length >= 2
          && typeof coordinate[0] === 'number'
          && typeof coordinate[1] === 'number'
        ))
        .map(([longitude, latitude]) => ({ longitude, latitude }))

      if (points.length < 2) {
        return { error: 'Die gespeicherte Route enthält zu wenige Punkte.' }
      }

      const allPoints = [
        ...points,
        { longitude: start[1], latitude: start[0] },
        { longitude: end[1], latitude: end[0] },
      ]
      const longitudes = allPoints.map((point) => point.longitude)
      const latitudes = allPoints.map((point) => point.latitude)
      const minLongitude = Math.min(...longitudes)
      const maxLongitude = Math.max(...longitudes)
      const minLatitude = Math.min(...latitudes)
      const maxLatitude = Math.max(...latitudes)
      const routeBounds = {
        minLongitude,
        maxLongitude,
        minLatitude,
        maxLatitude,
      }
      let zoom = 18
      let center = project((minLongitude + maxLongitude) / 2, (minLatitude + maxLatitude) / 2, zoom)

      while (zoom > 1) {
        const projectedBounds = [
          project(minLongitude, minLatitude, zoom),
          project(maxLongitude, maxLatitude, zoom),
        ]
        const projectedWidth = projectedBounds[1].x - projectedBounds[0].x
        const projectedHeight = projectedBounds[0].y - projectedBounds[1].y
        if (projectedWidth <= WIDTH - FIT_PADDING * 2 && projectedHeight <= HEIGHT - FIT_PADDING * 2) {
          center = {
            x: (projectedBounds[0].x + projectedBounds[1].x) / 2,
            y: (projectedBounds[0].y + projectedBounds[1].y) / 2,
          }
          break
        }
        zoom -= 1
      }

      const finalBounds = [
        project(minLongitude, minLatitude, zoom),
        project(maxLongitude, maxLatitude, zoom),
      ]
      center = {
        x: (finalBounds[0].x + finalBounds[1].x) / 2,
        y: (finalBounds[0].y + finalBounds[1].y) / 2,
      }
      const origin = {
        x: center.x - WIDTH / 2,
        y: center.y - HEIGHT / 2,
      }
      const projectForMap = (point: Point) => {
        const projected = project(point.longitude, point.latitude, zoom)
        return {
          x: projected.x - origin.x,
          y: projected.y - origin.y,
        }
      }

      return {
        points: points.map(projectForMap),
        start: projectForMap({ longitude: start[1], latitude: start[0] }),
        end: projectForMap({ longitude: end[1], latitude: end[0] }),
        tiles: getTiles(center, zoom).map((tile) => ({
          ...tile,
          left: tile.left,
          top: tile.top,
        })),
        bounds: routeBounds,
      }
    } catch (reason) {
      console.error('Die Streckendaten konnten nicht verarbeitet werden.', reason)
      return { error: 'Die Streckendaten konnten nicht verarbeitet werden.' }
    }
  }, [geometry, start, end])

  const [viewport, setViewport] = useState<Viewport>({
    x: 0,
    y: 0,
    width: WIDTH,
    height: HEIGHT,
  })
  const dragStart = useRef<{ pointerX: number; pointerY: number; viewport: Viewport } | null>(null)

  if ('error' in route) {
    return <p className="error-message" role="alert">{route.error}</p>
  }

  const points = route.points.map((point) => `${point.x},${point.y}`).join(' ')
  const zoom = (factor: number, focalPoint = { x: WIDTH / 2, y: HEIGHT / 2 }) => {
    setViewport((current) => {
      const nextWidth = Math.max(WIDTH / 4, Math.min(WIDTH, current.width * factor))
      const nextHeight = Math.max(HEIGHT / 4, Math.min(HEIGHT, current.height * factor))
      const relativeX = (focalPoint.x - current.x) / current.width
      const relativeY = (focalPoint.y - current.y) / current.height
      const nextX = focalPoint.x - relativeX * nextWidth
      const nextY = focalPoint.y - relativeY * nextHeight

      return {
        x: Math.max(0, Math.min(WIDTH - nextWidth, nextX)),
        y: Math.max(0, Math.min(HEIGHT - nextHeight, nextY)),
        width: nextWidth,
        height: nextHeight,
      }
    })
  }

  return (
    <div className="route-map" aria-label={`Karte der Fahrstrecke von ${route.bounds.minLatitude.toFixed(3)}, ${route.bounds.minLongitude.toFixed(3)} nach ${route.bounds.maxLatitude.toFixed(3)}, ${route.bounds.maxLongitude.toFixed(3)}`}>
      <svg
        className="route-map-overlay"
        viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
        role="img"
        aria-label="Visualisierung der gespeicherten Fahrstrecke. Ziehen zum Verschieben, Mausrad zum Zoomen."
        onClick={(event) => {
          event.stopPropagation()
        }}
        onWheel={(event) => {
          event.preventDefault()
          event.stopPropagation()
          const bounds = event.currentTarget.getBoundingClientRect()
          const focalPoint = {
            x: viewport.x + ((event.clientX - bounds.left) / bounds.width) * viewport.width,
            y: viewport.y + ((event.clientY - bounds.top) / bounds.height) * viewport.height,
          }
          zoom(event.deltaY > 0 ? 1.15 : 0.87, focalPoint)
        }}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          event.currentTarget.setPointerCapture(event.pointerId)
          dragStart.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            viewport,
          }
        }}
        onPointerMove={(event) => {
          if (!dragStart.current) {
            return
          }
          event.preventDefault()
          const bounds = event.currentTarget.getBoundingClientRect()
          const scaleX = viewport.width / bounds.width
          const scaleY = viewport.height / bounds.height
          const deltaX = (event.clientX - dragStart.current.pointerX) * scaleX
          const deltaY = (event.clientY - dragStart.current.pointerY) * scaleY
          const initial = dragStart.current.viewport
          setViewport({
            ...initial,
            x: Math.max(0, Math.min(WIDTH - initial.width, initial.x - deltaX)),
            y: Math.max(0, Math.min(HEIGHT - initial.height, initial.y - deltaY)),
          })
        }}
        onPointerUp={(event) => {
          dragStart.current = null
          event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => {
          dragStart.current = null
        }}
      >
        {route.tiles.map((tile) => (
          <image
            key={tile.key}
            href={tile.url}
            x={tile.left}
            y={tile.top}
            width={TILE_SIZE}
            height={TILE_SIZE}
            preserveAspectRatio="none"
          />
        ))}
        <polyline points={points} fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" />
        <polyline points={points} fill="none" stroke="#ea580c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" />
        <circle cx={route.start.x} cy={route.start.y} r="11" fill="#22c55e" stroke="#166534" strokeWidth="4" />
        <circle cx={route.end.x} cy={route.end.y} r="11" fill="#ef4444" stroke="#991b1b" strokeWidth="4" />
        <text x={route.start.x + 16} y={route.start.y - 14} fill="#166534" fontSize="18" fontWeight="700">Start</text>
        <text x={route.end.x + 16} y={route.end.y - 14} fill="#991b1b" fontSize="18" fontWeight="700">Ziel</text>
      </svg>
      <div className="route-map-controls" aria-label="Kartensteuerung">
        <button type="button" aria-label="Karte vergrößern" onClick={(event) => {
          event.stopPropagation()
          zoom(0.75)
        }}>+</button>
        <button type="button" aria-label="Karte verkleinern" onClick={(event) => {
          event.stopPropagation()
          zoom(1.33)
        }}>−</button>
      </div>
      <span className="route-map-attribution">© OpenStreetMap-Mitwirkende</span>
    </div>
  )
}
