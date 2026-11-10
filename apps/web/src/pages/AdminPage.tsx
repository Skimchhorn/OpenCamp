import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { ALL_LEGAL, api, REPORT_STATUSES, type AdminReport } from '../api'
import { dangerButtonClass, ErrorNote, inputClass, labelClass, secondaryButtonClass } from '../components'
import { humanize } from '../status'

type Action =
  | { kind: 'resolve'; reportId: number; status: 'RESOLVED' | 'REJECTED' }
  | { kind: 'moderate'; campsiteId: number; status?: string; legalStatus?: string }
  | { kind: 'delete'; campsiteId: number }

function run(action: Action) {
  switch (action.kind) {
    case 'resolve':
      return api(`/api/admin/reports/${action.reportId}/resolve`, { method: 'PUT', body: { status: action.status } })
    case 'moderate':
      return api(`/api/admin/campsites/${action.campsiteId}`, {
        method: 'PATCH',
        body: { status: action.status ?? null, legalStatus: action.legalStatus ?? null },
      })
    case 'delete':
      return api(`/api/campsites/${action.campsiteId}`, { method: 'DELETE' })
  }
}

export default function AdminPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('OPEN')
  const reports = useQuery({
    queryKey: ['admin-reports', status],
    queryFn: () => api<AdminReport[]>(`/api/admin/reports${status ? `?status=${status}` : ''}`),
  })
  const act = useMutation({
    mutationFn: run,
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
      if (action.kind !== 'resolve') {
        queryClient.invalidateQueries({ queryKey: ['campsites'] })
        queryClient.invalidateQueries({ queryKey: ['campsite', String(action.campsiteId)] })
      }
    },
  })
  const busy = act.isPending

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Moderation: reports</h1>
      <div className="max-w-xs">
        <label htmlFor="report-status" className={labelClass}>Show reports</label>
        <select id="report-status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          {REPORT_STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          <option value="">All</option>
        </select>
      </div>
      <ErrorNote error={reports.error ?? act.error} />
      <p role="status" className="text-sm text-emerald-900">{act.isSuccess && 'Done. The list is refreshed.'}</p>
      {reports.isPending && <p>Loading…</p>}
      {reports.data?.length === 0 && <p className="text-stone-700">No reports with this status.</p>}
      <ul className="space-y-3">
        {reports.data?.map((r) => (
          <li key={r.id} className="rounded-md border border-stone-300 bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link to={`/campsites/${r.campsiteId}`} className="font-semibold text-emerald-900 underline">{r.campsiteName}</Link>
              <span className="text-sm text-stone-600">
                Report #{r.id} · {humanize(r.status)} · {new Date(r.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-1"><span className="font-medium">Reason:</span> {humanize(r.reason)}</p>
            {r.description && <p className="mt-1 whitespace-pre-line text-stone-800">{r.description}</p>}

            <div className="mt-3 flex flex-wrap gap-2">
              {(r.status === 'OPEN' || r.status === 'REVIEWING') && (
                <>
                  <button type="button" className={secondaryButtonClass} disabled={busy}
                    onClick={() => act.mutate({ kind: 'resolve', reportId: r.id, status: 'RESOLVED' })}>
                    Resolve report
                  </button>
                  <button type="button" className={secondaryButtonClass} disabled={busy}
                    onClick={() => act.mutate({ kind: 'resolve', reportId: r.id, status: 'REJECTED' })}>
                    Reject report
                  </button>
                </>
              )}
              <button type="button" className={secondaryButtonClass} disabled={busy}
                onClick={() => act.mutate({ kind: 'moderate', campsiteId: r.campsiteId, status: 'HIDDEN' })}>
                Hide campsite
              </button>
              <button type="button" className={secondaryButtonClass} disabled={busy}
                onClick={() => act.mutate({ kind: 'moderate', campsiteId: r.campsiteId, status: 'NEEDS_UPDATE' })}>
                Mark needs verification
              </button>
              <button type="button" className={dangerButtonClass} disabled={busy}
                onClick={() => confirm(`Delete "${r.campsiteName}" and all its reviews, photos and reports?`)
                  && act.mutate({ kind: 'delete', campsiteId: r.campsiteId })}>
                Delete campsite
              </button>
            </div>
            <form className="mt-3 flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const legalStatus = String(new FormData(e.currentTarget).get('legalStatus'))
                act.mutate({ kind: 'moderate', campsiteId: r.campsiteId, legalStatus })
              }}>
              <div>
                <label htmlFor={`legal-${r.id}`} className={labelClass}>Legal status</label>
                <select id={`legal-${r.id}`} name="legalStatus" required defaultValue="" className={inputClass}>
                  <option value="">Choose…</option>
                  {ALL_LEGAL.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
                </select>
              </div>
              <button type="submit" className={secondaryButtonClass} disabled={busy}>Set legal status</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}
