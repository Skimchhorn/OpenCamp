import { isPastOrTodayIso, todayIso } from '@/lib/date';
import { isVerifiedRecently, label, ratingLabel, statusLabel, verifiedLabel, yesNo } from '@/lib/status';

const now = new Date('2026-11-10T12:00:00Z');

describe('verifiedLabel', () => {
  it('never claims verification when there is none', () => {
    expect(verifiedLabel(null, now)).toBe('Not verified yet');
  });

  it('counts whole days since the last verification', () => {
    expect(verifiedLabel('2026-11-10T00:00:00Z', now)).toBe('Verified today');
    expect(verifiedLabel('2026-11-09T00:00:00Z', now)).toBe('Verified 1 day ago');
    expect(verifiedLabel('2026-10-27T00:00:00Z', now)).toBe('Verified 14 days ago');
  });
});

describe('isVerifiedRecently', () => {
  it('is false when never verified or older than 90 days', () => {
    expect(isVerifiedRecently(null, now)).toBe(false);
    expect(isVerifiedRecently('2026-08-01T00:00:00Z', now)).toBe(false);
    expect(isVerifiedRecently('2026-11-01T00:00:00Z', now)).toBe(true);
  });
});

describe('labels', () => {
  it('maps statuses to human labels and falls back to unknown', () => {
    expect(statusLabel('VERIFIED_RECENTLY')).toBe('Verified recently');
    expect(statusLabel('REPORTED_UNSAFE')).toBe('Reported unsafe');
    expect(statusLabel(null)).toBe('Unknown status');
    expect(statusLabel('SOMETHING_NEW')).toBe('Unknown status');
    expect(label('PUBLIC_LAND_DISPERSED')).toBe('Public land (dispersed)');
  });

  it('shows null booleans as unknown, not as no', () => {
    expect(yesNo(null)).toBe('Unknown');
    expect(yesNo(false)).toBe('No');
    expect(yesNo(true)).toBe('Yes');
  });

  it('describes ratings', () => {
    expect(ratingLabel(null, 0)).toBe('No reviews yet');
    expect(ratingLabel(4, 1)).toBe('4.0 / 5 (1 review)');
  });
});

describe('dates', () => {
  it('accepts real past dates only', () => {
    const local = new Date(2026, 10, 10);
    expect(todayIso(local)).toBe('2026-11-10');
    expect(isPastOrTodayIso('2026-11-10', local)).toBe(true);
    expect(isPastOrTodayIso('2026-11-11', local)).toBe(false);
    expect(isPastOrTodayIso('2026-02-30', local)).toBe(false);
    expect(isPastOrTodayIso('10/11/2026', local)).toBe(false);
  });
});
