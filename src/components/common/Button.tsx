import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import {COLORS, RADIUS, SPACING} from '../../theme';

type Variant = 'primary' | 'danger' | 'success' | 'outline' | 'ghost';

interface Props extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<Variant, {bg: string; text: string; border?: string}> = {
  primary: {bg: COLORS.primary, text: '#fff'},
  danger: {bg: COLORS.danger, text: '#fff'},
  success: {bg: COLORS.success, text: '#fff'},
  outline: {bg: 'transparent', text: COLORS.primary, border: COLORS.primary},
  ghost: {bg: 'transparent', text: COLORS.textSecondary},
};

export default function Button({
  label,
  variant = 'primary',
  loading = false,
  size = 'md',
  style,
  disabled,
  ...rest
}: Props) {
  const v = variantStyles[variant];
  const paddingVertical = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border ?? 'transparent',
          borderWidth: v.border ? 1.5 : 0,
          paddingVertical,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.label, {color: v.text, fontSize}]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
