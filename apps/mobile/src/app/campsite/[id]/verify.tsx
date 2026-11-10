import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Button, Choice, ErrorText, Field, Screen, styles, YES_NO, YES_NO_UNKNOWN } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { isPastOrTodayIso, todayIso } from '@/lib/date';

type Answer = boolean | null;

// README §8.5 questions. The first four are required by the backend.
const REQUIRED = [
  ['isOpen', 'Is the spot still open?'],
  ['isFree', 'Is it still free?'],
  ['campingAllowed', 'Did camping seem allowed?'],
  ['feltSafe', 'Did you feel safe?'],
] as const;
const OPTIONAL = [
  ['roadAccessible', 'Was the road accessible?'],
  ['wasClean', 'Was the spot clean?'],
  ['wasCrowded', 'Was it crowded?'],
  ['fireBanSignSeen', 'Were there fire ban signs?'],
] as const;

export default function VerifyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [cellSignal, setCellSignal] = useState('');
  const [visitedAt, setVisitedAt] = useState(todayIso());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      api(`/api/campsites/${id}/verifications`, {
        method: 'POST',
        json: {
          ...Object.fromEntries(OPTIONAL.map(([key]) => [key, answers[key] ?? null])),
          ...Object.fromEntries(REQUIRED.map(([key]) => [key, answers[key]])),
          cellSignal: cellSignal.trim() || null,
          visitedAt,
          notes: notes.trim() || null,
        },
      }),
    onSuccess: async () => {
      // A verification can change the campsite's status and last-verified date.
      await queryClient.invalidateQueries({ queryKey: ['campsite', id] });
      await queryClient.invalidateQueries({ queryKey: ['verifications', id] });
      await queryClient.invalidateQueries({ queryKey: ['campsites'] });
      router.back();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  const onSubmit = () => {
    if (REQUIRED.some(([key]) => answers[key] == null)) return setError('Answer the first four questions.');
    if (!isPastOrTodayIso(visitedAt)) return setError('Visit date must be YYYY-MM-DD and not in the future.');
    setError(null);
    submit.mutate();
  };

  const set = (key: string) => (value: Answer) => setAnswers((a) => ({ ...a, [key]: value }));

  return (
    <Screen>
      <Text style={styles.muted}>Only verify a campsite you visited yourself.</Text>
      {REQUIRED.map(([key, question]) => (
        <Choice key={key} label={question} options={YES_NO} value={answers[key] ?? null} onChange={set(key)} />
      ))}
      {OPTIONAL.map(([key, question]) => (
        <Choice key={key} label={question} options={YES_NO_UNKNOWN} value={answers[key] ?? null} onChange={set(key)} />
      ))}
      <Field label="Cell signal (optional)" placeholder="e.g. None, Weak, Good" value={cellSignal} onChangeText={setCellSignal} maxLength={50} />
      <Field label="When did you visit? (YYYY-MM-DD)" value={visitedAt} onChangeText={setVisitedAt} autoCapitalize="none" keyboardType="numbers-and-punctuation" />
      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline maxLength={2000} />
      <ErrorText>{error}</ErrorText>
      <Button title="Submit verification" onPress={onSubmit} loading={submit.isPending} />
    </Screen>
  );
}
