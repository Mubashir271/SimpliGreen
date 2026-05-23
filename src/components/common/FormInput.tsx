import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS, RADIUS, SPACING} from '../../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export default function FormInput({label, error, style, secureTextEntry, ...rest}: Props) {
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, error ? styles.inputError : null, secureTextEntry ? styles.inputWithIcon : null, style]}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry ? hidden : false}
          {...rest}
        />
        {secureTextEntry ? (
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setHidden(h => !h)}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  inputRow: {
    position: 'relative',
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 2,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  error: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
  },
});
