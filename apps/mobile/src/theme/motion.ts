import { Easing } from 'react-native';

export const motion = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 400,
    roulette: 2800,
  },
  easing: {
    standard: Easing.inOut(Easing.ease),
    decel: Easing.out(Easing.ease),
    accel: Easing.in(Easing.ease),
    rouletteEnd: Easing.bezier(0.22, 0.61, 0.36, 1),
  },
} as const;
