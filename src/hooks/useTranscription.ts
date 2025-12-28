import { useState } from 'react';
import { Transcription, TranscriptionSegment } from '../types';
import { transcribeAudio } from '../utils/transcription';
import { analyzeSpeakers } from '../utils/speakerDetection';

export function useTranscription() {
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processAudio = async (file: File) => {
    try {
      setError(null);
      setProgress(0);
      setIsProcessing(true);

      const audioBuffer = await getAudioBuffer(file);
      setProgress(20);

      const result = await transcribeAudio(audioBuffer, (p) => {
        setProgress(20 + p * 0.6);
      });

      setProgress(80);

      const segments = await analyzeSpeakers(audioBuffer, result);
      setProgress(100);

      setTranscription({
        segments,
        duration: audioBuffer.duration,
        language: 'en',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при транскрибации');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const getAudioBuffer = async (file: File): Promise<AudioBuffer> => {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return await audioContext.decodeAudioData(arrayBuffer);
  };

  const clearResults = () => {
    setTranscription(null);
    setError(null);
    setProgress(0);
  };

  return {
    transcription,
    isProcessing,
    progress,
    error,
    processAudio,
    clearResults,
  };
}
