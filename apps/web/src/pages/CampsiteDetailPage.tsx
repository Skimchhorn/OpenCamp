import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api, assetUrl, REPORT_REASONS, type Campsite, type Photo, type Review, type Verification } from '../api'
import {
  buttonClass, dangerButtonClass, ErrorNote, inputClass, labelClass, RatingText, secondaryButtonClass, StatusBadge,
} from '../components'
import { DISCLAIMER, humanize, needsVerification, statusLabel, statusTone, verifiedText, yesNo } from '../status'
import { useAuth } from '../useAuth'

// Local calendar date (YYYY-MM-DD); toISOString would give tomorrow's UTC date in the evening west of UTC.
const today = () => new Date().toLocaleDateString('en-CA')
const triState = (v: FormDataEntryValue | null) => (v === 'true' ? true : v === 'false' ? false : null)
const optionalInt = (v: FormDataEntryValue | null) => (v ? Number(v) : null)
const optionalText = (v: FormDataEntryValue | null) => String(v ?? '').trim() || null

export default function CampsiteDetailPage() {
  const id = useParams().id!
  const { me } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const campsite = useQuery({ queryKey: ['campsite', id], queryFn: () => api<Campsite>(`/api/campsites/${id}`) })
  const saved = useQuery({
    queryKey: ['saved'],
    queryFn: () => api<Campsite[]>('/api/me/saved-campsites'),
    enabled: !!me,
  })
  const isSaved = !!saved.data?.some((c) => String(c.id) === id)
  const toggleSave = useMutation({
    mutationFn: () => api(`/api/me/saved-campsites/${id}`, { method: isSaved ? 'DELETE' : 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved'] }),
  })
  const remove = useMutation({
    mutationFn: () => api(`/api/campsites/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['campsite', id] })
      queryClient.invalidateQueries({ queryKey: ['campsites'] })
      queryClient.invalidateQueries({ queryKey: ['saved'] })
      navigate('/')
    },
  })

  if (campsite.isPending) return <p>Loading campsite…</p>
  if (campsite.error) return <ErrorNote error={campsite.error} />
  const c = campsite.data
  const canEdit = !!me && (me.id === c.createdBy || me.role === 'ADMIN')
  const stale = needsVerification(c.lastVerifiedAt)

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{c.name}</h1>
          <StatusBadge status={c.status} />
        </div>
        <p className="text-stone-700">
          {c.region} · {verifiedText(c.lastVerifiedAt)} · <RatingText campsite={c} />
        </p>
        <div className="flex flex-wrap gap-2">
          {me && (
            <button type="button" className={secondaryButtonClass} disabled={toggleSave.isPending || saved.isPending}
              aria-pressed={isSaved} onClick={() => toggleSave.mutate()}>
              {isSaved ? 'Saved (remove)' : 'Save campsite'}
            </button>
          )}
          {canEdit && <Link to={`/campsites/${id}/edit`} className={secondaryButtonClass}>Edit</Link>}
          {canEdit && (
            <button type="button" className={dangerButtonClass} disabled={remove.isPending}
              onClick={() => confirm(`Delete "${c.name}" permanently?`) && remove.mutate()}>
              Delete
            </button>
          )}
          {!me && (
            <Link to="/login" state={{ from: `/campsites/${id}` }} className="self-center text-sm font-semibold text-emerald-900 underline">
              Sign in to save, review, verify or report
            </Link>
          )}
        </div>
        <ErrorNote error={toggleSave.error ?? remove.error} />
      </header>

      {(stale || statusTone(c.status) !== 'good') && (
        <div role="note" className="rounded-md border border-amber-500 bg-amber-50 p-3 text-amber-950">
          {c.status === 'HIDDEN' && <p className="font-semibold">Hidden by moderators: the public cannot see this listing.</p>}
          {c.status.startsWith('REPORTED_') && (
            <p className="font-semibold">Visitors {statusLabel(c.status).toLowerCase()}. Check before you go.</p>
          )}
          {stale && (
            <p className="font-semibold">
              {c.lastVerifiedAt
                ? `Not verified recently (${verifiedText(c.lastVerifiedAt).toLowerCase()}). Conditions may have changed.`
                : 'Not verified yet. No visitor has confirmed this campsite, so treat every detail as unconfirmed.'}
            </p>
          )}
        </div>
      )}
      <p className="rounded-md border border-stone-300 bg-white p-3 text-sm text-stone-800">{DISCLAIMER}</p>

      <section aria-labelledby="details-heading">
        <h2 id="details-heading" className="text-lg font-semibold">Details</h2>
        <p className="mt-2 whitespace-pre-line">{c.description}</p>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <Row label="Location">
            {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}{' '}
            <a className="text-emerald-900 underline"
              href={`https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}#map=14/${c.latitude}/${c.longitude}`}
              target="_blank" rel="noreferrer">
              Open in OpenStreetMap
            </a>
          </Row>
          <Row label="Road condition">{humanize(c.roadCondition)}</Row>
          <Row label="Vehicle required">{humanize(c.vehicleRequired)}</Row>
          <Row label="Camping type">{c.campingType || 'Unknown'}</Row>
          <Row label="Toilet">{yesNo(c.toiletAvailable)}</Row>
          <Row label="Water nearby">{yesNo(c.waterAvailable)}</Row>
          <Row label="Cell signal">{c.cellSignal || 'Unknown'}</Row>
          <Row label="Fires allowed">
            {c.fireAllowed == null ? 'Unknown' : yesNo(c.fireAllowed)}: check current fire bans
          </Row>
          <Row label="Parking">{yesNo(c.parkingAvailable)}</Row>
          <Row label="Legal status">{humanize(c.legalStatus)}</Row>
          <Row label="Last verified">{verifiedText(c.lastVerifiedAt)}</Row>
          <Row label="Listed">{new Date(c.createdAt).toLocaleDateString()}</Row>
        </dl>
      </section>

      <Photos campsite={c} signedIn={!!me} />
      <Reviews campsite={c} myId={me?.id} />
      <Verifications campsiteId={id} signedIn={!!me} />
      {me && <ReportForm campsiteId={id} />}
    </article>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium text-stone-600">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** A collapsible form; resets itself after a successful submit. */
function FormPanel({ summary, onSubmit, pending, error, conflict, success, children }: {
  summary: string
  onSubmit: (data: FormData, done: () => void) => void
  pending: boolean
  error: unknown
  conflict?: string
  success?: string
  children: ReactNode
}) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    onSubmit(new FormData(form), () => form.reset())
  }
  return (
    <details className="mt-3 rounded-md border border-stone-300 bg-white p-3">
      <summary className="cursor-pointer font-semibold text-emerald-900">{summary}</summary>
      <form onSubmit={submit} className="mt-3 space-y-3">
        {children}
        <ErrorNote error={error} conflict={conflict} />
        {success && <p role="status" className="text-sm font-medium text-emerald-900">{success}</p>}
        <button type="submit" disabled={pending} className={buttonClass}>{pending ? 'Sending…' : 'Submit'}</button>
      </form>
    </details>
  )
}

function YesNo({ name, legend, required }: { name: string; legend: string; required?: boolean }) {
  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div className="mt-1 flex gap-4 text-sm">
        <label className="inline-flex items-center gap-1.5"><input type="radio" name={name} value="true" required={required} /> Yes</label>
        <label className="inline-flex items-center gap-1.5"><input type="radio" name={name} value="false" /> No</label>
        {!required && (
          <label className="inline-flex items-center gap-1.5"><input type="radio" name={name} value="" defaultChecked /> Not sure</label>
        )}
      </div>
    </fieldset>
  )
}

function Photos({ campsite, signedIn }: { campsite: Campsite; signedIn: boolean }) {
  const queryClient = useQueryClient()
  const key = ['photos', String(campsite.id)]
  const photos = useQuery({ queryKey: key, queryFn: () => api<Photo[]>(`/api/campsites/${campsite.id}/photos`) })
  const upload = useMutation({
    mutationFn: (data: FormData) => api<Photo>(`/api/campsites/${campsite.id}/photos`, { body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })
  return (
    <section aria-labelledby="photos-heading">
      <h2 id="photos-heading" className="text-lg font-semibold">Photos</h2>
      <ErrorNote error={photos.error} />
      {photos.data?.length === 0 && <p className="text-sm text-stone-700">No photos yet.</p>}
      <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.data?.map((p) => (
          <li key={p.id}>
            <figure>
              <img src={assetUrl(p.imageUrl)} alt={p.caption || `Photo of ${campsite.name}`} loading="lazy"
                className="aspect-[4/3] w-full rounded-md object-cover" />
              {p.caption && <figcaption className="mt-1 text-sm text-stone-700">{p.caption}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>
      {signedIn && (
        <FormPanel summary="Upload a photo" pending={upload.isPending} error={upload.error}
          onSubmit={(data, done) => {
            const file = data.get('file') as File
            if (file.size > 5 * 1024 * 1024) return alert('That file is too large (5 MB maximum).')
            if (!data.get('caption')) data.delete('caption')
            upload.mutate(data, { onSuccess: done })
          }}>
          <div>
            <label htmlFor="photo-file" className={labelClass}>Image (JPEG, PNG or WebP, up to 5 MB)</label>
            <input id="photo-file" name="file" type="file" required accept="image/jpeg,image/png,image/webp" className={inputClass} />
          </div>
          <div>
            <label htmlFor="photo-caption" className={labelClass}>Caption (optional)</label>
            <input id="photo-caption" name="caption" maxLength={300} className={inputClass} />
          </div>
        </FormPanel>
      )}
    </section>
  )
}

const SUB_RATINGS = [
  ['roadRating', 'Road'],
  ['cleanlinessRating', 'Cleanliness'],
  ['safetyRating', 'Safety'],
  ['crowdednessRating', 'Crowdedness (5 = quiet)'],
] as const

function Reviews({ campsite, myId }: { campsite: Campsite; myId?: number }) {
  const queryClient = useQueryClient()
  const id = String(campsite.id)
  const reviews = useQuery({ queryKey: ['reviews', id], queryFn: () => api<Review[]>(`/api/campsites/${id}/reviews`) })
  const create = useMutation({
    mutationFn: (body: object) => api<Review>(`/api/campsites/${id}/reviews`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] })
      queryClient.invalidateQueries({ queryKey: ['campsite', id] })
      queryClient.invalidateQueries({ queryKey: ['campsites'] })
    },
  })
  const alreadyReviewed = !!myId && !!reviews.data?.some((r) => r.userId === myId)
  return (
    <section aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-lg font-semibold">Reviews</h2>
      <p className="text-stone-700"><RatingText campsite={campsite} /></p>
      <ErrorNote error={reviews.error} />
      <ul className="mt-2 space-y-2">
        {reviews.data?.map((r) => (
          <li key={r.id} className="rounded-md border border-stone-300 bg-white p-3">
            <p className="font-semibold">
              {r.rating} / 5{r.userId === myId && ' · Your review'}
              {r.visitedAt && <span className="font-normal text-stone-600"> · visited {r.visitedAt}</span>}
            </p>
            {r.reviewText && <p className="mt-1 whitespace-pre-line">{r.reviewText}</p>}
            <p className="mt-1 text-xs text-stone-600">
              {SUB_RATINGS.filter(([k]) => r[k] != null).map(([k, label]) => `${label}: ${r[k]}/5`).join(' · ')}
            </p>
          </li>
        ))}
      </ul>
      {myId && !alreadyReviewed && (
        <FormPanel summary="Write a review" pending={create.isPending} error={create.error}
          conflict="You already reviewed this campsite."
          onSubmit={(f, done) => create.mutate({
            rating: Number(f.get('rating')),
            reviewText: optionalText(f.get('reviewText')),
            visitedAt: f.get('visitedAt') || null,
            ...Object.fromEntries(SUB_RATINGS.map(([k]) => [k, optionalInt(f.get(k))])),
          }, { onSuccess: done })}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="rating" className={labelClass}>Overall rating</label>
              <select id="rating" name="rating" required defaultValue="" className={inputClass}>
                <option value="">Choose…</option>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="review-visited" className={labelClass}>Visit date (optional)</label>
              <input id="review-visited" name="visitedAt" type="date" max={today()} className={inputClass} />
            </div>
            {SUB_RATINGS.map(([k, label]) => (
              <div key={k}>
                <label htmlFor={k} className={labelClass}>{label} (optional)</label>
                <select id={k} name={k} defaultValue="" className={inputClass}>
                  <option value="">No rating</option>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label htmlFor="reviewText" className={labelClass}>Review (optional)</label>
            <textarea id="reviewText" name="reviewText" rows={3} maxLength={5000} className={inputClass} />
          </div>
        </FormPanel>
      )}
    </section>
  )
}

function Verifications({ campsiteId, signedIn }: { campsiteId: string; signedIn: boolean }) {
  const queryClient = useQueryClient()
  const list = useQuery({
    queryKey: ['verifications', campsiteId],
    queryFn: () => api<Verification[]>(`/api/campsites/${campsiteId}/verifications`),
  })
  const create = useMutation({
    mutationFn: (body: object) => api<Verification>(`/api/campsites/${campsiteId}/verifications`, { body }),
    onSuccess: () => {
      for (const key of ['verifications', 'campsite']) queryClient.invalidateQueries({ queryKey: [key, campsiteId] })
      queryClient.invalidateQueries({ queryKey: ['campsites'] })
    },
  })
  return (
    <section aria-labelledby="verifications-heading">
      <h2 id="verifications-heading" className="text-lg font-semibold">Verification history</h2>
      <ErrorNote error={list.error} />
      {list.data?.length === 0 && <p className="text-sm text-stone-700">No one has verified this campsite yet.</p>}
      <ul className="mt-2 space-y-2">
        {list.data?.map((v) => (
          <li key={v.id} className="rounded-md border border-stone-300 bg-white p-3 text-sm">
            <p className="font-semibold">Visited {v.visitedAt}</p>
            <p>
              Open: {yesNo(v.isOpen)} · Free: {yesNo(v.isFree)} · Camping allowed: {yesNo(v.campingAllowed)} · Felt safe:{' '}
              {yesNo(v.feltSafe)} · Road accessible: {yesNo(v.roadAccessible)} · Clean: {yesNo(v.wasClean)} · Crowded:{' '}
              {yesNo(v.wasCrowded)} · Fire ban signs: {yesNo(v.fireBanSignSeen)} · Cell signal: {v.cellSignal || 'Unknown'}
            </p>
            {v.notes && <p className="mt-1 whitespace-pre-line">{v.notes}</p>}
          </li>
        ))}
      </ul>
      {signedIn && (
        <FormPanel summary="I visited: verify this campsite" pending={create.isPending} error={create.error}
          success={create.isSuccess ? 'Thanks, your verification was recorded.' : undefined}
          onSubmit={(f, done) => create.mutate({
            isOpen: triState(f.get('isOpen')),
            isFree: triState(f.get('isFree')),
            campingAllowed: triState(f.get('campingAllowed')),
            roadAccessible: triState(f.get('roadAccessible')),
            wasClean: triState(f.get('wasClean')),
            wasCrowded: triState(f.get('wasCrowded')),
            feltSafe: triState(f.get('feltSafe')),
            cellSignal: optionalText(f.get('cellSignal')),
            fireBanSignSeen: triState(f.get('fireBanSignSeen')),
            visitedAt: f.get('visitedAt'),
            notes: optionalText(f.get('notes')),
          }, { onSuccess: done })}>
          <div className="grid gap-3 sm:grid-cols-2">
            <YesNo name="isOpen" legend="Is the spot still open?" required />
            <YesNo name="isFree" legend="Is it still free?" required />
            <YesNo name="campingAllowed" legend="Did camping seem allowed?" required />
            <YesNo name="feltSafe" legend="Did you feel safe?" required />
            <YesNo name="roadAccessible" legend="Was the road accessible?" />
            <YesNo name="wasClean" legend="Was the spot clean?" />
            <YesNo name="wasCrowded" legend="Was it crowded?" />
            <YesNo name="fireBanSignSeen" legend="Were there fire ban signs?" />
            <div>
              <label htmlFor="verify-cell" className={labelClass}>Cell signal (optional)</label>
              <input id="verify-cell" name="cellSignal" maxLength={50} placeholder="e.g. None, weak, good" className={inputClass} />
            </div>
            <div>
              <label htmlFor="verify-date" className={labelClass}>When did you visit?</label>
              <input id="verify-date" name="visitedAt" type="date" required max={today()} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="verify-notes" className={labelClass}>Notes (optional)</label>
            <textarea id="verify-notes" name="notes" rows={2} maxLength={2000} className={inputClass} />
          </div>
        </FormPanel>
      )}
    </section>
  )
}

function ReportForm({ campsiteId }: { campsiteId: string }) {
  const report = useMutation({
    mutationFn: (body: object) => api(`/api/campsites/${campsiteId}/reports`, { body }),
  })
  return (
    <section aria-labelledby="report-heading">
      <h2 id="report-heading" className="text-lg font-semibold">Report a problem</h2>
      <FormPanel summary="Report this campsite" pending={report.isPending} error={report.error}
        success={report.isSuccess ? 'Thanks, a moderator will review your report.' : undefined}
        onSubmit={(f, done) => report.mutate({ reason: f.get('reason'), description: optionalText(f.get('description')) }, { onSuccess: done })}>
        <div>
          <label htmlFor="report-reason" className={labelClass}>Reason</label>
          <select id="report-reason" name="reason" required defaultValue="" className={inputClass}>
            <option value="">Choose…</option>
            {REPORT_REASONS.map((r) => <option key={r} value={r}>{humanize(r)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="report-description" className={labelClass}>Details (optional)</label>
          <textarea id="report-description" name="description" rows={2} maxLength={2000} className={inputClass} />
        </div>
      </FormPanel>
    </section>
  )
}
