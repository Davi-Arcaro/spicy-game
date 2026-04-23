import { Platform, type ViewStyle } from 'react-native';

const make = (
  ios: { offsetY: number; opacity: number; radius: number },
  androidElevation: number
): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: ios.offsetY },
      shadowOpacity: ios.opacity,
      shadowRadius: ios.radius,
    },
    android: { elevation: androidElevation },
    default: {},
  })!;

export const shadows = {
  none: {} as ViewStyle,
  sm: make({ offsetY: 1, opacity: 0.15, radius: 2 }, 2),
  md: make({ offsetY: 4, opacity: 0.2, radius: 8 }, 6),
  lg: make({ offsetY: 12, opacity: 0.3, radius: 24 }, 16),
} as const;

export type ShadowKey = keyof typeof shadows;
