import React from 'react';
import {StyleSheet, View, ViewProps} from 'react-native';
import {COLORS, RADIUS, SHADOW, SPACING} from '../../theme';

interface Props extends ViewProps {
  children: React.ReactNode;
  padding?: number;
}

export default function Card({children, padding = SPACING.md, style, ...rest}: Props) {
  return (
    <View style={[styles.card, {padding}, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.small,
  },
});
