export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker: string;
  confidence: number;
}

export interface Transcription {
  segments: TranscriptionSegment[];
  duration: number;
  language: string;
}

export interface AudioAnalysis {
  vad: boolean[];
  frequency: Float32Array;
  energy: number[];
  pitches: number[];
}
