export const radii = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radii;
