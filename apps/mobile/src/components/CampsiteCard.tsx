import { Pressable, Text } from 'react-native';

import type { Campsite } from '@/lib/api';
import { ratingLabel, statusLabel, verifiedLabel } from '@/lib/status';

import { colors, styles } from './ui';

/** Name, status, rating and last-verified line; opens the detail screen when pressed. */
export function CampsiteCard({ campsite, onPress }: { campsite: Campsite; onPress: () => void }) {
  const status = statusLabel(campsite.status);
  const verified = verifiedLabel(campsite.lastVerifiedAt);
  const rating = ratingLabel(campsite.ratingAvg, campsite.reviewCount);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${campsite.name}. ${status}. ${verified}. ${rating}`}
      accessibilityHint="Opens campsite details"
      style={({ pressed }) => [styles.card, { minHeight: 44 }, pressed && { opacity: 0.7 }]}>
      <Text style={[styles.body, { fontWeight: '700' }]}>{campsite.name}</Text>
      <Text style={[styles.muted, { color: colors.text }]}>
        {status} · {verified}
      </Text>
      <Text style={styles.muted}>
        {rating} · {campsite.region}
      </Text>
    </Pressable>
  );
}
