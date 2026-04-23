import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helper?: string;
  error?: string;
  style?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, helper, error, onFocus, onBlur, style, ...rest },
  ref
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.intent.danger
    : focused
    ? theme.colors.border.focus
    : theme.colors.border.default;

  return (
    <View style={style}>
      {label ? (
        <Text variant="heading.sm" color="text.primary" style={{ marginBottom: theme.spacing[2] }}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.wrapper,
          {
            backgroundColor: theme.colors.surface.default,
            borderColor,
            borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing[4],
            height: 48,
          },
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.text.muted}
          selectionColor={theme.colors.intent.primary}
          style={[
            styles.input,
            theme.typography.body.lg,
            { color: theme.colors.text.primary },
          ]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {error ? (
        <Text
          variant="body.sm"
          color="intent.danger"
          style={{ marginTop: theme.spacing[1] }}
        >
          {error}
        </Text>
      ) : helper ? (
        <Text
          variant="body.sm"
          color="text.muted"
          style={{ marginTop: theme.spacing[1] }}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
});
