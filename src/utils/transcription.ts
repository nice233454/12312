import { pipeline, AutomaticSpeechRecognitionPipeline } from '@xenova/transformers';

let transcriptionPipeline: AutomaticSpeechRecognitionPipeline | null = null;

async function getTranscriptionPipeline() {
  if (!transcriptionPipeline) {
    transcriptionPipeline = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny'
    ) as AutomaticSpeechRecognitionPipeline;
  }
  return transcriptionPipeline;
}

export async function transcribeAudio(
  audioBuffer: AudioBuffer,
  onProgress?: (progress: number) => void
) {
  const pipeline = await getTranscriptionPipeline();

  const audioData = audioBuffer.getChannelData(0);

  onProgress?.(0.3);

  const result = await pipeline(audioData, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: true,
  });

  onProgress?.(1);

  return result;
}

export function processAudioChunks(
  audioBuffer: AudioBuffer,
  chunkDuration: number = 30
): { data: Float32Array; timestamp: number }[] {
  const sampleRate = audioBuffer.sampleRate;
  const chunkSamples = chunkDuration * sampleRate;
  const audioData = audioBuffer.getChannelData(0);
  const chunks: { data: Float32Array; timestamp: number }[] = [];

  for (let i = 0; i < audioData.length; i += chunkSamples) {
    const chunk = audioData.slice(i, Math.min(i + chunkSamples, audioData.length));
    const timestamp = i / sampleRate;
    chunks.push({
      data: chunk,
      timestamp,
    });
  }

  return chunks;
}
