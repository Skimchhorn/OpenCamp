import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { errorText, type Campsite } from './api'
import { statusLabel, statusTone, verifiedText, type Tone } from './status'
import { useAuth } from './useAuth'

export const inputClass =
  'mt-1 block w-full rounded-md border border-stone-400 bg-white px-3 py-2 text-stone-900 focus:border-emerald-700'
export const labelClass = 'block text-sm font-medium text-stone-800'
export const buttonClass =
  'inline-flex items-center justify-center rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60'
export const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-md border border-stone-400 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 disabled:opacity-60'
export const dangerButtonClass =
  'inline-flex items-center justify-center rounded-md border border-red-700 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60'

const toneClass: Record<Tone, string> = {
  good: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  warn: 'bg-amber-100 text-amber-900 border-amber-300',
  bad: 'bg-red-100 text-red-900 border-red-300',
  muted: 'bg-stone-200 text-stone-800 border-stone-300',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${toneClass[statusTone(status)]}`}>
      {statusLabel(status)}
    </span>
  )
}

export function RatingText({ campsite }: { campsite: Campsite }) {
  if (!campsite.reviewCount || campsite.ratingAvg == null) return <span>No reviews yet</span>
  return (
    <span>
      {campsite.ratingAvg.toFixed(1)} / 5 ({campsite.reviewCount} {campsite.reviewCount === 1 ? 'review' : 'reviews'})
    </span>
  )
}

/** Name, status, rating, verification age and known amenities for list views. */
export function CampsiteSummary({ campsite, children }: { campsite: Campsite; children?: ReactNode }) {
  const amenities = [
    campsite.toiletAvailable && 'Toilet',
    campsite.waterAvailable && 'Water',
    campsite.fireAllowed && 'Fires allowed',
    campsite.parkingAvailable && 'Parking',
  ].filter(Boolean)
  return (
    <div className="rounded-md border border-stone-300 bg-white p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link to={`/campsites/${campsite.id}`} className="font-semibold text-emerald-900 underline-offset-2 hover:underline">
          {campsite.name}
        </Link>
        <StatusBadge status={campsite.status} />
      </div>
      <p className="mt-1 text-sm text-stone-700">
        {campsite.region} · {verifiedText(campsite.lastVerifiedAt)} · <RatingText campsite={campsite} />
      </p>
      {amenities.length > 0 && <p className="mt-1 text-xs text-stone-600">Reported: {amenities.join(', ')}</p>}
      {children}
    </div>
  )
}

export function ErrorNote({ error, conflict }: { error: unknown; conflict?: string }) {
  if (!error) return null
  return (
    <p role="alert" className="mt-2 text-sm font-medium text-red-800">
      {errorText(error, conflict)}
    </p>
  )
}

/** Renders children only for a signed-in user (or admin); otherwise sends them to sign in. */
export function RequireAuth({ admin, children }: { admin?: boolean; children: ReactNode }) {
  const { me } = useAuth()
  const location = useLocation()
  if (me === undefined) return <p className="p-4">Loading…</p>
  if (!me) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (admin && me.role !== 'ADMIN') return <p className="p-4">This page is for moderators only.</p>
  return children
}
