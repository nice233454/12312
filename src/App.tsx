import { useState, useEffect } from 'react';
import { Upload, Loader, Download, Trash2 } from 'lucide-react';
import AudioUploader from './components/AudioUploader';
import TranscriptionResults from './components/TranscriptionResults';
import { useTranscription } from './hooks/useTranscription';
import { pipeline } from '@xenova/transformers';

function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { transcription, isProcessing, progress, error, processAudio, clearResults } = useTranscription();

  useEffect(() => {
    const initializeModels = async () => {
      try {
        setIsLoading(true);
        await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
        setIsLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки моделей:', err);
        setIsLoading(false);
      }
    };
    initializeModels();
  }, []);

  const handleFileSelect = async (file: File) => {
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  const handleTranscribe = async () => {
    if (!audioFile) return;
    await processAudio(audioFile);
  };

  const handleClear = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFile(null);
    setAudioUrl('');
    clearResults();
  };

  const downloadTranscription = () => {
    if (!transcription) return;

    const text = transcription.segments
      .map(seg => `[${formatTime(seg.start)} - ${formatTime(seg.end)}] ${seg.speaker}: ${seg.text}`)
      .join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `transcription_${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Upload className="w-10 h-10 text-blue-400" />
            <h1 className="text-5xl font-bold text-white">TranscribeAI</h1>
          </div>
          <p className="text-gray-400 text-lg">Транскрибация аудио с диаризацией - полностью офлайн</p>
        </header>

        {isLoading && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-slate-700 rounded-lg p-8 border border-slate-600 text-center">
              <Loader className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-white">Загрузка моделей распознавания речи...</p>
              <p className="text-gray-400 text-sm mt-2">Это может занять некоторое время при первом запуске</p>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-8">
          {!audioFile ? (
            <AudioUploader onFileSelect={handleFileSelect} disabled={isLoading} />
          ) : (
            <div className="bg-slate-700 rounded-lg p-8 border border-slate-600">
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold mb-2">Выбранный файл</h3>
                  <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg">
                    <div>
                      <p className="text-white">{audioFile.name}</p>
                      <p className="text-gray-400 text-sm">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={handleClear}
                      className="p-2 hover:bg-red-600/20 rounded-lg transition text-red-400"
                      disabled={isProcessing}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {isProcessing ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Loader className="w-5 h-5 text-blue-400 animate-spin" />
                      <p className="text-white">Транскрибация в процессе...</p>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-gray-400 text-sm">{progress}%</p>
                  </div>
                ) : (
                  <button
                    onClick={handleTranscribe}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition duration-300"
                  >
                    Начать транскрибацию
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {transcription && (
            <>
              <TranscriptionResults transcription={transcription} formatTime={formatTime} />

              <div className="flex gap-4">
                <button
                  onClick={downloadTranscription}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                >
                  <Download className="w-5 h-5" />
                  Скачать текст
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                >
                  Загрузить новый файл
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
