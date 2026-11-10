import { useQuery } from '@tanstack/react-query'
import L, { type Map as LeafletMap } from 'leaflet'
import { useEffect, useState, type FormEvent } from 'react'
import { MapContainer, Popup } from 'react-leaflet'
import { Link } from 'react-router'
import { api, DEFAULT_CENTER, STATUSES, type Campsite } from '../api'
import { buttonClass, CampsiteSummary, ErrorNote, inputClass, labelClass, RatingText, secondaryButtonClass } from '../components'
import { OsmTiles, PinMarker } from '../map'
import { statusLabel, verifiedText } from '../status'

const RADII = [10, 25, 50, 100, 250, 500]

export default function MapPage() {
  const [map, setMap] = useState<LeafletMap | null>(null)
  const [query, setQuery] = useState('')
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const campsites = useQuery({
    queryKey: ['campsites', query],
    queryFn: () => api<Campsite[]>(`/api/campsites?${query}`),
  })

  // For "anywhere" searches, fit the map to the results; a distance search keeps the center the user chose.
  useEffect(() => {
    const sites = campsites.data
    if (!map || !sites?.length || query.includes('lat=')) return
    map.fitBounds(L.latLngBounds(sites.map((c) => [c.latitude, c.longitude])), { padding: [32, 32], maxZoom: 12, animate: false }) // an animated zoom throws if the page unmounts mid-flight
  }, [map, campsites.data, query])

  function search(form: HTMLFormElement, origin?: { lat: number; lng: number }) {
    const data = new FormData(form)
    const params = new URLSearchParams()
    const radius = String(data.get('radius'))
    if (radius !== 'any') {
      const center = origin ?? map?.getCenter() ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] }
      params.set('lat', center.lat.toFixed(5))
      params.set('lng', center.lng.toFixed(5))
      params.set('radiusKm', radius)
    }
    const region = String(data.get('region')).trim()
    if (region) params.set('region', region)
    for (const key of ['toilet', 'water', 'fire']) if (data.get(key)) params.set(key, 'true')
    const status = String(data.get('status'))
    if (status) params.set('status', status)
    setQuery(params.toString())
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    search(e.currentTarget)
  }

  function nearMe(form: HTMLFormElement | null) {
    if (!form) return
    if (!navigator.geolocation) return setGeoError('Your browser does not share location.')
    const radius = form.elements.namedItem('radius') as HTMLSelectElement
    if (radius.value === 'any') radius.value = '50'
    setLocating(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false)
        const origin = { lat: coords.latitude, lng: coords.longitude }
        map?.setView(origin, 10)
        search(form, origin)
      },
      () => {
        setLocating(false)
        setGeoError('Could not get your location. Allow location access or search near the map center.')
      },
      { timeout: 10_000 },
    )
  }

  const sites = campsites.data ?? []
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Find a free campsite</h1>
      <form onSubmit={submit} aria-label="Search campsites" className="grid gap-3 rounded-md border border-stone-300 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="radius" className={labelClass}>Distance from map center</label>
          <select id="radius" name="radius" defaultValue="any" className={inputClass}>
            <option value="any">Anywhere</option>
            {RADII.map((r) => <option key={r} value={r}>Within {r} km</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="region" className={labelClass}>Region or area</label>
          <input id="region" name="region" maxLength={100} placeholder="e.g. Sea to Sky" className={inputClass} />
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>Status</label>
          <select id="status" name="status" defaultValue="" className={inputClass}>
            <option value="">Any status</option>
            {STATUSES.filter((s) => s !== 'HIDDEN').map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className={labelClass}>Must have</legend>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {[['toilet', 'Toilet'], ['water', 'Water'], ['fire', 'Fires allowed']].map(([name, label]) => (
              <label key={name} className="inline-flex items-center gap-1.5">
                <input type="checkbox" name={name} className="size-4" /> {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
          <button type="submit" className={buttonClass}>Search</button>
          <button type="button" className={secondaryButtonClass} disabled={locating} onClick={(e) => nearMe(e.currentTarget.form)}>
            {locating ? 'Locating…' : 'Search near me'}
          </button>
          {geoError && <p role="alert" className="self-center text-sm text-red-800">{geoError}</p>}
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <MapContainer ref={setMap} center={DEFAULT_CENTER} zoom={7} className="h-[55vh] min-h-80 rounded-md border border-stone-300">
          <OsmTiles />
          {sites.map((c) => (
            <PinMarker key={c.id} position={[c.latitude, c.longitude]} title={c.name} alt={c.name}>
              <Popup>
                <p className="m-0! font-semibold">{c.name}</p>
                <p className="m-0!">{statusLabel(c.status)}</p>
                <p className="m-0!"><RatingText campsite={c} /></p>
                <p className="m-0!">{verifiedText(c.lastVerifiedAt)}</p>
                <Link to={`/campsites/${c.id}`} className="font-semibold">View details</Link>
              </Popup>
            </PinMarker>
          ))}
        </MapContainer>

        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-lg font-semibold">
            {campsites.isPending ? 'Loading campsites…' : `${sites.length} ${sites.length === 1 ? 'campsite' : 'campsites'}`}
          </h2>
          <ErrorNote error={campsites.error} />
          {campsites.isSuccess && sites.length === 0 && (
            <p className="mt-2 text-sm text-stone-700">No campsites match. Try a larger distance or fewer filters.</p>
          )}
          <ul className="mt-2 max-h-[55vh] space-y-2 overflow-y-auto">
            {sites.map((c) => <li key={c.id}><CampsiteSummary campsite={c} /></li>)}
          </ul>
        </section>
      </div>
    </div>
  )
}
