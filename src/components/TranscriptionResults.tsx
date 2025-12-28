import { Transcription } from '../types';

interface TranscriptionResultsProps {
  transcription: Transcription;
  formatTime: (seconds: number) => string;
}

export default function TranscriptionResults({
  transcription,
  formatTime,
}: TranscriptionResultsProps) {
  const speakerColors: { [key: string]: string } = {
    'Speaker 1': 'text-blue-300',
    'Speaker 2': 'text-green-300',
    'Speaker 3': 'text-amber-300',
    'Speaker 4': 'text-pink-300',
  };

  const bgColors: { [key: string]: string } = {
    'Speaker 1': 'bg-blue-500/10',
    'Speaker 2': 'bg-green-500/10',
    'Speaker 3': 'bg-amber-500/10',
    'Speaker 4': 'bg-pink-500/10',
  };

  return (
    <div className="bg-slate-700 rounded-lg p-8 border border-slate-600">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Результат транскрибации</h2>
        <p className="text-gray-400">{transcription.segments.length} сегментов</p>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        {transcription.segments.map((segment, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border border-slate-600 ${
              bgColors[segment.speaker] || 'bg-slate-800'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-600">
                  <span className={`font-semibold ${speakerColors[segment.speaker] || 'text-gray-300'}`}>
                    {segment.speaker}
                  </span>
                </span>
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-sm mb-2">
                  [{formatTime(segment.start)} - {formatTime(segment.end)}]
                </p>
                <p className="text-white leading-relaxed">{segment.text}</p>
                <p className="text-gray-500 text-xs mt-2">
                  Уверенность: {(segment.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
