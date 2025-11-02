import { useState, useRef, useEffect } from 'react';
import { Check, Copy, FileText, Sparkles, CheckSquare, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AudioPlayer from '@/components/AudioPlayer';

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface ResultsDisplayProps {
  summary: string;
  transcription: string;
  audioUrl?: string;
  words?: WordTimestamp[];
  onNewFile: () => void;
}

interface ParsedTopic {
  name: string;
  timestamp: number;
}

const ResultsDisplay = ({ summary, transcription, audioUrl, words = [], onNewFile }: ResultsDisplayProps) => {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedTranscription, setCopiedTranscription] = useState(false);
  const [copiedTodos, setCopiedTodos] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioPlayerRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLSpanElement>(null);

  const handleCopy = async (text: string, type: 'summary' | 'transcription' | 'todos' | 'response') => {
    await navigator.clipboard.writeText(text);
    if (type === 'summary') {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } else if (type === 'transcription') {
      setCopiedTranscription(true);
      setTimeout(() => setCopiedTranscription(false), 2000);
    } else if (type === 'todos') {
      setCopiedTodos(true);
      setTimeout(() => setCopiedTodos(false), 2000);
    } else if (type === 'response') {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  // Parse the structured summary
  const sections = {
    topics: '',
    summary: '',
    todos: '',
    response: ''
  };

  const topicsMatch = summary.match(/\*\*Topics:\*\*(.*?)(?=\*\*|$)/s);
  const summaryMatch = summary.match(/\*\*Summary:\*\*(.*?)(?=\*\*|$)/s);
  const todosMatch = summary.match(/\*\*To-Dos:\*\*(.*?)(?=\*\*|$)/s);
  const responseMatch = summary.match(/\*\*Suggested Response:\*\*(.*?)(?=\*\*|$)/s);

  if (topicsMatch) sections.topics = topicsMatch[1].trim();
  if (summaryMatch) sections.summary = summaryMatch[1].trim();
  if (todosMatch) sections.todos = todosMatch[1].trim();
  if (responseMatch) sections.response = responseMatch[1].trim();

  // Parse topics with timestamps and validate against audio duration
  const parsedTopics: ParsedTopic[] = [];
  if (sections.topics) {
    const topicLines = sections.topics.split('\n').filter(line => line.trim().startsWith('-'));
    topicLines.forEach(line => {
      const match = line.match(/- (.+?) \[(\d+):(\d+)\]/);
      if (match) {
        const [, name, minutes, seconds] = match;
        const timestamp = parseInt(minutes) * 60 + parseInt(seconds);
        // Only add topics with valid timestamps (less than audio duration or if duration unknown)
        if (audioDuration === 0 || timestamp < audioDuration) {
          parsedTopics.push({ name, timestamp });
        }
      }
    });
  }

  const handleTopicClick = (timestamp: number) => {
    // Scroll to audio player if not visible
    if (audioPlayerRef.current) {
      audioPlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAudioTimeUpdate = (time: number) => {
    setCurrentAudioTime(time);
  };

  const handleAudioDurationChange = (duration: number) => {
    setAudioDuration(duration);
  };

  // Find the current word being spoken
  const getCurrentWordIndex = () => {
    if (!words.length) return -1;
    return words.findIndex((word, index) => {
      const nextWord = words[index + 1];
      return currentAudioTime >= word.start && (!nextWord || currentAudioTime < nextWord.start);
    });
  };

  const currentWordIndex = getCurrentWordIndex();

  // Auto-scroll to current word in transcript
  useEffect(() => {
    if (currentWordRef.current && transcriptRef.current) {
      const wordElement = currentWordRef.current;
      const containerElement = transcriptRef.current;
      
      // Check if word is visible in container
      const wordRect = wordElement.getBoundingClientRect();
      const containerRect = containerElement.getBoundingClientRect();
      
      if (wordRect.top < containerRect.top || wordRect.bottom > containerRect.bottom) {
        wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentWordIndex]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Audio Player */}
      {audioUrl && parsedTopics.length > 0 && (
        <div ref={audioPlayerRef}>
          <AudioPlayer 
            audioUrl={audioUrl} 
            topics={parsedTopics}
            onTopicClick={handleTopicClick}
            onTimeUpdate={handleAudioTimeUpdate}
            onDurationChange={handleAudioDurationChange}
          />
        </div>
      )}


      {/* Summary Section - Most Prominent */}
      {sections.summary && (
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl opacity-30 rounded-3xl" />
          <div className="relative bg-card rounded-2xl shadow-xl p-7 border border-border/50">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5.5 h-5.5 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Summary
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(sections.summary, 'summary')}
                className="shrink-0 h-9 w-9 hover:bg-primary/10 transition-colors"
              >
                {copiedSummary ? (
                  <Check className="w-4.5 h-4.5 text-success" />
                ) : (
                  <Copy className="w-4.5 h-4.5 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-base text-foreground leading-relaxed">
              {sections.summary}
            </p>
          </div>
        </div>
      )}

      {/* To-Dos Section */}
      {sections.todos && (
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckSquare className="w-4.5 h-4.5 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Action Items</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(sections.todos, 'todos')}
              className="shrink-0 h-9 w-9 hover:bg-success/10 transition-colors"
            >
              {copiedTodos ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {sections.todos}
          </div>
        </div>
      )}

      {/* Suggested Response Section */}
      {sections.response && (
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                <MessageSquare className="w-4.5 h-4.5 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Suggested Reply</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(sections.response, 'response')}
              className="shrink-0 h-9 w-9 hover:bg-secondary/10 transition-colors"
            >
              {copiedResponse ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {sections.response}
          </p>
        </div>
      )}

      {/* Full Transcription Card */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Full Transcription</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCopy(transcription, 'transcription')}
            className="shrink-0 h-9 w-9 hover:bg-muted transition-colors"
          >
            {copiedTranscription ? (
              <Check className="w-4.5 h-4.5 text-success" />
            ) : (
              <Copy className="w-4.5 h-4.5 text-muted-foreground" />
            )}
          </Button>
        </div>
        <div ref={transcriptRef} className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {words.length > 0 ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {words.map((word, index) => (
                <span
                  key={index}
                  ref={index === currentWordIndex ? currentWordRef : null}
                  className={cn(
                    "transition-colors duration-150",
                    index === currentWordIndex && "bg-primary/20 text-primary font-medium px-0.5 rounded"
                  )}
                >
                  {word.word}{' '}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {transcription}
            </p>
          )}
        </div>
      </div>

      {/* Process Another Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={onNewFile}
          size="lg"
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-8 py-3 text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          Process Another Voice Message
        </Button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </div>
  );
};

export default ResultsDisplay;
