import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Topic {
  name: string;
  timestamp: number; // in seconds
}

interface AudioPlayerProps {
  audioUrl: string;
  topics: Topic[];
  onTopicClick?: (timestamp: number) => void;
}

const AudioPlayer = ({ audioUrl, topics, onTopicClick }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activeTopicIndex, setActiveTopicIndex] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Update active topic based on current time
      const currentTopicIndex = topics.findIndex((topic, index) => {
        const nextTopic = topics[index + 1];
        return audio.currentTime >= topic.timestamp && 
               (!nextTopic || audio.currentTime < nextTopic.timestamp);
      });
      setActiveTopicIndex(currentTopicIndex >= 0 ? currentTopicIndex : null);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [topics]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressBarRef.current;
    if (!audio || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePlaybackRateChange = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const rates = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleTopicMarkerClick = (timestamp: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = timestamp;
    setCurrentTime(timestamp);
    
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }

    if (onTopicClick) {
      onTopicClick(timestamp);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full space-y-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Compact Player */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <Button
            onClick={togglePlayPause}
            size="icon"
            className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-white" fill="white" />
            ) : (
              <Play className="h-4 w-4 text-white ml-0.5" fill="white" />
            )}
          </Button>

          {/* Progress Bar */}
          <div className="flex-1 space-y-1">
            <div
              ref={progressBarRef}
              onClick={handleProgressClick}
              className="relative h-1.5 bg-muted rounded-full cursor-pointer overflow-hidden group"
            >
              {/* Progress fill */}
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary transition-all"
                style={{ width: `${progress}%` }}
              />
              
              {/* Topic markers */}
              {topics.map((topic, index) => {
                const position = (topic.timestamp / duration) * 100;
                const isActive = activeTopicIndex === index;
                return (
                  <div
                    key={index}
                    className={cn(
                      "absolute top-0 bottom-0 w-0.5 cursor-pointer transition-all",
                      isActive ? "bg-accent" : "bg-secondary/60 hover:bg-secondary"
                    )}
                    style={{ left: `${position}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTopicMarkerClick(topic.timestamp);
                    }}
                  />
                );
              })}
            </div>

            {/* Time display */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback speed */}
          <Button
            onClick={handlePlaybackRateChange}
            variant="outline"
            size="sm"
            className="font-semibold min-w-[55px] h-8 flex-shrink-0"
          >
            {playbackRate}x
          </Button>
        </div>
      </div>

      {/* Segments/Topics */}
      {topics.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3 text-foreground">Segments</h3>
          <div className="space-y-2">
            {topics.map((topic, index) => {
              const isActive = activeTopicIndex === index;
              return (
                <button
                  key={index}
                  onClick={() => handleTopicMarkerClick(topic.timestamp)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left",
                    isActive 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "text-xs font-medium min-w-[45px]",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {formatTime(topic.timestamp)}
                  </div>
                  <div className={cn(
                    "text-sm flex-1",
                    isActive ? "text-foreground font-medium" : "text-foreground/80"
                  )}>
                    {topic.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
