import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampsiteCard } from '@/components/CampsiteCard';
import { colors, styles as ui } from '@/components/ui';
import { api, errorMessage, type Campsite } from '@/lib/api';

const VANCOUVER: Region = { latitude: 49.2827, longitude: -123.1207, latitudeDelta: 1.5, longitudeDelta: 1.5 };

/** Roughly half the visible map height in km, clamped to the backend's 1..500 km range. */
function radiusKm(region: Region) {
  return Math.min(500, Math.max(1, Math.round((region.latitudeDelta * 111) / 2)));
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const visible = useRef<Region>(VANCOUVER);
  const [searchArea, setSearchArea] = useState<Region | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [toilet, setToilet] = useState(false);
  const [water, setWater] = useState(false);
  const [selected, setSelected] = useState<Campsite | null>(null);

  useEffect(() => {
    (async () => {
      let region = VANCOUVER;
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (granted) {
          const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          region = { ...VANCOUVER, latitude: coords.latitude, longitude: coords.longitude };
        } else {
          setLocationDenied(true);
        }
      } catch {
        setLocationDenied(true);
      }
      visible.current = region;
      mapRef.current?.animateToRegion(region, 500);
      setSearchArea(region);
    })();
  }, []);

  const campsites = useQuery({
    queryKey: ['campsites', searchArea, toilet, water],
    enabled: searchArea != null,
    queryFn: () => {
      const area = searchArea!;
      const params = new URLSearchParams({
        lat: String(area.latitude),
        lng: String(area.longitude),
        radiusKm: String(radiusKm(area)),
      });
      if (toilet) params.set('toilet', 'true');
      if (water) params.set('water', 'true');
      return api<Campsite[]>(`/api/campsites?${params}`);
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={VANCOUVER}
        showsUserLocation={!locationDenied}
        onRegionChangeComplete={(region) => (visible.current = region)}
        onPress={() => setSelected(null)}>
        {campsites.data?.map((c) => (
          <Marker
            key={c.id}
            coordinate={{ latitude: c.latitude, longitude: c.longitude }}
            title={c.name}
            accessibilityLabel={c.name}
            pinColor={c.status === 'VERIFIED_RECENTLY' ? colors.primary : '#B7791F'}
            onPress={(e) => {
              e.stopPropagation();
              setSelected(c);
            }}
          />
        ))}
      </MapView>

      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.bar}>
          <Toggle label="Toilet" value={toilet} onChange={setToilet} />
          <Toggle label="Water" value={water} onChange={setWater} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search this area"
            onPress={() => {
              setSelected(null);
              setSearchArea({ ...visible.current });
            }}
            style={[styles.pill, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <Text style={[styles.pillText, { color: '#fff' }]}>Search this area</Text>
          </Pressable>
        </View>
        {campsites.isFetching && <ActivityIndicator accessibilityLabel="Loading campsites" />}
        {campsites.error && <Banner text={errorMessage(campsites.error)} />}
        {campsites.data?.length === 0 && !campsites.isFetching && (
          <Banner text="No campsites found here. Move the map and search this area." />
        )}
        {locationDenied && <Banner text="Location is off, showing Vancouver. Allow location to see nearby sites." />}
      </View>

      {selected && (
        <View style={styles.preview}>
          <CampsiteCard campsite={selected} onPress={() => router.push(`/campsite/${selected.id}`)} />
        </View>
      )}
    </View>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={`Only sites with ${label.toLowerCase()}`}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={[styles.pill, value && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
      <Text style={[styles.pillText, value && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

function Banner({ text }: { text: string }) {
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <Text style={ui.muted}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 12, gap: 8 },
  bar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  pillText: { fontSize: 15, fontWeight: '600', color: colors.text },
  banner: { backgroundColor: '#fff', borderRadius: 10, padding: 10 },
  preview: { position: 'absolute', left: 12, right: 12, bottom: 100, backgroundColor: '#fff', borderRadius: 12 },
});
