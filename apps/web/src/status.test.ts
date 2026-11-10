import { describe, expect, it } from 'vitest'
import { humanize, needsVerification, statusLabel, statusTone, verifiedText, yesNo } from './status'

const now = new Date(2026, 5, 15, 23, 30) // local time, late evening

describe('verifiedText', () => {
  it('says not verified when there is no verification', () => {
    expect(verifiedText(null, now)).toBe('Not verified yet')
  })
  it('counts whole days', () => {
    expect(verifiedText('2026-06-15T00:00:00Z', now)).toBe('Verified today')
    expect(verifiedText('2026-06-14T00:00:00Z', now)).toBe('Verified 1 day ago')
    expect(verifiedText('2026-06-05T00:00:00Z', now)).toBe('Verified 10 days ago')
  })
  it('counts a visit stored as UTC midnight today as today, in any time zone', () => {
    expect(verifiedText('2026-06-15T00:00:00Z', new Date(2026, 5, 15, 0, 5))).toBe('Verified today')
    expect(verifiedText('2026-06-15T00:00:00Z', new Date(2026, 5, 15, 23, 55))).toBe('Verified today')
  })
  it('never shows a negative age for a future timestamp', () => {
    expect(verifiedText('2026-06-16T00:00:00Z', now)).toBe('Verified today')
  })
})

describe('needsVerification', () => {
  it('flags never-verified and stale sites only', () => {
    expect(needsVerification(null, now)).toBe(true)
    expect(needsVerification('2026-03-17T00:00:00Z', now)).toBe(false) // 90 days
    expect(needsVerification('2026-03-16T00:00:00Z', now)).toBe(true) // 91 days
  })
})

describe('status labels', () => {
  it('maps every backend status to a human label and tone', () => {
    expect(statusLabel('VERIFIED_RECENTLY')).toBe('Verified recently')
    expect(statusLabel('NEEDS_UPDATE')).toBe('Needs update')
    expect(statusLabel('REPORTED_CLOSED')).toBe('Reported closed')
    expect(statusLabel('REPORTED_UNSAFE')).toBe('Reported unsafe')
    expect(statusLabel('REPORTED_ILLEGAL')).toBe('Reported: camping not allowed')
    expect(statusLabel('HIDDEN')).toBe('Hidden by moderators')
    expect(statusLabel(undefined)).toBe('Unknown status')
    expect(statusTone('VERIFIED_RECENTLY')).toBe('good')
    expect(statusTone('REPORTED_UNSAFE')).toBe('bad')
    expect(statusTone('HIDDEN')).toBe('muted')
  })
  it('humanizes enums and tri-state booleans', () => {
    expect(humanize('FOUR_BY_FOUR_REQUIRED')).toBe('Four by four required')
    expect(humanize(null)).toBe('Unknown')
    expect(yesNo(null)).toBe('Unknown')
    expect(yesNo(false)).toBe('No')
  })
})
