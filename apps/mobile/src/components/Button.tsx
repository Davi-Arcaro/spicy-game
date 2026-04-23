import { useMemo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'lg' | 'md' | 'sm';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  destructive?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: ViewStyle;
}

const sizeHeight: Record<Size, number> = { lg: 56, md: 44, sm: 36 };
const sizePadding: Record<Size, number> = { lg: 20, md: 16, sm: 12 };

export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  destructive = false,
  loading = false,
  disabled,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();

  const styles = useMemo(() => {
    const base: ViewStyle = {
      height: sizeHeight[size],
      paddingHorizontal: sizePadding[size],
      borderRadius: theme.radii.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[2],
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
    };

    const intentColor = destructive
      ? theme.colors.intent.danger
      : theme.colors.intent.primary;

    if (variant === 'primary') {
      return {
        container: { ...base, backgroundColor: intentColor },
        pressed: { opacity: 0.85 },
        disabled: { opacity: 0.4 },
        textColor: destructive
          ? theme.colors.text.onPrimary
          : theme.colors.text.onPrimary,
      };
    }
    if (variant === 'secondary') {
      return {
        container: {
          ...base,
          backgroundColor: theme.colors.surface.default,
          borderWidth: 1,
          borderColor: theme.colors.border.default,
        },
        pressed: { backgroundColor: theme.colors.surface.muted },
        disabled: { opacity: 0.4 },
        textColor: destructive
          ? theme.colors.intent.danger
          : theme.colors.text.primary,
      };
    }
    return {
      container: { ...base, backgroundColor: theme.palette.transparent },
      pressed: { backgroundColor: theme.colors.surface.muted },
      disabled: { opacity: 0.4 },
      textColor: destructive
        ? theme.colors.intent.danger
        : theme.colors.text.secondary,
    };
  }, [theme, variant, size, destructive, fullWidth]);

  const textVariant = size === 'lg' ? 'button.lg' : 'button.md';
  const isBusy = loading || disabled;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isBusy}
      style={({ pressed }) => [
        styles.container,
        pressed && !isBusy ? styles.pressed : null,
        isBusy ? styles.disabled : null,
        style,
      ]}
      hitSlop={8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={styles.textColor} />
      ) : (
        <>
          {leftIcon ? <View>{leftIcon}</View> : null}
          {typeof children === 'string' ? (
            <Text
              variant={textVariant}
              style={{ color: styles.textColor }}
              numberOfLines={1}
            >
              {children}
            </Text>
          ) : (
            children
          )}
          {rightIcon ? <View>{rightIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _noopStyleSheet = StyleSheet.create({});
