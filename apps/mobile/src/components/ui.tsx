import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const colors = {
  text: '#1B1F1C',
  muted: '#5A635C',
  border: '#C9D1CB',
  surface: '#F3F6F3',
  background: '#FFFFFF',
  primary: '#2F6B3B',
  danger: '#A4282B',
  warningBg: '#FFF4D6',
  warningText: '#6B4E00',
};

/** Scrolling page. `tab` adds the top safe-area inset, since tab screens have no header. */
export function Screen({ children, tab }: { children: ReactNode; tab?: boolean }) {
  const top = useSafeAreaInsets().top;
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.screen, tab && { paddingTop: top + 16 }]}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.heading} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  accessibilityHint,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}) {
  const filled = variant === 'primary';
  const color = variant === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { borderColor: color, backgroundColor: filled ? color : colors.background },
        (pressed || disabled) && { opacity: 0.6 },
      ]}>
      {loading ? (
        <ActivityIndicator color={filled ? '#fff' : color} />
      ) : (
        <Text style={[styles.buttonText, { color: filled ? '#fff' : color }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, props.multiline && { minHeight: 96, textAlignVertical: 'top' }]}
        {...props}
      />
    </View>
  );
}

/** Single-choice chips. Use [[true,'Yes'],[false,'No'],[null,'Unknown']] for tri-state booleans. */
export function Choice<T>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly (readonly [T, string])[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.field} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map(([option, text]) => {
          const selected = option === value;
          return (
            <Pressable
              key={text}
              onPress={() => onChange(option)}
              accessibilityRole="radio"
              accessibilityLabel={`${label}: ${text}`}
              accessibilityState={{ selected, checked: selected }}
              style={[styles.chip, selected && styles.chipSelected]}>
              <Text style={[styles.chipText, selected && { color: '#fff' }]}>{text}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const YES_NO_UNKNOWN = [
  [true, 'Yes'],
  [false, 'No'],
  [null, 'Unknown'],
] as const;

export const YES_NO = [
  [true, 'Yes'],
  [false, 'No'],
] as const;

export function Notice({ children, tone = 'warning' }: { children: ReactNode; tone?: 'warning' | 'info' }) {
  const warning = tone === 'warning';
  return (
    <View
      style={[styles.notice, { backgroundColor: warning ? colors.warningBg : colors.surface }]}
      accessibilityRole={warning ? 'alert' : undefined}>
      <Text style={[styles.noticeText, { color: warning ? colors.warningText : colors.text }]}>{children}</Text>
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
      {children}
    </Text>
  );
}

export const DISCLAIMER =
  'OpenCamp relies on community-submitted information. Always check local laws, fire restrictions, road conditions, and land access rules before camping. Pack out all garbage and respect the environment.';

export const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12, paddingBottom: 48 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text },
  subheading: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 8 },
  body: { fontSize: 16, lineHeight: 22, color: colors.text },
  muted: { fontSize: 15, color: colors.muted },
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 15, color: colors.text },
  notice: { padding: 12, borderRadius: 10 },
  noticeText: { fontSize: 15, lineHeight: 21 },
  error: { fontSize: 15, color: colors.danger },
  card: { padding: 12, borderRadius: 10, backgroundColor: colors.surface, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
});
