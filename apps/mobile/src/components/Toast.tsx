import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { Text } from './Text';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

interface ToastInput {
  type?: ToastType;
  message: string;
  duration?: number;
  action?: { label: string; onPress: () => void };
}

interface ToastState extends Required<Pick<ToastInput, 'type' | 'message' | 'duration'>> {
  id: number;
  action?: ToastInput['action'];
}

interface ToastApi {
  show: (t: ToastInput) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const hide = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [opacity]);

  const show = useCallback(
    (t: ToastInput) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const id = ++idRef.current;
      setToast({
        id,
        type: t.type ?? 'info',
        message: t.message,
        duration: t.duration ?? 3000,
        action: t.action,
      });
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      timerRef.current = setTimeout(() => {
        if (idRef.current === id) hide();
      }, t.duration ?? 3000);
    },
    [opacity, hide]
  );

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  const bg = toast
    ? toast.type === 'success'
      ? theme.colors.intent.successMuted
      : toast.type === 'error'
      ? theme.colors.intent.dangerMuted
      : toast.type === 'warning'
      ? theme.colors.intent.warningMuted
      : theme.colors.surface.default
    : theme.colors.surface.default;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + 12,
            left: 16,
            right: 16,
            opacity,
          }}
        >
          <View
            style={[
              {
                backgroundColor: bg,
                padding: theme.spacing[4],
                borderRadius: theme.radii.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[3],
              },
              theme.shadows.md,
            ]}
          >
            <Text
              variant="body.md"
              color="text.primary"
              style={{ flex: 1 }}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
            {toast.action ? (
              <Pressable
                onPress={() => {
                  toast.action?.onPress();
                  hide();
                }}
              >
                <Text variant="button.md" color="intent.primary">
                  {toast.action.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
