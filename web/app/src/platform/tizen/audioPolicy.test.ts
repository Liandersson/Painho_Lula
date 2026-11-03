import { expect, it } from 'vitest';
import { codecPreference, selectAudioVariant, TV_BUFFERING } from './audioPolicy';
const audio = (codec: string, kbps: number, id: string) => ({
  audioCodec: codec,
  originalAudioId: id,
  audioBandwidth: kbps * 1000,
  bandwidth: kbps * 1000,
});
const formats = [
  audio('opus', 64, '250'),
  audio('opus', 140, '251'),
  audio('mp4a.40.2', 128, '140'),
  audio('mp4a.40.2', 256, '141'),
  audio('opus', 180, '251-drc'),
];
it('chooses the best supported non-DRC audio within the preferred codec', () => {
  expect(selectAudioVariant(formats, codecPreference(true, 'quality'), 'quality')?.originalAudioId).toBe('251');
  expect(selectAudioVariant(formats, codecPreference(false, 'quality'), 'quality')?.originalAudioId).toBe('141');
});
it('offers an AAC compatibility path without removing the Opus fallback', () => {
  expect(codecPreference(true, 'compatible')).toEqual(['mp4a', 'opus']);
  expect(selectAudioVariant(formats, codecPreference(true, 'compatible'), 'compatible')?.originalAudioId).toBe('141');
  expect(
    selectAudioVariant(
      formats.filter((t) => t.audioCodec === 'opus'),
      ['mp4a', 'opus'],
      'compatible',
    )?.originalAudioId,
  ).toBe('251');
});
it('uses an economical audio rendition, and falls back when the provider offers only one', () => {
  expect(selectAudioVariant(formats, ['opus', 'mp4a'], 'data')?.originalAudioId).toBe('250');
  expect(selectAudioVariant([formats[1]!], ['opus'], 'data')?.originalAudioId).toBe('251');
  expect(selectAudioVariant([], ['opus'], 'quality')).toBeUndefined();
});
it('retains playback if the provider offers only DRC and bounds TV buffering', () => {
  expect(selectAudioVariant([formats[4]!], ['opus'], 'quality')?.originalAudioId).toBe('251-drc');
  expect(TV_BUFFERING.bufferBehind).toBe(20);
  expect(TV_BUFFERING.rebufferingGoal).toBeGreaterThan(0);
});

it('levels loud masters by attenuation only, preserving quiet and unknown tracks', async () => {
  const { volumeCorrection } = await import('./audioPolicy');
  expect(volumeCorrection(6, true)).toBeCloseTo(0.501, 3);
  expect(volumeCorrection(-12, true)).toBe(1);
  expect(volumeCorrection(null, true)).toBe(1);
  expect(volumeCorrection(NaN, true)).toBe(1);
  expect(volumeCorrection(6, false)).toBe(1);
  expect(volumeCorrection(100, true)).toBeGreaterThan(0);
});

it('keeps supported AAC when the only uncompressed rendition uses an unsupported codec', () => {
  expect(
    selectAudioVariant([audio('opus', 140, '251'), audio('mp4a.40.2', 128, '140-drc')], ['mp4a'], 'quality')
      ?.originalAudioId,
  ).toBe('140-drc');
});
