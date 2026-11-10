import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Button, DISCLAIMER, ErrorText, Heading, Notice, Screen, styles } from '@/components/ui';
import { API_URL, api, errorMessage, type Campsite, type Photo, type Review, type Verification } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { isVerifiedRecently, label, ratingLabel, statusLabel, verifiedLabel, yesNo } from '@/lib/status';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function CampsiteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const campsite = useQuery({ queryKey: ['campsite', id], queryFn: () => api<Campsite>(`/api/campsites/${id}`) });
  const reviews = useQuery({ queryKey: ['reviews', id], queryFn: () => api<Review[]>(`/api/campsites/${id}/reviews`) });
  const verifications = useQuery({
    queryKey: ['verifications', id],
    queryFn: () => api<Verification[]>(`/api/campsites/${id}/verifications`),
  });
  const photos = useQuery({ queryKey: ['photos', id], queryFn: () => api<Photo[]>(`/api/campsites/${id}/photos`) });
  const saved = useQuery({
    queryKey: ['saved'],
    queryFn: () => api<Campsite[]>('/api/me/saved-campsites'),
    enabled: !!token,
  });
  const isSaved = saved.data?.some((c) => String(c.id) === id) ?? false;

  const toggleSave = useMutation({
    mutationFn: () => api(`/api/me/saved-campsites/${id}`, { method: isSaved ? 'DELETE' : 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved'] }),
    onError: (e) => setActionError(errorMessage(e)),
  });

  const addPhoto = useMutation({
    mutationFn: async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        // iOS: convert HEIC to JPEG; the server only accepts JPEG, PNG or WebP.
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const type = asset.mimeType ?? 'image/jpeg';
      if (!PHOTO_TYPES.includes(type)) throw new Error('Choose a JPEG, PNG or WebP image.');
      if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) throw new Error('Photos must be 5 MB or smaller.');
      const form = new FormData();
      // React Native's FormData takes a { uri, name, type } file descriptor.
      form.append('file', { uri: asset.uri, name: asset.fileName ?? 'photo.jpg', type } as unknown as Blob);
      await api(`/api/campsites/${id}/photos`, { method: 'POST', body: form });
      await queryClient.invalidateQueries({ queryKey: ['photos', id] });
    },
    onError: (e) => setActionError(errorMessage(e)),
  });

  if (campsite.isPending) return <ActivityIndicator style={{ marginTop: 48 }} accessibilityLabel="Loading campsite" />;
  if (campsite.error) {
    return (
      <Screen>
        <ErrorText>{errorMessage(campsite.error)}</ErrorText>
        <Button title="Try again" variant="secondary" onPress={() => campsite.refetch()} />
      </Screen>
    );
  }

  const c = campsite.data;
  const fresh = isVerifiedRecently(c.lastVerifiedAt);
  const go = (path: 'review' | 'verify' | 'report') => router.push(`/campsite/${id}/${path}`);

  return (
    <Screen>
      <Stack.Screen options={{ title: c.name }} />
      <Heading>{c.name}</Heading>
      <Text style={[styles.body, { fontWeight: '600' }]}>
        {statusLabel(c.status)} · {verifiedLabel(c.lastVerifiedAt)}
      </Text>
      {!fresh && (
        <Notice>
          {c.lastVerifiedAt
            ? 'Not verified in the last 90 days. Conditions, access and legal status may have changed.'
            : 'No one has verified this campsite yet. Treat every detail as unconfirmed.'}
        </Notice>
      )}
      {c.status.startsWith('REPORTED_') && (
        <Notice>The latest visitor reported a problem here ({statusLabel(c.status).toLowerCase()}).</Notice>
      )}

      {(photos.data?.length ?? 0) > 0 && (
        <ScrollView horizontal contentContainerStyle={{ gap: 8 }} accessibilityLabel="Photos">
          {photos.data!.map((p) => (
            <Image
              key={p.id}
              source={{ uri: API_URL + p.imageUrl }}
              style={{ width: 220, height: 160, borderRadius: 10 }}
              accessibilityLabel={p.caption || `Photo of ${c.name}`}
              contentFit="cover"
            />
          ))}
        </ScrollView>
      )}

      <Text style={styles.body}>{c.description}</Text>

      <View style={styles.card}>
        <Row k="Location" v={`${c.region} (${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)})`} />
        <Row k="Legal status" v={label(c.legalStatus)} />
        <Row k="Road condition" v={label(c.roadCondition)} />
        <Row k="Vehicle" v={label(c.vehicleRequired)} />
        <Row k="Camping type" v={c.campingType || 'Unknown'} />
        <Row k="Toilet" v={yesNo(c.toiletAvailable)} />
        <Row k="Water" v={yesNo(c.waterAvailable)} />
        <Row k="Parking" v={yesNo(c.parkingAvailable)} />
        <Row k="Cell signal" v={c.cellSignal || 'Unknown'} />
        <Row k="Fires allowed" v={c.fireAllowed == null ? 'Unknown, check current rules' : yesNo(c.fireAllowed)} />
        <Row k="Rating" v={ratingLabel(c.ratingAvg, c.reviewCount)} />
      </View>

      <Notice tone="info">{DISCLAIMER}</Notice>

      {token ? (
        <View style={{ gap: 8 }}>
          <Button
            title={isSaved ? 'Remove from saved' : 'Save campsite'}
            variant={isSaved ? 'secondary' : 'primary'}
            loading={toggleSave.isPending}
            onPress={() => toggleSave.mutate()}
          />
          <Button title="Verify this campsite" variant="secondary" onPress={() => go('verify')} />
          <Button title="Write a review" variant="secondary" onPress={() => go('review')} />
          <Button title="Add a photo" variant="secondary" loading={addPhoto.isPending} onPress={() => addPhoto.mutate()} />
          <Button title="Report a problem" variant="danger" onPress={() => go('report')} />
          <ErrorText>{actionError}</ErrorText>
        </View>
      ) : (
        <Button
          title="Sign in to save, verify, review or report"
          variant="secondary"
          onPress={() => router.push('/login')}
        />
      )}

      <Text style={styles.subheading} accessibilityRole="header">
        Latest verifications
      </Text>
      {verifications.data?.length === 0 && <Text style={styles.muted}>No verifications yet.</Text>}
      {verifications.data?.slice(0, 5).map((v) => (
        <View key={v.id} style={styles.card}>
          <Text style={[styles.body, { fontWeight: '600' }]}>Visited {v.visitedAt}</Text>
          <Text style={styles.muted}>
            Open: {yesNo(v.isOpen)} · Free: {yesNo(v.isFree)} · Camping allowed: {yesNo(v.campingAllowed)} · Felt safe:{' '}
            {yesNo(v.feltSafe)}
          </Text>
          <Text style={styles.muted}>
            Road accessible: {yesNo(v.roadAccessible)} · Clean: {yesNo(v.wasClean)} · Crowded: {yesNo(v.wasCrowded)} ·
            Fire ban signs: {yesNo(v.fireBanSignSeen)}
            {v.cellSignal ? ` · Cell: ${v.cellSignal}` : ''}
          </Text>
          {v.notes ? <Text style={styles.body}>{v.notes}</Text> : null}
        </View>
      ))}

      <Text style={styles.subheading} accessibilityRole="header">
        Reviews
      </Text>
      {reviews.data?.length === 0 && <Text style={styles.muted}>No reviews yet.</Text>}
      {reviews.data?.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={[styles.body, { fontWeight: '600' }]}>
            {r.rating} / 5{r.visitedAt ? ` · visited ${r.visitedAt}` : ''}
          </Text>
          {r.reviewText ? <Text style={styles.body}>{r.reviewText}</Text> : null}
        </View>
      ))}
    </Screen>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{k}</Text>
      <Text style={[styles.body, { flexShrink: 1, textAlign: 'right' }]}>{v}</Text>
    </View>
  );
}
