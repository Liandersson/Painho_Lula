import type { AudioMode } from './preferences';

export interface AudioVariant {
  audioCodec: string | null;
  originalAudioId: string | null;
  audioBandwidth?: number | null;
  bandwidth: number;
}
export function codecPreference(opusSupported: boolean, mode: AudioMode): string[] {
  if (!opusSupported) return ['mp4a'];
  return mode === 'compatible' ? ['mp4a', 'opus'] : ['opus', 'mp4a'];
}

/** Compare bitrate within a codec; Opus and AAC bitrates are not quality-equivalent. */
export function selectAudioVariant<T extends AudioVariant>(
  variants: T[],
  codecs: string[],
  mode: AudioMode,
): T | undefined {
  const supported = variants.filter((t) => codecs.some((codec) => t.audioCodec?.startsWith(codec)));
  const clean = supported.filter((t) => !/drc/i.test(t.originalAudioId ?? ''));
  const candidates = clean.length ? clean : supported;
  for (const codec of codecs) {
    const matching = candidates.filter((t) => t.audioCodec?.startsWith(codec));
    if (!matching.length) continue;
    const bitrate = (t: T) => t.audioBandwidth ?? t.bandwidth;
    if (mode === 'data') {
      const economical = matching
        .filter((t) => bitrate(t) >= 48_000 && bitrate(t) <= 96_000)
        .sort((a, b) => bitrate(b) - bitrate(a));
      return economical[0] ?? matching.sort((a, b) => bitrate(a) - bitrate(b))[0];
    }
    return matching.sort((a, b) => bitrate(b) - bitrate(a))[0];
  }
  return undefined;
}
export const TV_BUFFERING = { bufferingGoal: 40, rebufferingGoal: 0.5, bufferBehind: 20 } as const;

/** Cut louder masters toward the provider reference. Never amplify quiet/unknown tracks. */
export function volumeCorrection(loudnessDb: number | null | undefined, enabled: boolean): number {
  if (!enabled || loudnessDb == null || !Number.isFinite(loudnessDb)) return 1;
  return 10 ** (-Math.min(30, Math.max(0, loudnessDb)) / 20);
}
