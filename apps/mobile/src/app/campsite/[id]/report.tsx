import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Button, Choice, ErrorText, Field, Screen } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { label } from '@/lib/status';

// Backend Report.Reason values.
const REASONS = [
  'NOT_FREE',
  'PRIVATE_PROPERTY',
  'CAMPING_NOT_ALLOWED',
  'CLOSED',
  'UNSAFE',
  'WRONG_LOCATION',
  'FAKE_LISTING',
  'SPAM',
  'DUPLICATE',
  'INAPPROPRIATE_PHOTO',
  'OTHER',
].map((r) => [r, label(r)] as const);

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () =>
      api(`/api/campsites/${id}/reports`, {
        method: 'POST',
        json: { reason, description: description.trim() || null },
      }),
    onSuccess: () => {
      Alert.alert('Report sent', 'Thanks. A moderator will review this listing.');
      router.back();
    },
    onError: (e) => setError(errorMessage(e)),
  });

  return (
    <Screen>
      <Choice label="What is wrong?" options={REASONS} value={reason} onChange={setReason} />
      <Field label="Details (optional)" value={description} onChangeText={setDescription} multiline maxLength={2000} />
      <ErrorText>{error}</ErrorText>
      <Button
        title="Send report"
        variant="danger"
        loading={submit.isPending}
        onPress={() => (reason ? submit.mutate() : setError('Choose a reason.'))}
      />
    </Screen>
  );
}
