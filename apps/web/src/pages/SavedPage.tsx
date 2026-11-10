import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { api, type Campsite } from '../api'
import { CampsiteSummary, ErrorNote } from '../components'

export default function SavedPage() {
  const queryClient = useQueryClient()
  const saved = useQuery({ queryKey: ['saved'], queryFn: () => api<Campsite[]>('/api/me/saved-campsites') })
  const unsave = useMutation({
    mutationFn: (id: number) => api(`/api/me/saved-campsites/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved'] }),
  })
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Saved campsites</h1>
      <ErrorNote error={saved.error ?? unsave.error} />
      {saved.isPending && <p className="mt-3">Loading…</p>}
      {saved.data?.length === 0 && (
        <p className="mt-3 text-stone-700">
          Nothing saved yet. <Link to="/" className="font-semibold text-emerald-900 underline">Find a campsite</Link> and press Save.
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {saved.data?.map((c) => (
          <li key={c.id}>
            <CampsiteSummary campsite={c}>
              <button type="button" onClick={() => unsave.mutate(c.id)} disabled={unsave.isPending}
                className="mt-2 text-sm font-semibold text-red-800 underline">
                Remove {c.name} from saved
              </button>
            </CampsiteSummary>
          </li>
        ))}
      </ul>
    </div>
  )
}
