import React from 'react';
import {StyleSheet, View} from 'react-native';
import {COLORS, SPACING} from '../../theme';

interface Props {
  vertical?: number;
}

export default function Divider({vertical = SPACING.md}: Props) {
  return <View style={[styles.line, {marginVertical: vertical}]} />;
}

const styles = StyleSheet.create({
  line: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});
