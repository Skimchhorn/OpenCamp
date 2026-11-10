import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { Button, Choice, ErrorText, Field, Screen } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { isPastOrTodayIso } from '@/lib/date';

const STARS = [1, 2, 3, 4, 5].map((n) => [n, String(n)] as const);
const OPTIONAL_STARS = [...STARS, [null, 'Skip'] as const];
// README §8.7 detail ratings, all optional.
const DETAILS = [
  ['roadRating', 'Road condition'],
  ['cleanlinessRating', 'Cleanliness'],
  ['safetyRating', 'Safety'],
  ['crowdednessRating', 'Crowdedness'],
] as const;

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<string, number | null>>({});
  const [reviewText, setReviewText] = useState('');
  const [visitedAt, setVisitedAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      api(`/api/campsites/${id}/reviews`, {
        method: 'POST',
        json: { rating, reviewText: reviewText.trim() || null, visitedAt: visitedAt || null, ...details },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      await queryClient.invalidateQueries({ queryKey: ['campsite', id] });
      router.back();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const onSubmit = () => {
    if (rating == null) return setError('Choose a rating from 1 to 5.');
    if (visitedAt && !isPastOrTodayIso(visitedAt)) return setError('Visit date must be YYYY-MM-DD and not in the future.');
    setError(null);
    submit.mutate();
  };

  return (
    <Screen>
      <Choice label="Overall rating" options={STARS} value={rating} onChange={setRating} />
      <Field label="Your review (optional)" value={reviewText} onChangeText={setReviewText} multiline maxLength={5000} placeholder="Road, noise, cleanliness, tips for others" />
      <Field label="Visit date (optional, YYYY-MM-DD)" value={visitedAt} onChangeText={setVisitedAt} autoCapitalize="none" keyboardType="numbers-and-punctuation" />
      {DETAILS.map(([key, name]) => (
        <Choice
          key={key}
          label={`${name} (optional)`}
          options={OPTIONAL_STARS}
          value={details[key] ?? null}
          onChange={(v) => setDetails((d) => ({ ...d, [key]: v }))}
        />
      ))}
      <ErrorText>{error}</ErrorText>
      <Button title="Post review" onPress={onSubmit} loading={submit.isPending} />
    </Screen>
  );
}
