import { useState } from 'react';
import { Upload, Music } from 'lucide-react';

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
}

export default function AudioUploader({ onFileSelect }: AudioUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
        isDragOver
          ? 'border-cyan-400 bg-cyan-500/10'
          : 'border-slate-600 bg-slate-700/50 hover:border-cyan-500/50'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-slate-600/50 rounded-full">
          <Music className="w-12 h-12 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Загрузите аудиофайл</h2>
          <p className="text-gray-400 mb-4">Поддерживаются форматы: MP3, WAV, OGG, WebM</p>
          <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg cursor-pointer transition duration-300">
            <Upload className="w-5 h-5" />
            Выбрать файл
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-gray-500 text-sm mt-4">или перетащите файл сюда</p>
      </div>
    </div>
  );
}
