import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Text } from 'react-native';
import MapView, { Marker, type LatLng } from 'react-native-maps';

import {
  Button,
  Choice,
  ErrorText,
  Field,
  Heading,
  Notice,
  Screen,
  styles,
  YES_NO_UNKNOWN,
} from '@/components/ui';
import { api, errorMessage, type Campsite } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { label } from '@/lib/status';

const opts = (values: string[]) => values.map((v) => [v, label(v)] as const);
const ROADS = opts(['PAVED', 'GRAVEL', 'ROUGH_GRAVEL', 'DIRT', 'MUDDY', 'FOUR_BY_FOUR_ONLY', 'UNKNOWN']);
const VEHICLES = opts(['ANY_CAR', 'SUV_RECOMMENDED', 'FOUR_BY_FOUR_REQUIRED', 'WALK_IN_ONLY', 'UNKNOWN']);
// NOT_ALLOWED, PRIVATE_PROPERTY and CLOSED are rejected by the backend, so they are never offered.
const LEGAL = opts(['OFFICIAL_FREE_SITE', 'PUBLIC_LAND_DISPERSED', 'NEEDS_VERIFICATION', 'UNKNOWN']);

const EMPTY = {
  name: '',
  description: '',
  region: '',
  campingType: '',
  cellSignal: '',
  roadCondition: null as string | null,
  vehicleRequired: null as string | null,
  legalStatus: null as string | null,
  toiletAvailable: null as boolean | null,
  waterAvailable: null as boolean | null,
  fireAllowed: null as boolean | null,
  parkingAvailable: null as boolean | null,
};

export default function AddCampsiteScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<MapView>(null);
  const set = <K extends keyof typeof EMPTY>(key: K) => (value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = useMutation({
    mutationFn: () =>
      api<Campsite>('/api/campsites', {
        method: 'POST',
        json: {
          ...form,
          name: form.name.trim(),
          description: form.description.trim(),
          region: form.region.trim(),
          campingType: form.campingType.trim() || null,
          cellSignal: form.cellSignal.trim() || null,
          latitude: coords!.latitude,
          longitude: coords!.longitude,
        },
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['campsites'] });
      setForm(EMPTY);
      setCoords(null);
      router.push(`/campsite/${created.id}`);
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const locateMe = async () => {
    setLocating(true);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) return setError('Location permission denied. Tap the map to place the campsite instead.');
      const { coords: c } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ latitude: c.latitude, longitude: c.longitude });
      mapRef.current?.animateToRegion({ latitude: c.latitude, longitude: c.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      setError(null);
    } catch {
      setError('Could not get your location. Tap the map instead.');
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = () => {
    if (!form.name.trim() || !form.description.trim() || !form.region.trim())
      return setError('Name, description with access notes, and region are required.');
    if (!coords) return setError('Set the location: use your current location or tap the map.');
    if (!form.roadCondition || !form.vehicleRequired || !form.legalStatus)
      return setError('Choose road condition, vehicle and legal status.');
    setError(null);
    submit.mutate();
  };

  if (!token) {
    return (
      <Screen tab>
        <Heading>Add a campsite</Heading>
        <Text style={styles.body}>Sign in to share a free campsite with the community.</Text>
        <Button title="Sign in" onPress={() => router.push('/login')} />
      </Screen>
    );
  }

  return (
    <Screen tab>
      <Heading>Add a campsite</Heading>
      <Notice>
        Only submit locations where camping is allowed or reasonably believed to be allowed. Do not submit private
        property, restricted areas, or unsafe locations.
      </Notice>
      <Field label="Name" value={form.name} onChangeText={set('name')} maxLength={200} />
      <Field
        label="Description and access notes"
        placeholder="How to get there, where to park, what to expect"
        value={form.description}
        onChangeText={set('description')}
        multiline
        maxLength={5000}
      />
      <Field label="Region" placeholder="e.g. Sea to Sky" value={form.region} onChangeText={set('region')} maxLength={100} />

      <Text style={styles.label}>Location</Text>
      <MapView
        style={{ height: 220, borderRadius: 10 }}
        initialRegion={{ latitude: 49.2827, longitude: -123.1207, latitudeDelta: 2, longitudeDelta: 2 }}
        ref={mapRef}
        onPress={(e) => setCoords(e.nativeEvent.coordinate)}
        accessibilityLabel="Map. Tap to place the campsite.">
        {coords && <Marker coordinate={coords} />}
      </MapView>
      <Text style={styles.muted}>
        {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Tap the map or use your location.'}
      </Text>
      <Button title="Use my current location" variant="secondary" loading={locating} onPress={locateMe} />

      <Choice label="Road condition" options={ROADS} value={form.roadCondition} onChange={set('roadCondition')} />
      <Choice label="Vehicle required" options={VEHICLES} value={form.vehicleRequired} onChange={set('vehicleRequired')} />
      <Choice label="Legal status" options={LEGAL} value={form.legalStatus} onChange={set('legalStatus')} />
      <Choice label="Toilet" options={YES_NO_UNKNOWN} value={form.toiletAvailable} onChange={set('toiletAvailable')} />
      <Choice label="Water nearby" options={YES_NO_UNKNOWN} value={form.waterAvailable} onChange={set('waterAvailable')} />
      <Choice label="Fires allowed" options={YES_NO_UNKNOWN} value={form.fireAllowed} onChange={set('fireAllowed')} />
      <Choice label="Parking" options={YES_NO_UNKNOWN} value={form.parkingAvailable} onChange={set('parkingAvailable')} />
      <Field label="Camping type (optional)" placeholder="e.g. Tent, Car camping" value={form.campingType} onChangeText={set('campingType')} maxLength={50} />
      <Field label="Cell signal (optional)" placeholder="e.g. None, Weak, Good" value={form.cellSignal} onChangeText={set('cellSignal')} maxLength={50} />

      <ErrorText>{error}</ErrorText>
      <Button title="Submit campsite" onPress={onSubmit} loading={submit.isPending} />
      <Text style={styles.muted}>New campsites show as unverified until someone visits and verifies them.</Text>
    </Screen>
  );
}
