import { useCallback, useState } from 'react';
import { Upload, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const DropZone = ({ onFileSelect, isProcessing }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  return (
    <div
      className={cn(
        "relative w-full max-w-2xl mx-auto",
        "min-h-[400px] rounded-3xl border-4 border-dashed",
        "transition-all duration-300 ease-out",
        "flex flex-col items-center justify-center gap-6 p-8",
        "cursor-pointer group",
        isDragging
          ? "border-primary bg-primary/5 scale-105 shadow-lg"
          : "border-muted-foreground/30 bg-card hover:border-primary/50 hover:bg-muted/30",
        isProcessing && "pointer-events-none opacity-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isProcessing && document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept="audio/*,.mp3,.m4a,.ogg,.wav,.opus"
        onChange={handleFileInput}
        className="hidden"
        disabled={isProcessing}
      />

      <div className={cn(
        "relative transition-transform duration-300",
        isDragging && "scale-110"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary blur-2xl opacity-20 rounded-full" />
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary p-1">
          <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
            {isDragging ? (
              <Upload className="w-16 h-16 text-primary animate-bounce" />
            ) : (
              <Mic className="w-16 h-16 text-primary transition-transform group-hover:scale-110" />
            )}
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">
          {isDragging ? 'Drop your audio file' : 'Drop your voice message here'}
        </h3>
        <p className="text-muted-foreground text-lg">
          or click to select a file
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Supports MP3, M4A, OGG, WAV, OPUS • Max 10MB
        </p>
      </div>
    </div>
  );
};

export default DropZone;
