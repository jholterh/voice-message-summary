import { Loader2, AudioWaveform } from 'lucide-react';

interface ProcessingStateProps {
  stage: 'uploading' | 'transcribing' | 'summarizing';
}

const ProcessingState = ({ stage }: ProcessingStateProps) => {
  const messages = {
    uploading: 'Uploading your audio...',
    transcribing: 'Transcribing voice message...',
    summarizing: 'Creating summary...',
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-3xl shadow-lg p-12 border border-border">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary blur-2xl opacity-30 rounded-full animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary p-1">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <AudioWaveform className="w-12 h-12 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <h3 className="text-2xl font-bold text-foreground">
                {messages[stage]}
              </h3>
            </div>
            <p className="text-muted-foreground">
              This may take a few moments
            </p>
          </div>

          <div className="w-full max-w-xs">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 ease-out animate-pulse"
                style={{ 
                  width: stage === 'uploading' ? '33%' : stage === 'transcribing' ? '66%' : '100%' 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingState;
