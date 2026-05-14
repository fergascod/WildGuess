import { Link } from 'expo-router';
import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { accentShadow, cardShadow, colors, fonts, radius, spacing } from '@/theme/theme';

/** Scrollable, centered page shell with the app background. */
export function Screen({
  children,
  contentStyle,
  maxWidth = 480,
}: {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  maxWidth?: number;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.screenInner, { maxWidth }, contentStyle]}>
        {children}
      </View>
    </ScrollView>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

type ButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary';
  href?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = 'primary',
  href,
  onPress,
  disabled,
  style,
}: ButtonProps) {
  const isSecondary = variant === 'secondary';
  // Flatten to a single object: `Link asChild` merges `style` via object
  // spread, which silently drops function/array styles.
  const pressableStyle = StyleSheet.flatten([
    styles.btn,
    isSecondary ? styles.btnSecondary : styles.btnPrimary,
    !isSecondary && accentShadow,
    disabled && styles.btnDisabled,
    style,
  ]);
  // When wrapped in `Link asChild`, navigation comes from the injected
  // `onPress`; only pass our own handler when there is no `href` so the two
  // don't clobber each other.
  const content = (
    <Pressable
      onPress={href ? undefined : onPress}
      disabled={disabled}
      style={pressableStyle}
    >
      <Text style={[styles.btnText, isSecondary && styles.btnTextSecondary]}>
        {label}
      </Text>
    </Pressable>
  );

  if (href && !disabled) {
    return (
      <Link href={href as never} asChild>
        {content}
      </Link>
    );
  }
  return content;
}

export function NumberInput({
  value,
  onChangeNumber,
  placeholder,
}: {
  value: string;
  onChangeNumber: (n: number | null) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType="number-pad"
      inputMode="numeric"
      onChangeText={(t) => {
        const cleaned = t.replace(/[^0-9]/g, '');
        onChangeNumber(cleaned === '' ? null : parseInt(cleaned, 10));
      }}
    />
  );
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  screenInner: {
    width: '100%',
    gap: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
    ...cardShadow,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    lineHeight: 38,
  },
  field: {
    gap: spacing.xs + 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  fieldError: {
    fontSize: 12,
    color: colors.wrong,
  },
  input: {
    width: '100%',
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    width: '100%',
    borderRadius: radius.sm,
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.3,
    color: '#fff',
    textAlign: 'center',
  },
  btnTextSecondary: {
    color: colors.accent,
  },
});
