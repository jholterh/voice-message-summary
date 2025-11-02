import { useState } from 'react';
import { AudioWaveform } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DropZone from '@/components/DropZone';
import ProcessingState from '@/components/ProcessingState';
import ResultsDisplay from '@/components/ResultsDisplay';

type ProcessingStage = 'idle' | 'uploading' | 'transcribing' | 'summarizing';

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

const Index = () => {
  const { toast } = useToast();
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [results, setResults] = useState<{ summary: string; transcription: string; audioUrl?: string; words?: WordTimestamp[] } | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const validateFile = (file: File): boolean => {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload files under 10MB',
        variant: 'destructive',
      });
      return false;
    }

    // Check file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/wav', 'audio/opus', 'audio/webm'];
    const validExtensions = ['.mp3', '.m4a', '.ogg', '.wav', '.opus'];
    const isValidType = validTypes.some(type => file.type.includes(type)) || 
                       validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an audio file (MP3, M4A, OGG, WAV, OPUS)',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    setStage('uploading');
    setResults(null);
    setAudioFile(file);

    try {
      // Convert file to base64
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const base64Audio = reader.result as string;
          const base64Data = base64Audio.split(',')[1];

          // Step 1: Transcribe
          setStage('transcribing');
          const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('transcribe-audio', {
            body: { audio: base64Data }
          });

          if (transcriptionError) throw transcriptionError;
          if (!transcriptionData?.text) throw new Error('No transcription received');

          const transcription = transcriptionData.text;

          // Step 2: Summarize
          setStage('summarizing');
          const { data: summaryData, error: summaryError } = await supabase.functions.invoke('summarize-text', {
            body: { 
              text: transcriptionData.text,
              words: transcriptionData.words || []
            }
          });

          if (summaryError) throw summaryError;
          if (!summaryData?.summary) throw new Error('No summary received');

          // Create blob URL for audio playback
          const audioUrl = URL.createObjectURL(file);

          // Display results
          setResults({
            summary: summaryData.summary,
            transcription: transcriptionData.text,
            audioUrl: audioUrl,
            words: transcriptionData.words || [],
          });

          setStage('idle');

          toast({
            title: 'Success!',
            description: 'Your voice message has been processed',
          });

        } catch (error) {
          console.error('Processing error:', error);
          setStage('idle');
          
          toast({
            title: 'Processing failed',
            description: error instanceof Error ? error.message : 'Unable to process this audio. Please try another file',
            variant: 'destructive',
          });
        }
      };

      reader.onerror = () => {
        setStage('idle');
        toast({
          title: 'Error',
          description: 'Failed to read the file',
          variant: 'destructive',
        });
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('File handling error:', error);
      setStage('idle');
      
      toast({
        title: 'Error',
        description: 'Failed to process the file',
        variant: 'destructive',
      });
    }
  };

  const handleNewFile = () => {
    // Clean up the previous audio URL
    if (results?.audioUrl) {
      URL.revokeObjectURL(results.audioUrl);
    }
    setResults(null);
    setAudioFile(null);
    setStage('idle');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="w-full py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <AudioWaveform className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Voice Message Summarizer
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 pb-16">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Hero Section */}
          {stage === 'idle' && !results && (
            <div className="text-center space-y-4 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-5xl font-bold text-foreground leading-tight">
                Get instant text summaries<br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  of your voice messages
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Simply drag and drop your audio file to transcribe and summarize voice messages from WhatsApp, Telegram, or any other platform
              </p>
            </div>
          )}

          {/* Drop Zone */}
          {stage === 'idle' && !results && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <DropZone onFileSelect={handleFileSelect} isProcessing={false} />
            </div>
          )}

          {/* Processing State */}
          {stage !== 'idle' && !results && (
            <ProcessingState stage={stage as 'uploading' | 'transcribing' | 'summarizing'} />
          )}

          {/* Results */}
          {results && (
            <ResultsDisplay
              summary={results.summary}
              transcription={results.transcription}
              audioUrl={results.audioUrl}
              words={results.words}
              onNewFile={handleNewFile}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-4 mt-16 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Your audio is processed securely and deleted immediately after processing
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
