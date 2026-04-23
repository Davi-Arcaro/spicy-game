import { palette } from './palette';

export interface ColorTokens {
  background: {
    base: string;
    raised: string;
    overlay: string;
    inverse: string;
  };
  surface: { default: string; muted: string; strong: string };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    onPrimary: string;
    onAccent: string;
  };
  intent: {
    primary: string;
    primaryHover: string;
    primaryMuted: string;
    accent: string;
    accentHover: string;
    accentMuted: string;
    success: string;
    successMuted: string;
    warning: string;
    warningMuted: string;
    danger: string;
    dangerMuted: string;
    info: string;
  };
  border: { default: string; muted: string; strong: string; focus: string };
  card: { background: string; border: string; accent: string };
}

export const darkColors: ColorTokens = {
  background: {
    base: palette.neutral950,
    raised: palette.neutral900,
    overlay: palette.neutral800,
    inverse: palette.neutral50,
  },
  surface: {
    default: palette.neutral800,
    muted: palette.neutral700,
    strong: palette.neutral600,
  },
  text: {
    primary: palette.neutral100,
    secondary: palette.neutral300,
    muted: palette.neutral400,
    inverse: palette.neutral900,
    onPrimary: palette.neutral50,
    onAccent: palette.neutral900,
  },
  intent: {
    primary: palette.coral500,
    primaryHover: palette.coral400,
    primaryMuted: palette.coral800,
    accent: palette.amber400,
    accentHover: palette.amber300,
    accentMuted: palette.amber600,
    success: palette.success500,
    successMuted: palette.success700,
    warning: palette.warning500,
    warningMuted: palette.warning700,
    danger: palette.danger500,
    dangerMuted: palette.danger700,
    info: palette.info500,
  },
  border: {
    default: palette.neutral700,
    muted: palette.neutral800,
    strong: palette.neutral500,
    focus: palette.coral400,
  },
  card: {
    background: palette.neutral800,
    border: palette.neutral700,
    accent: palette.coral500,
  },
};

export const lightColors: ColorTokens = {
  background: {
    base: palette.neutral50,
    raised: palette.white,
    overlay: palette.neutral100,
    inverse: palette.neutral900,
  },
  surface: {
    default: palette.neutral200,
    muted: palette.neutral100,
    strong: palette.neutral300,
  },
  text: {
    primary: palette.neutral900,
    secondary: palette.neutral600,
    muted: palette.neutral500,
    inverse: palette.neutral50,
    onPrimary: palette.white,
    onAccent: palette.neutral900,
  },
  intent: {
    primary: palette.coral500,
    primaryHover: palette.coral600,
    primaryMuted: palette.coral100,
    accent: palette.amber400,
    accentHover: palette.amber500,
    accentMuted: palette.amber100,
    success: palette.success500,
    successMuted: palette.success700,
    warning: palette.warning500,
    warningMuted: palette.warning700,
    danger: palette.danger500,
    dangerMuted: palette.danger700,
    info: palette.info500,
  },
  border: {
    default: palette.neutral200,
    muted: palette.neutral100,
    strong: palette.neutral300,
    focus: palette.coral500,
  },
  card: {
    background: palette.neutral50,
    border: palette.neutral200,
    accent: palette.coral500,
  },
};
