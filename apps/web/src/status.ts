// Trust & safety display rules: never present unverified community data as confirmed.

const DAY_MS = 24 * 60 * 60 * 1000
/** Matches the backend's Campsite.VERIFICATION_FRESHNESS. */
export const FRESH_DAYS = 90

const STATUS_LABELS: Record<string, string> = {
  VERIFIED_RECENTLY: 'Verified recently',
  NEEDS_UPDATE: 'Needs update',
  REPORTED_CLOSED: 'Reported closed',
  REPORTED_UNSAFE: 'Reported unsafe',
  REPORTED_ILLEGAL: 'Reported: camping not allowed',
  HIDDEN: 'Hidden by moderators',
}

export const statusLabel = (status: string | null | undefined) => STATUS_LABELS[status ?? ''] ?? 'Unknown status'

export type Tone = 'good' | 'warn' | 'bad' | 'muted'

export function statusTone(status: string | null | undefined): Tone {
  if (status === 'VERIFIED_RECENTLY') return 'good'
  if (status === 'NEEDS_UPDATE') return 'warn'
  if (status?.startsWith('REPORTED_')) return 'bad'
  return 'muted'
}

/**
 * Calendar days since the last verification, or null if never verified.
 * The backend stores a visit date as UTC midnight, so compare its date part with the viewer's local date.
 */
export function daysSinceVerified(lastVerifiedAt: string | null, now = new Date()): number | null {
  if (!lastVerifiedAt) return null
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((today - Date.parse(lastVerifiedAt.slice(0, 10))) / DAY_MS))
}

export function verifiedText(lastVerifiedAt: string | null, now = new Date()): string {
  const days = daysSinceVerified(lastVerifiedAt, now)
  if (days === null) return 'Not verified yet'
  if (days === 0) return 'Verified today'
  return `Verified ${days} ${days === 1 ? 'day' : 'days'} ago`
}

/** True when the site should carry a "not verified recently" warning. */
export function needsVerification(lastVerifiedAt: string | null, now = new Date()): boolean {
  const days = daysSinceVerified(lastVerifiedAt, now)
  return days === null || days > FRESH_DAYS
}

/** FOUR_BY_FOUR_REQUIRED -> "Four by four required". */
export function humanize(value: string | null | undefined): string {
  if (!value) return 'Unknown'
  const words = value.toLowerCase().replaceAll('_', ' ')
  return words[0].toUpperCase() + words.slice(1)
}

/** Null booleans mean "unknown" in the API. */
export const yesNo = (value: boolean | null | undefined) => (value == null ? 'Unknown' : value ? 'Yes' : 'No')

export const DISCLAIMER =
  'OpenCamp relies on community-submitted information. Always check local laws, fire restrictions, road conditions, and land access rules before camping. Pack out all garbage and respect the environment.'

export const LEGAL_WARNING =
  'Only submit locations where camping is allowed or reasonably believed to be allowed. Do not submit private property, restricted areas, or unsafe locations.'
