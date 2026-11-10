// Trust & safety display rules: never present unverified community data as confirmed.

const DAY_MS = 24 * 60 * 60 * 1000;
/** Matches the backend's VERIFICATION_FRESHNESS. */
export const FRESH_DAYS = 90;

/** Human labels for every backend enum value (campsite status, legal status, road, vehicle, report reason). */
const LABELS: Record<string, string> = {
  VERIFIED_RECENTLY: 'Verified recently',
  NEEDS_UPDATE: 'Needs update',
  REPORTED_CLOSED: 'Reported closed',
  REPORTED_UNSAFE: 'Reported unsafe',
  REPORTED_ILLEGAL: 'Reported: camping not allowed',
  HIDDEN: 'Hidden by moderators',
  OFFICIAL_FREE_SITE: 'Official free site',
  PUBLIC_LAND_DISPERSED: 'Public land (dispersed)',
  NEEDS_VERIFICATION: 'Needs verification',
  NOT_ALLOWED: 'Camping not allowed',
  PRIVATE_PROPERTY: 'Private property',
  CLOSED: 'Closed',
  PAVED: 'Paved',
  GRAVEL: 'Gravel',
  ROUGH_GRAVEL: 'Rough gravel',
  DIRT: 'Dirt',
  MUDDY: 'Muddy',
  FOUR_BY_FOUR_ONLY: '4x4 only',
  ANY_CAR: 'Any car',
  SUV_RECOMMENDED: 'SUV recommended',
  FOUR_BY_FOUR_REQUIRED: '4x4 required',
  WALK_IN_ONLY: 'Walk-in only',
  NOT_FREE: 'Not free',
  CAMPING_NOT_ALLOWED: 'Camping not allowed',
  UNSAFE: 'Unsafe',
  WRONG_LOCATION: 'Wrong location',
  FAKE_LISTING: 'Fake listing',
  SPAM: 'Spam',
  DUPLICATE: 'Duplicate campsite',
  INAPPROPRIATE_PHOTO: 'Inappropriate photo',
  OTHER: 'Other',
  UNKNOWN: 'Unknown',
};

export function label(value: string | null | undefined): string {
  return (value && LABELS[value]) || 'Unknown';
}

export function statusLabel(status: string | null | undefined): string {
  return status && LABELS[status] ? LABELS[status] : 'Unknown status';
}

function daysSince(iso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - Date.parse(iso)) / DAY_MS));
}

export function verifiedLabel(lastVerifiedAt: string | null, now = new Date()): string {
  if (!lastVerifiedAt) return 'Not verified yet';
  const days = daysSince(lastVerifiedAt, now);
  if (days === 0) return 'Verified today';
  return `Verified ${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export function isVerifiedRecently(lastVerifiedAt: string | null, now = new Date()): boolean {
  return lastVerifiedAt != null && daysSince(lastVerifiedAt, now) <= FRESH_DAYS;
}

/** Null booleans mean nobody has reported it yet. */
export function yesNo(value: boolean | null | undefined): string {
  return value == null ? 'Unknown' : value ? 'Yes' : 'No';
}

export function ratingLabel(avg: number | null, count: number): string {
  if (!count || avg == null) return 'No reviews yet';
  return `${avg.toFixed(1)} / 5 (${count} ${count === 1 ? 'review' : 'reviews'})`;
}
