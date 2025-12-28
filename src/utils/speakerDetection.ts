import { TranscriptionSegment } from '../types';

interface WhisperResult {
  text: string;
  chunks?: Array<{
    timestamp: [number, number | null];
    text: string;
  }>;
}

export async function analyzeSpeakers(
  audioBuffer: AudioBuffer,
  whisperResult: WhisperResult
): Promise<TranscriptionSegment[]> {
  const sampleRate = audioBuffer.sampleRate;
  const audioData = audioBuffer.getChannelData(0);

  const vadSegments = detectVoiceActivity(audioData, sampleRate);
  const pitchContours = extractPitchContour(audioData, sampleRate);
  const energyEnvelope = calculateEnergyEnvelope(audioData, sampleRate);

  const segments: TranscriptionSegment[] = [];
  let segmentId = 0;

  if (whisperResult.chunks && whisperResult.chunks.length > 0) {
    for (let i = 0; i < whisperResult.chunks.length; i++) {
      const chunk = whisperResult.chunks[i];
      const startTime = chunk.timestamp[0];
      const endTime = chunk.timestamp[1] ?? (startTime + 5);

      const speakerId = classifySpeaker(
        audioData,
        sampleRate,
        startTime,
        endTime,
        pitchContours,
        energyEnvelope
      );

      segments.push({
        id: segmentId++,
        start: startTime,
        end: endTime,
        text: chunk.text.trim(),
        speaker: `Speaker ${speakerId + 1}`,
        confidence: 0.85,
      });
    }
  } else {
    const mainSegment: TranscriptionSegment = {
      id: 0,
      start: 0,
      end: audioBuffer.duration,
      text: whisperResult.text,
      speaker: 'Speaker 1',
      confidence: 0.85,
    };
    segments.push(mainSegment);
  }

  return mergeAdjacentSegments(segments);
}

function detectVoiceActivity(audioData: Float32Array, sampleRate: number): boolean[] {
  const frameSize = 512;
  const hopSize = Math.floor(sampleRate / 100);
  const threshold = 0.02;
  const vad: boolean[] = [];

  let frameIndex = 0;
  while (frameIndex * hopSize < audioData.length) {
    const start = frameIndex * hopSize;
    const end = Math.min(start + frameSize, audioData.length);
    const frame = audioData.slice(start, end);

    const energy = Math.sqrt(
      frame.reduce((sum, val) => sum + val * val, 0) / frame.length
    );

    vad.push(energy > threshold);
    frameIndex++;
  }

  return vad;
}

function extractPitchContour(audioData: Float32Array, sampleRate: number): number[] {
  const frameSize = 2048;
  const hopSize = Math.floor(sampleRate / 100);
  const pitches: number[] = [];

  let frameIndex = 0;
  while (frameIndex * hopSize < audioData.length) {
    const start = frameIndex * hopSize;
    const end = Math.min(start + frameSize, audioData.length);
    const frame = audioData.slice(start, end);

    const pitch = estimatePitch(frame, sampleRate);
    pitches.push(pitch);
    frameIndex++;
  }

  return pitches;
}

function estimatePitch(frame: Float32Array, sampleRate: number): number {
  const fft = new Float32Array(frame.length);
  for (let i = 0; i < frame.length; i++) {
    fft[i] = frame[i];
  }

  const energy = Math.sqrt(fft.reduce((sum, val) => sum + val * val, 0) / fft.length);
  if (energy < 0.01) return 0;

  let maxValue = 0;
  let maxIndex = 0;

  for (let lag = Math.floor(sampleRate / 500); lag < Math.floor(sampleRate / 50); lag++) {
    let sum = 0;
    for (let i = 0; i < frame.length - lag; i++) {
      sum += Math.abs(frame[i] * frame[i + lag]);
    }
    if (sum > maxValue) {
      maxValue = sum;
      maxIndex = lag;
    }
  }

  if (maxIndex === 0) return 0;
  const pitch = sampleRate / maxIndex;
  return pitch > 50 && pitch < 400 ? pitch : 0;
}

function calculateEnergyEnvelope(audioData: Float32Array, sampleRate: number): number[] {
  const frameSize = 512;
  const hopSize = Math.floor(sampleRate / 100);
  const energy: number[] = [];

  let frameIndex = 0;
  while (frameIndex * hopSize < audioData.length) {
    const start = frameIndex * hopSize;
    const end = Math.min(start + frameSize, audioData.length);
    const frame = audioData.slice(start, end);

    const e = Math.sqrt(
      frame.reduce((sum, val) => sum + val * val, 0) / frame.length
    );
    energy.push(e);
    frameIndex++;
  }

  return energy;
}

function classifySpeaker(
  audioData: Float32Array,
  sampleRate: number,
  startTime: number,
  endTime: number,
  pitchContours: number[],
  energyEnvelope: number[]
): number {
  const hopSize = Math.floor(sampleRate / 100);
  const startFrame = Math.floor(startTime * 100);
  const endFrame = Math.floor(endTime * 100);

  let avgPitch = 0;
  let pitchCount = 0;
  let avgEnergy = 0;
  let energyCount = 0;

  for (let i = startFrame; i < Math.min(endFrame, pitchContours.length); i++) {
    if (pitchContours[i] > 0) {
      avgPitch += pitchContours[i];
      pitchCount++;
    }
  }

  for (let i = startFrame; i < Math.min(endFrame, energyEnvelope.length); i++) {
    avgEnergy += energyEnvelope[i];
    energyCount++;
  }

  if (pitchCount > 0) avgPitch /= pitchCount;
  if (energyCount > 0) avgEnergy /= energyCount;

  const pitchBand = avgPitch < 130 ? 0 : avgPitch < 160 ? 1 : 2;
  const energyBand = avgEnergy < 0.05 ? 0 : avgEnergy < 0.15 ? 1 : 2;

  return (pitchBand + energyBand) % 2;
}

function mergeAdjacentSegments(segments: TranscriptionSegment[]): TranscriptionSegment[] {
  if (segments.length === 0) return segments;

  const merged: TranscriptionSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];

    if (
      next.speaker === current.speaker &&
      Math.abs(next.start - current.end) < 1 &&
      current.text.length + next.text.length < 500
    ) {
      current.end = next.end;
      current.text = current.text + ' ' + next.text;
      current.confidence = (current.confidence + next.confidence) / 2;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
}
