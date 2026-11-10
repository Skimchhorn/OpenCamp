import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { MapContainer, useMapEvents } from 'react-leaflet'
import { useNavigate, useParams } from 'react-router'
import { api, DEFAULT_CENTER, ROAD_CONDITIONS, SUBMITTABLE_LEGAL, VEHICLES, type Campsite } from '../api'
import { buttonClass, ErrorNote, inputClass, labelClass } from '../components'
import { OsmTiles, PinMarker } from '../map'
import { humanize, LEGAL_WARNING } from '../status'

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

const triState = (v: FormDataEntryValue | null) => (v === 'true' ? true : v === 'false' ? false : null)
const optionalText = (v: FormDataEntryValue | null) => String(v ?? '').trim() || null

/** Add a campsite, or edit one at /campsites/:id/edit. */
export default function CampsiteFormPage() {
  const { id } = useParams()
  const existing = useQuery({
    queryKey: ['campsite', id],
    queryFn: () => api<Campsite>(`/api/campsites/${id}`),
    enabled: !!id,
  })
  if (id && !existing.data) {
    return existing.error ? <ErrorNote error={existing.error} /> : <p>Loading…</p>
  }
  return <CampsiteForm campsite={existing.data} />
}

function CampsiteForm({ campsite }: { campsite?: Campsite }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [lat, setLat] = useState(campsite ? String(campsite.latitude) : '')
  const [lng, setLng] = useState(campsite ? String(campsite.longitude) : '')
  const save = useMutation({
    mutationFn: (body: object) =>
      campsite
        ? api<Campsite>(`/api/campsites/${campsite.id}`, { method: 'PUT', body })
        : api<Campsite>('/api/campsites', { body }),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['campsites'] })
      queryClient.setQueryData(['campsite', String(saved.id)], saved)
      navigate(`/campsites/${saved.id}`)
    },
  })

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    save.mutate({
      name: String(f.get('name')).trim(),
      description: String(f.get('description')).trim(),
      latitude: Number(lat),
      longitude: Number(lng),
      region: String(f.get('region')).trim(),
      roadCondition: f.get('roadCondition'),
      vehicleRequired: f.get('vehicleRequired'),
      legalStatus: f.get('legalStatus'),
      campingType: optionalText(f.get('campingType')),
      cellSignal: optionalText(f.get('cellSignal')),
      toiletAvailable: triState(f.get('toiletAvailable')),
      waterAvailable: triState(f.get('waterAvailable')),
      fireAllowed: triState(f.get('fireAllowed')),
      parkingAvailable: triState(f.get('parkingAvailable')),
    })
  }

  const position: [number, number] | null = lat && lng && !isNaN(+lat) && !isNaN(+lng) ? [+lat, +lng] : null
  const select = (name: keyof Campsite, label: string, options: string[]) => (
    <div>
      <label htmlFor={name} className={labelClass}>{label}</label>
      <select id={name} name={name} required defaultValue={String(campsite?.[name] ?? '')} className={inputClass}>
        <option value="">Choose…</option>
        {options.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
      </select>
    </div>
  )
  const unknownYesNo = (name: keyof Campsite, label: string) => (
    <div>
      <label htmlFor={name} className={labelClass}>{label}</label>
      <select id={name} name={name} defaultValue={String(campsite?.[name] ?? '')} className={inputClass}>
        <option value="">Unknown</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">{campsite ? `Edit ${campsite.name}` : 'Add a free campsite'}</h1>
      <p role="note" className="mt-3 rounded-md border border-amber-400 bg-amber-50 p-3 text-sm font-medium text-amber-950">
        {LEGAL_WARNING}
      </p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="name" className={labelClass}>Name</label>
          <input id="name" name="name" required maxLength={200} defaultValue={campsite?.name} className={inputClass} />
        </div>
        <div>
          <label htmlFor="description" className={labelClass}>Description and access notes</label>
          <textarea
            id="description"
            name="description"
            required
            maxLength={5000}
            rows={4}
            defaultValue={campsite?.description}
            aria-describedby="description-hint"
            className={inputClass}
          />
          <p id="description-hint" className="mt-1 text-xs text-stone-600">
            How to get there, what the site is like, and anything a first-time visitor should know.
          </p>
        </div>
        <div>
          <label htmlFor="region" className={labelClass}>Region</label>
          <input id="region" name="region" required maxLength={100} defaultValue={campsite?.region} className={inputClass} />
        </div>

        <fieldset className="rounded-md border border-stone-300 bg-white p-3">
          <legend className="px-1 text-sm font-semibold">Location</legend>
          <p id="location-hint" className="text-sm text-stone-700">Click the map to place the campsite, or type coordinates.</p>
          <MapContainer
            center={position ?? DEFAULT_CENTER}
            zoom={position ? 12 : 7}
            className="mt-2 h-72 rounded-md"
          >
            <OsmTiles />
            <ClickToPlace onPick={(la, ln) => { setLat(la.toFixed(5)); setLng(ln.toFixed(5)) }} />
            {position && <PinMarker position={position} />}
          </MapContainer>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="latitude" className={labelClass}>Latitude</label>
              <input id="latitude" type="number" step="any" min={-90} max={90} required value={lat}
                onChange={(e) => setLat(e.target.value)} aria-describedby="location-hint" className={inputClass} />
            </div>
            <div>
              <label htmlFor="longitude" className={labelClass}>Longitude</label>
              <input id="longitude" type="number" step="any" min={-180} max={180} required value={lng}
                onChange={(e) => setLng(e.target.value)} aria-describedby="location-hint" className={inputClass} />
            </div>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          {select('roadCondition', 'Road condition', ROAD_CONDITIONS)}
          {select('vehicleRequired', 'Vehicle required', VEHICLES)}
          {select('legalStatus', 'Legal status', SUBMITTABLE_LEGAL)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="campingType" className={labelClass}>Camping type (optional)</label>
            <input id="campingType" name="campingType" maxLength={50} placeholder="e.g. Tent, car, RV"
              defaultValue={campsite?.campingType ?? ''} className={inputClass} />
          </div>
          <div>
            <label htmlFor="cellSignal" className={labelClass}>Cell signal (optional)</label>
            <input id="cellSignal" name="cellSignal" maxLength={50} placeholder="e.g. None, weak, good"
              defaultValue={campsite?.cellSignal ?? ''} className={inputClass} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {unknownYesNo('toiletAvailable', 'Toilet')}
          {unknownYesNo('waterAvailable', 'Water nearby')}
          {unknownYesNo('fireAllowed', 'Fires allowed')}
          {unknownYesNo('parkingAvailable', 'Parking')}
        </div>

        <ErrorNote error={save.error} />
        <button type="submit" disabled={save.isPending} className={buttonClass}>
          {save.isPending ? 'Saving…' : campsite ? 'Save changes' : 'Submit campsite'}
        </button>
      </form>
    </div>
  )
}
