"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  MessageCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";

interface Quality {
  label: string;
  value: string;
}

interface CustomVideoPlayerProps {
  videoId: string;
  duration: number;
  currentTime: number; // Added currentTime prop
  title?: string;
  onTimeUpdate?: (seconds: number) => void;
  onStateChange?: (playing: boolean) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
  className?: string;
}

const AVAILABLE_QUALITIES: Quality[] = [
  { label: "Auto", value: "auto" },
  { label: "1080p", value: "1080p" },
  { label: "720p", value: "720p" },
  { label: "480p", value: "480p" },
  { label: "360p", value: "360p" },
];

export function CustomVideoPlayer({
  videoId,
  duration,
  currentTime: syncTime, // Use syncTime as a name for the prop
  title,
  onTimeUpdate,
  onStateChange,
  onNext,
  onPrevious,
  onClose,
  className,
}: CustomVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("auto");
  const [showCaptions, setShowCaptions] = useState(true);
  const [origin, setOrigin] = useState(""); // Track origin for YouTube embed
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Sync internal currentTime with parent's syncTime
  useEffect(() => {
    setCurrentTime(syncTime);
  }, [syncTime]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showQualityMenu) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying, showQualityMenu]);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    onStateChange?.(nextPlaying);
  }, [isPlaying, onStateChange]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    onTimeUpdate?.(val);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    setCurrentTime(newTime);
    onTimeUpdate?.(newTime);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?fs=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&cc_load_policy=${showCaptions ? 1 : 0}${origin ? `&origin=${origin}` : ""}`;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black w-full h-full overflow-hidden group",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* YouTube Iframe */}
      <iframe
        ref={iframeRef}
        className="w-full h-full"
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: "none" }}
      />

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-black/20 transition-opacity duration-200",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Top Bar */}
        <div className="p-4 flex items-center justify-between">
          <div className="text-white text-sm font-medium truncate">
            {title && <span>{title}</span>}
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xs uppercase tracking-wider bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded transition-colors"
          >
            Close
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="space-y-2 p-4">
          {/* Progress Bar */}
          <div
            className="group/progress flex items-center gap-2 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div className="flex-1 relative h-1 bg-white/20 rounded-full overflow-hidden hover:h-2 transition-all">
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={handleProgressChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-white text-xs whitespace-nowrap font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-2 rounded hover:bg-white/20 transition-colors text-white"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              {/* Skip Previous */}
              {onPrevious && (
                <button
                  onClick={onPrevious}
                  className="p-2 rounded hover:bg-white/20 transition-colors text-white"
                  title="Previous"
                >
                  <SkipBack size={20} />
                </button>
              )}

              {/* Skip Next */}
              {onNext && (
                <button
                  onClick={onNext}
                  className="p-2 rounded hover:bg-white/20 transition-colors text-white"
                  title="Next"
                >
                  <SkipForward size={20} />
                </button>
              )}

              {/* Volume Control */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded hover:bg-white/20 transition-colors text-white"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/30 rounded-full accent-red-500 cursor-pointer"
                  title="Volume"
                />
              </div>

              {/* Duration */}
              <div className="flex items-center gap-1.5 text-white text-xs ml-2">
                <Clock size={16} />
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Captions */}
              <button
                onClick={() => setShowCaptions(!showCaptions)}
                className={cn(
                  "p-2 rounded transition-colors",
                  showCaptions
                    ? "bg-white/30 text-white"
                    : "hover:bg-white/20 text-white/60"
                )}
                title={showCaptions ? "Hide Captions" : "Show Captions"}
              >
                <MessageCircle size={20} />
              </button>

              {/* Quality Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="p-2 rounded hover:bg-white/20 transition-colors text-white text-xs font-medium uppercase tracking-wider"
                  title="Quality"
                >
                  <Settings size={20} />
                </button>
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 border border-white/20 rounded-lg overflow-hidden z-50">
                    {AVAILABLE_QUALITIES.map((q) => (
                      <button
                        key={q.value}
                        onClick={() => {
                          setSelectedQuality(q.value);
                          setShowQualityMenu(false);
                        }}
                        className={cn(
                          "block w-full px-4 py-2 text-left text-sm transition-colors",
                          selectedQuality === q.value
                            ? "bg-red-500 text-white"
                            : "text-white/80 hover:bg-white/10"
                        )}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={handleFullscreen}
                className="p-2 rounded hover:bg-white/20 transition-colors text-white"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
