import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { storage } from './storage';

export type SoundName =
  | 'rouletteTick'
  | 'rouletteEnd'
  | 'cardFlip'
  | 'tapSoft'
  | 'successChime';

// Optional sounds: missing files don't break the app, just no-op.
const sources: Partial<Record<SoundName, number>> = {
  // rouletteTick: require('../../assets/sounds/roulette-tick.mp3'),
  // rouletteEnd:  require('../../assets/sounds/roulette-end.mp3'),
  // cardFlip:     require('../../assets/sounds/card-flip.mp3'),
  // tapSoft:      require('../../assets/sounds/tap-soft.mp3'),
  // successChime: require('../../assets/sounds/success-chime.mp3'),
};

const cache = new Map<SoundName, AudioPlayer>();
let initialized = false;

export async function preloadSounds(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
    });
  } catch (err) {
    console.warn('[sounds] setAudioModeAsync failed', err);
    return;
  }

  for (const [name, source] of Object.entries(sources)) {
    if (!source) continue;
    try {
      const player = createAudioPlayer(source);
      player.volume = 0.7;
      cache.set(name as SoundName, player);
    } catch (err) {
      console.warn(`[sounds] failed to load ${name}`, err);
    }
  }
}

export async function playSound(name: SoundName): Promise<void> {
  const prefs = await storage.getPreferences();
  if (!prefs.soundEnabled) return;
  const player = cache.get(name);
  if (!player) return;
  try {
    await player.seekTo(0);
    player.play();
  } catch (err) {
    console.warn(`[sounds] failed to play ${name}`, err);
  }
}

export async function stopSound(name: SoundName): Promise<void> {
  const player = cache.get(name);
  if (!player) return;
  try {
    player.pause();
    await player.seekTo(0);
  } catch {}
}
