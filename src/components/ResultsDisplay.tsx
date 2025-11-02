import { useState } from 'react';
import { Check, Copy, FileText, Sparkles, Tag, CheckSquare, MessageSquare } from 'lucide-react';
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
  const [copiedTopics, setCopiedTopics] = useState(false);
  const [copiedTodos, setCopiedTodos] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const handleCopy = async (text: string, type: 'summary' | 'transcription' | 'topics' | 'todos' | 'response') => {
    await navigator.clipboard.writeText(text);
    if (type === 'summary') {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } else if (type === 'transcription') {
      setCopiedTranscription(true);
      setTimeout(() => setCopiedTranscription(false), 2000);
    } else if (type === 'topics') {
      setCopiedTopics(true);
      setTimeout(() => setCopiedTopics(false), 2000);
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Topics Section */}
      {sections.topics && (
        <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Topics</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(sections.topics, 'topics')}
              className="shrink-0 hover:bg-primary/10"
            >
              {copiedTopics ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {sections.topics}
          </div>
        </div>
      )}

      {/* Summary Section - Most Prominent */}
      {sections.summary && (
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
                onClick={() => handleCopy(sections.summary, 'summary')}
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
              {sections.summary}
            </p>
          </div>
        </div>
      )}

      {/* To-Dos Section */}
      {sections.todos && (
        <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Action Items</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(sections.todos, 'todos')}
              className="shrink-0 hover:bg-success/10"
            >
              {copiedTodos ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {sections.todos}
          </div>
        </div>
      )}

      {/* Suggested Response Section */}
      {sections.response && (
        <div className="bg-muted/50 rounded-2xl shadow-md p-6 border border-border/50">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Suggested Reply</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(sections.response, 'response')}
              className="shrink-0 hover:bg-secondary/10"
            >
              {copiedResponse ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed italic">
            {sections.response}
          </p>
        </div>
      )}

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
