import { palette } from '@/theme/palette';

const AVATAR_COLORS = [
  palette.coral500,
  palette.amber400,
  palette.success500,
  palette.info500,
  palette.danger500,
] as const;

export function avatarColorForSeed(seed: string | null): string {
  if (!seed) return palette.neutral600;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function avatarInitial(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase() || '?';
}

export function generateAvatarSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}
