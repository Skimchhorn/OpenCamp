export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

export type Campsite = {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  region: string;
  roadCondition: string;
  vehicleRequired: string;
  campingType: string | null;
  toiletAvailable: boolean | null;
  waterAvailable: boolean | null;
  cellSignal: string | null;
  fireAllowed: boolean | null;
  parkingAvailable: boolean | null;
  legalStatus: string;
  status: string;
  createdBy: number;
  lastVerifiedAt: string | null;
  ratingAvg: number | null;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Review = {
  id: number;
  userId: number;
  rating: number;
  reviewText: string | null;
  visitedAt: string | null;
  roadRating: number | null;
  cleanlinessRating: number | null;
  safetyRating: number | null;
  crowdednessRating: number | null;
  createdAt: string;
};

export type Verification = {
  id: number;
  isOpen: boolean;
  isFree: boolean;
  campingAllowed: boolean;
  roadAccessible: boolean | null;
  feltSafe: boolean;
  wasClean: boolean | null;
  wasCrowded: boolean | null;
  cellSignal: string | null;
  fireBanSignSeen: boolean | null;
  visitedAt: string;
  notes: string | null;
  createdAt: string;
};

export type Photo = { id: number; imageUrl: string; caption: string | null };

export type Me = { id: number; email: string; role: string };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Set by AuthProvider; kept here so every request picks it up without threading it through.
let token: string | null = null;
export function setApiToken(value: string | null) {
  token = value;
}

/** fetch wrapper: adds the bearer token, sends JSON bodies, throws ApiError on non-2xx. */
export async function api<T = void>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (json !== undefined) headers.set('Content-Type', 'application/json');
  const res = await fetch(API_URL + path, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.detail || body?.message || `Request failed (${res.status})`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return 'Please sign in again.';
    if (e.status === 400 && e.message.startsWith('Request failed')) return 'Please check the form and try again.';
    return e.message;
  }
  // fetch rejects with a TypeError when the server is unreachable.
  if (e instanceof Error && !(e instanceof TypeError)) return e.message;
  return 'Could not reach the OpenCamp server. Check your connection.';
}
