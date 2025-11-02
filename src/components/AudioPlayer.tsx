import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
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

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handlePlaybackRateChange = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
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

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'voice-message.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-lg p-6 space-y-4 sticky top-4 z-10">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Waveform / Progress Bar */}
      <div className="space-y-2">
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          className="relative h-16 bg-muted rounded-lg cursor-pointer overflow-hidden group"
        >
          {/* Progress fill */}
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary transition-all"
            style={{ width: `${progress}%` }}
          />
          
          {/* Waveform visualization (simplified bars) */}
          <div className="absolute inset-0 flex items-center justify-around px-1">
            {Array.from({ length: 60 }).map((_, i) => {
              const height = Math.random() * 60 + 20;
              const isPassed = (i / 60) * 100 < progress;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-colors",
                    isPassed ? "bg-white/40" : "bg-muted-foreground/20"
                  )}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          {/* Topic markers */}
          {topics.map((topic, index) => {
            const position = (topic.timestamp / duration) * 100;
            const isActive = activeTopicIndex === index;
            return (
              <div
                key={index}
                className={cn(
                  "absolute top-0 bottom-0 w-1 cursor-pointer transition-all group/marker",
                  isActive ? "bg-accent" : "bg-secondary/60 hover:bg-secondary"
                )}
                style={{ left: `${position}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTopicMarkerClick(topic.timestamp);
                }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded border border-border shadow-lg">
                    {topic.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Time display */}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Play/Pause */}
        <Button
          onClick={togglePlayPause}
          size="icon"
          className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-white" fill="white" />
          ) : (
            <Play className="h-5 w-5 text-white" fill="white" />
          )}
        </Button>

        {/* Playback speed */}
        <Button
          onClick={handlePlaybackRateChange}
          variant="outline"
          size="sm"
          className="font-semibold min-w-[60px]"
        >
          {playbackRate}x
        </Button>

        {/* Volume */}
        <div className="flex items-center gap-2 flex-1 max-w-[200px]">
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="icon"
            className="h-9 w-9"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.01}
            className="flex-1"
          />
        </div>

        {/* Download */}
        <Button
          onClick={handleDownload}
          variant="ghost"
          size="icon"
          className="h-9 w-9 ml-auto"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AudioPlayer;
