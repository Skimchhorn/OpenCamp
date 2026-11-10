// Empty base = same origin (the Vite dev proxy, or a production host serving both).
const BASE = import.meta.env.VITE_API_URL ?? ''

// shortcut: the token lives in localStorage, so any XSS on this origin can read it; move to an HTTP-only cookie once the backend supports cookie auth.
export const TOKEN_KEY = 'opencamp.token'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** fetch with the bearer token; JSON bodies by default, FormData passed through. Throws ApiError on non-2xx. */
export async function api<T = void>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) headers.Authorization = `Bearer ${token}`
  let body: BodyInit | undefined
  if (opts.body instanceof FormData) body = opts.body
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }
  const res = await fetch(BASE + path, { method: opts.method ?? (body ? 'POST' : 'GET'), headers, body })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new ApiError(res.status, data?.detail || data?.message || data?.error || `Request failed (${res.status})`)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}

/** Initial map view: southwest British Columbia, where the first listings are. */
export const DEFAULT_CENTER: [number, number] = [49.7, -123.1]

export const assetUrl = (path: string) => BASE + path

/** A user-facing message for a failed request; `conflict` overrides the 409 text. */
export function errorText(err: unknown, conflict = 'That already exists.'): string {
  if (!(err instanceof ApiError)) return 'Network error. Check your connection and try again.'
  switch (err.status) {
    case 400: return 'Some fields are missing or invalid. Please check them and try again.'
    case 401: return 'Please sign in and try again.'
    case 403: return 'You do not have permission to do that.'
    case 404: return 'Not found. It may have been removed.'
    case 409: return conflict
    case 413: return 'That file is too large (5 MB maximum).'
    case 415: return 'Only JPEG, PNG or WebP images are allowed.'
    default: return `Something went wrong (${err.status}). Please try again.`
  }
}

export type Me = { id: number; email: string; role: 'USER' | 'ADMIN' }

export type Campsite = {
  id: number
  name: string
  description: string
  latitude: number
  longitude: number
  region: string
  roadCondition: string
  vehicleRequired: string
  campingType: string | null
  toiletAvailable: boolean | null
  waterAvailable: boolean | null
  cellSignal: string | null
  fireAllowed: boolean | null
  parkingAvailable: boolean | null
  legalStatus: string
  status: string
  createdBy: number
  lastVerifiedAt: string | null
  ratingAvg: number | null
  reviewCount: number
  createdAt: string
  updatedAt: string
}

export type Review = {
  id: number
  userId: number
  rating: number
  reviewText: string | null
  visitedAt: string | null
  roadRating: number | null
  cleanlinessRating: number | null
  safetyRating: number | null
  crowdednessRating: number | null
  createdAt: string
}

export type Verification = {
  id: number
  userId: number
  isOpen: boolean
  isFree: boolean
  campingAllowed: boolean
  roadAccessible: boolean | null
  feltSafe: boolean
  wasClean: boolean | null
  wasCrowded: boolean | null
  cellSignal: string | null
  fireBanSignSeen: boolean | null
  visitedAt: string
  notes: string | null
  createdAt: string
}

export type Photo = { id: number; uploadedBy: number; imageUrl: string; caption: string | null }

export type AdminReport = {
  id: number
  campsiteId: number
  campsiteName: string
  reason: string
  description: string | null
  status: string
  reportedBy: number
  createdAt: string
  resolvedAt: string | null
}

// Mirrors the backend enums.
export const ROAD_CONDITIONS = ['PAVED', 'GRAVEL', 'ROUGH_GRAVEL', 'DIRT', 'MUDDY', 'FOUR_BY_FOUR_ONLY', 'UNKNOWN']
export const VEHICLES = ['ANY_CAR', 'SUV_RECOMMENDED', 'FOUR_BY_FOUR_REQUIRED', 'WALK_IN_ONLY', 'UNKNOWN']
/** Legal statuses a contributor may submit; the backend rejects NOT_ALLOWED, PRIVATE_PROPERTY and CLOSED. */
export const SUBMITTABLE_LEGAL = ['OFFICIAL_FREE_SITE', 'PUBLIC_LAND_DISPERSED', 'NEEDS_VERIFICATION', 'UNKNOWN']
export const ALL_LEGAL = [...SUBMITTABLE_LEGAL, 'NOT_ALLOWED', 'PRIVATE_PROPERTY', 'CLOSED']
export const STATUSES = ['VERIFIED_RECENTLY', 'NEEDS_UPDATE', 'REPORTED_CLOSED', 'REPORTED_UNSAFE', 'REPORTED_ILLEGAL', 'HIDDEN']
export const REPORT_REASONS = ['NOT_FREE', 'PRIVATE_PROPERTY', 'CAMPING_NOT_ALLOWED', 'CLOSED', 'UNSAFE', 'WRONG_LOCATION', 'FAKE_LISTING', 'SPAM', 'DUPLICATE', 'INAPPROPRIATE_PHOTO', 'OTHER']
export const REPORT_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED']
