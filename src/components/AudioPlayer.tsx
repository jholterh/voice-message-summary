import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack } from 'lucide-react';
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
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
}

const PLAYBACK_RATES = [1, 1.25, 1.5, 1.75, 2, 2.5, 3] as const;
const SKIP_DURATION = 10; // seconds

// Throttle utility
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay);
    }
  };
}

const AudioPlayer = ({ 
  audioUrl, 
  topics, 
  onTopicClick, 
  onTimeUpdate, 
  onDurationChange 
}: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const previousVolumeRef = useRef(1);

  // Memoized active topic calculation
  const activeTopicIndex = useMemo(() => {
    const index = topics.findIndex((topic, idx) => {
      const nextTopic = topics[idx + 1];
      return currentTime >= topic.timestamp && 
             (!nextTopic || currentTime < nextTopic.timestamp);
    });
    return index >= 0 ? index : null;
  }, [currentTime, topics]);

  // Throttled time update callback
  const throttledTimeUpdate = useCallback(
    throttle((time: number) => {
      if (onTimeUpdate) {
        onTimeUpdate(time);
      }
    }, 100),
    [onTimeUpdate]
  );

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log('Metadata loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
      setError(null);
      if (onDurationChange) {
        onDurationChange(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
        throttledTimeUpdate(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.error('Audio error event:', e);
      const audioElement = e.target as HTMLAudioElement;
      
      if (audioElement.error) {
        console.error('Audio error details:', {
          code: audioElement.error.code,
          message: audioElement.error.message
        });
        
        switch (audioElement.error.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            setError('Network error while loading audio.');
            break;
          case MediaError.MEDIA_ERR_DECODE:
            setError('Error decoding audio file.');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setError('Audio format not supported by your browser.');
            break;
          default:
            setError('Error loading audio file.');
        }
        setIsLoading(false);
      }
    };

    const handleCanPlay = () => {
      console.log('Can play');
      setIsLoading(false);
      setError(null);
    };

    const handleLoadStart = () => {
      console.log('Load start');
      setIsLoading(true);
      setError(null);
    };

    const handlePlaying = () => {
      console.log('Playing');
      setIsLoading(false);
      setError(null);
    };

    const handleLoadedData = () => {
      console.log('Data loaded');
      setIsLoading(false);
    };

    const handleProgress = () => {
      console.log('Progress event');
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [isDragging, onDurationChange, throttledTimeUpdate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-SKIP_DURATION);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(SKIP_DURATION);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, volume, isMuted]);

  // Progress bar dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateProgressFromEvent(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateProgressFromEvent(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, duration]);

  const updateProgressFromEvent = (clientX: number) => {
    const audio = audioRef.current;
    const progressBar = progressBarRef.current;
    if (!audio || !progressBar || duration === 0) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('Toggle play/pause, currently playing:', isPlaying);

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Play successful');
            setIsPlaying(true);
            setError(null);
          })
          .catch((err) => {
            console.error('Play failed:', err);
            if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
              setError('Playback failed. ' + err.message);
            }
            setIsPlaying(false);
          });
      }
    }
  };

  const handleProgressInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    updateProgressFromEvent(clientX);
  };

  const handlePlaybackRateChange = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate as typeof PLAYBACK_RATES[number]);
    const nextRate = PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length];
    
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const volumeValue = newVolume[0];
    audio.volume = volumeValue;
    setVolume(volumeValue);
    
    if (volumeValue === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
      previousVolumeRef.current = volumeValue;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = previousVolumeRef.current;
      setVolume(previousVolumeRef.current);
      setIsMuted(false);
    } else {
      previousVolumeRef.current = volume;
      audio.volume = 0;
      setVolume(0);
      setIsMuted(true);
    }
  };

  const adjustVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    handleVolumeChange([newVolume]);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTopicMarkerClick = (timestamp: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = timestamp;
    setCurrentTime(timestamp);
    
    if (!isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error('Playback failed:', err);
          });
      }
    }

    if (onTopicClick) {
      onTopicClick(timestamp);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full space-y-3 sticky top-0 z-50 bg-background/98 backdrop-blur-md pb-4 pt-4 border-b border-border/40">
      {/* Simple audio element with src attribute */}
      <audio 
        ref={audioRef} 
        src={audioUrl}
        preload="metadata"
      />
      
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive flex items-center justify-between">
          <span>{error}</span>
          <Button
            onClick={() => {
              setError(null);
              const audio = audioRef.current;
              if (audio) {
                audio.load();
              }
            }}
            size="sm"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      )}
      
      {/* Compact Player */}
      <div className="bg-card rounded-lg border border-border p-4 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Skip Back Button */}
          <Button
            onClick={() => skip(-SKIP_DURATION)}
            size="icon"
            variant="ghost"
            className="h-9 w-9 flex-shrink-0"
            aria-label={`Skip back ${SKIP_DURATION} seconds`}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          {/* Play/Pause Button */}
          <Button
            onClick={togglePlayPause}
            size="icon"
            className="h-11 w-11 rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 flex-shrink-0 relative"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading && !isPlaying ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5 text-white" fill="white" />
            ) : (
              <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
            )}
          </Button>

          {/* Skip Forward Button */}
          <Button
            onClick={() => skip(SKIP_DURATION)}
            size="icon"
            variant="ghost"
            className="h-9 w-9 flex-shrink-0"
            aria-label={`Skip forward ${SKIP_DURATION} seconds`}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          {/* Progress Bar */}
          <div className="flex-1 space-y-1">
            <div
              ref={progressBarRef}
              onMouseDown={handleProgressInteraction}
              onTouchStart={handleProgressInteraction}
              className="relative h-2 bg-muted rounded-full cursor-pointer overflow-hidden group"
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
            >
              {/* Progress fill */}
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary transition-all"
                style={{ width: `${progress}%` }}
              />
              
              {/* Hover indicator */}
              <div 
                className="absolute inset-y-0 left-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ width: `${progress}%` }}
              />

              {/* Playhead */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
              />
              
              {/* Topic markers */}
              {topics.map((topic, index) => {
                const position = (topic.timestamp / duration) * 100;
                const isActive = activeTopicIndex === index;
                return (
                  <div
                    key={index}
                    className={cn(
                      "absolute top-0 bottom-0 w-0.5 cursor-pointer transition-all z-10",
                      isActive ? "bg-accent scale-y-150" : "bg-secondary/60 hover:bg-secondary hover:scale-y-125"
                    )}
                    style={{ left: `${position}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTopicMarkerClick(topic.timestamp);
                    }}
                    title={`${topic.name} - ${formatTime(topic.timestamp)}`}
                  />
                );
              })}
            </div>

            {/* Time display */}
            <div className="flex justify-between text-xs text-muted-foreground px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={toggleMute}
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.01}
              className="w-20 hidden sm:block"
              aria-label="Volume"
            />
          </div>

          {/* Playback speed */}
          <Button
            onClick={handlePlaybackRateChange}
            variant="outline"
            size="sm"
            className="font-semibold min-w-[60px] h-9 flex-shrink-0"
            aria-label={`Playback speed ${playbackRate}x`}
          >
            {playbackRate}x
          </Button>
        </div>
      </div>

      {/* Segments/Topics */}
      {topics.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3 text-foreground">Segments</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {topics.map((topic, index) => {
              const isActive = activeTopicIndex === index;
              return (
                <button
                  key={index}
                  onClick={() => handleTopicMarkerClick(topic.timestamp)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 text-left cursor-pointer group",
                    isActive 
                      ? "bg-primary/15 border border-primary/30 shadow-sm" 
                      : "hover:bg-muted/80 border border-transparent hover:border-border/50 hover:shadow-sm"
                  )}
                  aria-label={`Jump to ${topic.name} at ${formatTime(topic.timestamp)}`}
                >
                  <div className={cn(
                    "text-xs font-medium min-w-[50px] tabular-nums",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {formatTime(topic.timestamp)}
                  </div>
                  <div className={cn(
                    "text-sm flex-1 line-clamp-2",
                    isActive ? "text-foreground font-medium" : "text-foreground/80 group-hover:text-foreground"
                  )}>
                    {topic.name}
                  </div>
                  {isActive && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Helper (optional) */}
      <div className="text-xs text-muted-foreground text-center hidden sm:block">
        <span className="inline-flex items-center gap-4">
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">Space</kbd> Play/Pause</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">←/→</kbd> Skip</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">↑/↓</kbd> Volume</span>
          <span><kbd className="px-1.5 py-0.5 bg-muted rounded">M</kbd> Mute</span>
        </span>
      </div>
    </div>
  );
};

export default AudioPlayer;
