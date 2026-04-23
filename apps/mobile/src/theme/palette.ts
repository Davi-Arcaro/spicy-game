// Hex literals NEVER appear in components. Only here.
export const palette = {
  coral50: '#FFF1EC',
  coral100: '#FFE0D4',
  coral200: '#FFBDA8',
  coral300: '#FF8F70',
  coral400: '#FF6B4A',
  coral500: '#E64528',
  coral600: '#B8341C',
  coral700: '#8C2414',
  coral800: '#5E170C',

  amber50: '#FFF8E8',
  amber100: '#FFEFC2',
  amber200: '#FFE088',
  amber300: '#FFCD4A',
  amber400: '#F2AF1F',
  amber500: '#C88A0F',
  amber600: '#8C5F08',

  neutral50: '#FAF6F4',
  neutral100: '#F2ECE8',
  neutral200: '#E2DAD4',
  neutral300: '#C7BBB3',
  neutral400: '#9C8B82',
  neutral500: '#6E5D55',
  neutral600: '#4A3E38',
  neutral700: '#332B27',
  neutral800: '#241E1B',
  neutral900: '#17120F',
  neutral950: '#0C0906',

  success500: '#3F9D5E',
  success700: '#2B6E42',
  warning500: '#E08B1C',
  warning700: '#9E5F12',
  danger500: '#C8364A',
  danger700: '#8E2434',
  info500: '#4A7C9C',
  info700: '#335B73',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type Palette = typeof palette;
