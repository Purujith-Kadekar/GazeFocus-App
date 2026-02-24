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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";

interface CustomVideoPlayerProps {
  videoId: string;
  duration: number;
  currentTime: number;
  title?: string;
  onTimeUpdate?: (seconds: number) => void;
  onStateChange?: (playing: boolean) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
  className?: string;
}

export function CustomVideoPlayer({
  videoId,
  duration,
  currentTime: syncTime,
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
  const [showCaptions, setShowCaptions] = useState(true);
  const [origin, setOrigin] = useState("");
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

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
        "relative w-full aspect-video bg-black overflow-hidden group select-none",
        isFullscreen ? "fixed inset-0 z-[9999] h-screen w-screen aspect-none" : "rounded-xl border border-white/10",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <iframe
          ref={iframeRef}
          className="w-full h-full"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{ border: "none" }}
        />
      </div>

      <div 
        className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center" 
        onClick={togglePlay}
      >
        {!isPlaying && (
          <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 text-white animate-pulse">
            <Play size={40} fill="currentColor" />
          </div>
        )}
      </div>

      <div
        className={cn(
          "absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-t from-black/95 via-transparent to-black/30 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="p-4 lg:p-6 flex items-center justify-between">
          <div className="text-white text-sm lg:text-base font-medium truncate max-w-[70%] drop-shadow-md">
            {title && <span>{title}</span>}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            className="text-white/80 hover:text-white text-xs font-display uppercase tracking-widest bg-black/40 hover:bg-black/60 border border-white/10 px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
          >
            Exit Player
          </button>
        </div>

        <div className="space-y-3 p-4 lg:p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div
            className="group/progress relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer transition-all hover:h-2"
            onClick={(e) => { e.stopPropagation(); handleProgressClick(e); }}
          >
            <div
              className="absolute inset-y-0 left-0 bg-red-600 rounded-full transition-all"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e) => { e.stopPropagation(); handleProgressChange(e); }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 lg:gap-5">
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="p-1.5 text-white hover:scale-110 transition-transform"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>

              <div className="flex items-center gap-2">
                {onPrevious && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPrevious(); }}
                    className="p-1 text-white/80 hover:text-white transition-colors"
                    title="Previous"
                  >
                    <SkipBack size={20} fill="currentColor" />
                  </button>
                )}

                {onNext && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="p-1 text-white/80 hover:text-white transition-colors"
                    title="Next"
                  >
                    <SkipForward size={20} fill="currentColor" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="p-1 text-white/80 hover:text-white transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                </button>
                <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-out">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => { e.stopPropagation(); handleVolumeChange(e); }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-1 bg-white/30 rounded-full accent-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-white/90 text-xs font-mono tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span className="text-white/40">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={(e) => { e.stopPropagation(); setShowCaptions(!showCaptions); }}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  showCaptions ? "text-white" : "text-white/40 hover:text-white/70"
                )}
                title="Captions"
              >
                <MessageCircle size={22} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); }}
                className="p-1.5 text-white/80 hover:text-white transition-all hover:rotate-45"
              >
                <Settings size={22} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}
                className="p-1.5 text-white/80 hover:text-white transition-transform hover:scale-110"
              >
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
