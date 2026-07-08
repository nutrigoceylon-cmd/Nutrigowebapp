export type Coordinates = {
  lat: number
  lng: number
}

export type DeliveryZone = {
  id: string
  name: string
  center: Coordinates
  radiusKm: number
}

type CachedDeliveryValidation = {
  validatedAt: string
  expiresAt: string
  zoneId: string
}

export type DeliveryValidationResult = {
  isDeliverable: boolean
  matchedZone: DeliveryZone | null
  nearestZone: DeliveryZone | null
  distanceKm: number | null
}

const DELIVERY_CACHE_KEY = 'nutrigo.delivery-validation'

export const DELIVERY_SETTINGS = {
  cacheTtlHours: 24,
  geolocationOptions: {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  },
  zones: [
    {
      id: 'kahathuduwa-area',
      name: 'Kahathuduwa Area',
      // Covers: Kahathuduwa, Polgasowita, Kesbewa, Piliyandala,
      // Kiriwattuduwa, Diyagama, Mattegoda, and Gonapola.
      center: {
        lat: 6.785,
        lng: 79.978,
      },
      radiusKm: 8.5,
    },
    {
      id: 'moratuwa-area',
      name: 'Moratuwa Area',
      // Covers: Moratumulla, Katubedda, Rawathawatta, Molpe,
      // Borupana, Thelawala, Angulana, and the southern part of Rathmalana.
      center: {
        lat: 6.7989,
        lng: 79.8767,
      },
      radiusKm: 4.8,
    },
    {
      id: 'mawanella-area',
      name: 'Mawanella Area',
      // Covers Mawanella and nearby places within 15 km.
      center: {
        lat: 7.2513,
        lng: 80.4435,
      },
      radiusKm: 15,
    },
    {
      id: 'hemmathagama-area',
      name: 'Hemmathagama Area',
      // Covers Hemmathagama and nearby places within 15 km.
      center: {
        lat: 7.1686,
        lng: 80.4982,
      },
      radiusKm: 15,
    },
  ] satisfies DeliveryZone[],
} as const

export function toRadians(value: number) {
  return (value * Math.PI) / 180
}

// Haversine distance between two lat/lng points in kilometers.
export function calculateDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLng = toRadians(to.lng - from.lng)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

export function hasConfiguredDeliveryZones(zones: readonly DeliveryZone[] = DELIVERY_SETTINGS.zones) {
  return zones.length > 0 && zones.every(zone =>
    Number.isFinite(zone.center.lat) &&
    Number.isFinite(zone.center.lng) &&
    Math.abs(zone.center.lat) <= 90 &&
    Math.abs(zone.center.lng) <= 180 &&
    zone.radiusKm > 0
  )
}

export function validateDeliveryLocation(
  userLocation: Coordinates,
  zones: readonly DeliveryZone[] = DELIVERY_SETTINGS.zones
): DeliveryValidationResult {
  if (!hasConfiguredDeliveryZones(zones)) {
    return {
      isDeliverable: false,
      matchedZone: null,
      nearestZone: null,
      distanceKm: null,
    }
  }

  const distances = zones.map(zone => ({
    zone,
    distanceKm: calculateDistanceKm(userLocation, zone.center),
  }))

  const matched = distances.find(({ zone, distanceKm }) => distanceKm <= zone.radiusKm) ?? null
  const nearest = distances.reduce<(typeof distances)[number] | null>((closest, current) => {
    if (!closest || current.distanceKm < closest.distanceKm) return current
    return closest
  }, null)

  return {
    isDeliverable: Boolean(matched),
    matchedZone: matched?.zone ?? null,
    nearestZone: nearest?.zone ?? null,
    distanceKm: nearest ? Number(nearest.distanceKm.toFixed(2)) : null,
  }
}

export function readCachedDeliveryValidation(now = Date.now()) {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(DELIVERY_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as CachedDeliveryValidation
    const expiresAt = new Date(parsed.expiresAt).getTime()
    if (!parsed.zoneId || Number.isNaN(expiresAt) || expiresAt <= now) {
      window.localStorage.removeItem(DELIVERY_CACHE_KEY)
      return null
    }

    return parsed
  } catch {
    window.localStorage.removeItem(DELIVERY_CACHE_KEY)
    return null
  }
}

export function cacheSuccessfulDeliveryValidation(zoneId: string, now = Date.now()) {
  if (typeof window === 'undefined') return

  const validatedAt = new Date(now)
  const expiresAt = new Date(now + DELIVERY_SETTINGS.cacheTtlHours * 60 * 60 * 1000)

  const payload: CachedDeliveryValidation = {
    zoneId,
    validatedAt: validatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }

  window.localStorage.setItem(DELIVERY_CACHE_KEY, JSON.stringify(payload))
}
