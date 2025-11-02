import { useState } from 'react';
import { Check, Copy, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResultsDisplayProps {
  summary: string;
  transcription: string;
  onNewFile: () => void;
}

const ResultsDisplay = ({ summary, transcription, onNewFile }: ResultsDisplayProps) => {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedTranscription, setCopiedTranscription] = useState(false);

  const handleCopy = async (text: string, type: 'summary' | 'transcription') => {
    await navigator.clipboard.writeText(text);
    if (type === 'summary') {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } else {
      setCopiedTranscription(true);
      setTimeout(() => setCopiedTranscription(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Card - Prominent */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary blur-xl opacity-20 rounded-3xl" />
        <div className="relative bg-card rounded-3xl shadow-xl p-8 border border-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Summary</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(summary, 'summary')}
              className="shrink-0 hover:bg-primary/10"
            >
              {copiedSummary ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-lg text-foreground leading-relaxed">
            {summary}
          </p>
        </div>
      </div>

      {/* Full Transcription Card - Secondary */}
      <div className="bg-card rounded-3xl shadow-lg p-8 border border-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Full Transcription</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCopy(transcription, 'transcription')}
            className="shrink-0 hover:bg-muted"
          >
            {copiedTranscription ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </Button>
        </div>
        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {transcription}
          </p>
        </div>
      </div>

      {/* Process Another Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onNewFile}
          size="lg"
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-8 py-6 text-lg rounded-2xl shadow-lg"
        >
          Process Another Voice Message
        </Button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </div>
  );
};

export default ResultsDisplay;
