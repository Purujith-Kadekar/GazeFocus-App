"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";
import { useStore } from "@/stores/useStore";
import { useGazeDetection } from "@/hooks/useGazeDetection";
import { useInactivityAlert } from "@/hooks/useInactivityAlert";
import { BreakOverlay } from "./BreakOverlay";
import { InactivityAlert } from "./InactivityAlert";
import { formatDuration } from "@/lib/youtube";
import { 
  Eye, 
  EyeOff, 
  Maximize2, 
  Minimize2,
  SkipBack, 
  SkipForward, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Captions,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  className?: string;
}

export function VideoPlayer({ className }: VideoPlayerProps) {
  const {
    currentVideo,
    setActiveView,
    activePlaylistVideos,
    setCurrentVideo,
    isPlaying,
    isOnBreak,
    settings,
    setIsPlaying,
    currentTimeSeconds,
    setCurrentTime,
    durationSeconds,
    setDuration,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    triggerBreak,
    endBreak,
    checkMilestone,
    updateMilestones,
    milestones,
  } = useStore();

  const playerRef = useRef<YouTubePlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  
  const [inactivityPaused, setInactivityPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>("auto");
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ─── Gaze Callbacks ────────────────────────────────────────────────────────

  const handleGazeAway = useCallback(() => {
    if (playerRef.current && isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  }, [isPlaying, setIsPlaying]);

  const handleGazeReturn = useCallback(() => {
    if (playerRef.current && !isOnBreak && !inactivityPaused) {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  }, [isOnBreak, inactivityPaused, setIsPlaying]);

  // ─── Inactivity Callbacks ──────────────────────────────────────────────────

  const handleInactive = useCallback(() => {
    setInactivityPaused(true);
    if (playerRef.current) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  const handleReturn = useCallback(() => {
    setInactivityPaused(false);
  }, []);

  // ─── Gaze Hook ─────────────────────────────────────────────────────────────

  useGazeDetection({
    videoRef: webcamRef,
    onGazeAway: handleGazeAway,
    onGazeReturn: handleGazeReturn,
    enabled: settings.gazeEnabled && !!currentVideo,
  });

  // ─── Inactivity Hook ───────────────────────────────────────────────────────

  useInactivityAlert({
    onInactive: handleInactive,
    onReturn: handleReturn,
  });

  // ─── YouTube Player Events ─────────────────────────────────────────────────

  const onPlayerReady = useCallback(
    (event: YouTubeEvent) => {
      playerRef.current = event.target;
      const duration = event.target.getDuration();
      setDuration(duration);
      event.target.setVolume(isMuted ? 0 : volume);

      // Quality
      const levels = event.target.getAvailableQualityLevels();
      setAvailableQualities(levels);

      if (currentVideo) {
        updateMilestones(duration || currentVideo.durationSeconds);
      }
    },
    [currentVideo, updateMilestones, setDuration, volume, isMuted]
  );

  const onStateChange = useCallback(
    (event: YouTubeEvent) => {
      const state = event.data;
      // 1 = playing, 2 = paused
      setIsPlaying(state === 1);
      if (state === 1) {
        const dur = event.target.getDuration();
        if (dur) setDuration(dur);
      }
    },
    [setIsPlaying, setDuration]
  );

  // ─── Time Tracking ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(async () => {
      if (!playerRef.current) return;
      try {
        const time = await playerRef.current.getCurrentTime();
        setCurrentTime(time);
        const shouldBreak = checkMilestone(time);
        if (shouldBreak) {
          playerRef.current.pauseVideo();
          triggerBreak();
        }
      } catch {}
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime, checkMilestone, triggerBreak]);

  // ─── Controls Visibility ───────────────────────────────────────────────────

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    } else {
      resetControlsTimer();
    }
  }, [isPlaying, resetControlsTimer]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleBreakEnd = useCallback(() => {
    endBreak();
    if (playerRef.current) {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  }, [endBreak, setIsPlaying]);

  const handleNextVideo = useCallback(() => {
    if (!currentVideo || activePlaylistVideos.length === 0) return;
    const currentIndex = activePlaylistVideos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex !== -1 && currentIndex < activePlaylistVideos.length - 1) {
      setCurrentVideo(activePlaylistVideos[currentIndex + 1]);
    }
  }, [currentVideo, activePlaylistVideos, setCurrentVideo]);

  const handlePrevVideo = useCallback(() => {
    if (!currentVideo || activePlaylistVideos.length === 0) return;
    const currentIndex = activePlaylistVideos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex > 0) {
      setCurrentVideo(activePlaylistVideos[currentIndex - 1]);
    }
  }, [currentVideo, activePlaylistVideos, setCurrentVideo]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (playerRef.current) {
      playerRef.current.setVolume(newMuted ? 0 : volume);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRateState(rate);
    if (playerRef.current) playerRef.current.setPlaybackRate(rate);
  };

  const handleQualityChange = (quality: string) => {
    setCurrentQuality(quality);
    if (playerRef.current) playerRef.current.setPlaybackQuality(quality);
  };

  const toggleCaptions = () => {
    if (!playerRef.current) return;
    const next = !captionsEnabled;
    setCaptionsEnabled(next);
    if (next) {
      playerRef.current.loadModule("captions");
      playerRef.current.setOption("captions", "track", { languageCode: "en" });
    } else {
      playerRef.current.unloadModule("captions");
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleClosePlayer = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    setCurrentVideo(null);
    setIsPlaying(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!currentVideo) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full text-muted", className)}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-4">
             <Play size={32} className="ml-1 opacity-50" />
          </div>
          <p className="font-display font-medium text-lg text-foreground">
            No video selected
          </p>
          <p className="text-sm opacity-60">Select a video from your library to focus</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative group/player bg-black h-full overflow-hidden flex flex-col font-sans select-none", className)}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Hidden webcam for gaze tracking */}
      <video
        ref={webcamRef}
        autoPlay
        muted
        playsInline
        className="absolute opacity-0 pointer-events-none w-px h-px" 
        aria-hidden="true"
      />

      {/* Main Video Layer */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        <YouTube
          videoId={currentVideo.id}
          className="w-full h-full"
          iframeClassName="w-full h-full"
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 1,
              controls: 0,
              rel: 0,
              modestbranding: 1,
              fs: 0,
              cc_load_policy: 1,
              disablekb: 1,
              playsinline: 1,
            },
          }}
          onReady={onPlayerReady}
          onStateChange={onStateChange}
          onEnd={handleNextVideo}
        />
      </div>

      {/* Click Mask for Play/Pause */}
      <div 
        className="absolute inset-0 z-10"
        onClick={togglePlay} 
        onDoubleClick={toggleFullscreen}
      />

      {/* Overlays: Break & Inactivity (Higher Z) */}
      {isOnBreak && <BreakOverlay milestones={milestones} onBreakEnd={handleBreakEnd} />}
      {inactivityPaused && <InactivityAlert onDismiss={() => { setInactivityPaused(false); playerRef.current?.playVideo(); }} />}

      {/* Custom Controls UI */}
      <div
        className={cn(
          "absolute inset-0 z-20 flex flex-col justify-between pointer-events-none transition-opacity duration-300",
          !showControls ? "opacity-0" : "opacity-100"
        )}
      >
        {/* Top Gradient */}
        <div className="h-24 bg-gradient-to-b from-black/80 to-transparent p-6 flex items-start justify-between pointer-events-auto">
          <button 
            onClick={() => setActiveView("player")} 
            className="text-white/80 hover:text-white transition-colors flex items-center gap-2 group"
          >
            <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-sm">
               <ChevronLeft size={20} />
            </div>
          </button>
          
          <div className="text-center max-w-lg px-4 hidden md:block">
            <h2 className="text-white font-medium text-shadow-sm truncate">{currentVideo.title}</h2>
            <p className="text-white/60 text-xs mt-1">{currentVideo.channelTitle}</p>
          </div>

          <button 
             onClick={handleClosePlayer}
             className="text-white/60 hover:text-red-400 transition-colors p-2 font-medium text-xs tracking-wider uppercase"
          >
             Close
          </button>
        </div>

        {/* Center Play Button (Only when paused) */}
        {!isPlaying && !isOnBreak && !inactivityPaused && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-2xl animate-in zoom-in-50 duration-300 pointer-events-auto cursor-pointer hover:scale-110 transition-transform" onClick={togglePlay}>
                  <Play size={40} fill="currentColor" className="ml-2" />
              </div>
           </div>
        )}

        {/* Bottom Controls */}
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 pb-8 space-y-4 pointer-events-auto">
          
          {/* Progress Bar */}
          <div className="flex items-center gap-4 group/progress">
            <span className="text-xs font-mono text-white/70 min-w-[40px] text-right">
              {formatDuration(Math.floor(currentTimeSeconds))}
            </span>
            <div className="relative flex-1 h-1 bg-white/20 rounded-full cursor-pointer group-hover/progress:h-2 transition-all">
               <div 
                 className="absolute top-0 left-0 h-full bg-primary rounded-full" 
                 style={{ width: `${(currentTimeSeconds / (durationSeconds || 1)) * 100}%` }}
               />
               <input
                type="range"
                min={0}
                max={durationSeconds || 100}
                value={currentTimeSeconds}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-xs font-mono text-white/70 min-w-[40px]">
              {formatDuration(Math.floor(durationSeconds || 0))}
            </span>
          </div>

          {/* Main Control Row */}
          <div className="flex items-center justify-between">
            
            {/* Left: Playback Controls */}
            <div className="flex items-center gap-6">
               <button onClick={handlePrevVideo} className="text-white/70 hover:text-white transition-colors">
                  <SkipBack size={24} fill="currentColor" />
               </button>
               
               <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
               </button>

               <button onClick={handleNextVideo} className="text-white/70 hover:text-white transition-colors">
                  <SkipForward size={24} fill="currentColor" />
               </button>
               
               {/* Volume */}
               <div className="flex items-center gap-2 group/vol">
                  <button onClick={toggleMute} className="text-white/70 hover:text-white">
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover/vol:w-20 overflow-hidden transition-all h-1 bg-white/30 rounded-full accent-white appearance-none"
                  />
               </div>
            </div>

            {/* Right: Settings & Toggles */}
            <div className="flex items-center gap-4">
              
              {/* Gaze Toggle */}
              <button
                onClick={() => useStore.getState().updateSettings({ gazeEnabled: !settings.gazeEnabled })}
                className={cn("p-2 rounded-full transition-colors", settings.gazeEnabled ? "bg-primary/20 text-primary" : "text-white/50 hover:text-white")}
                title="Gaze Tracking"
              >
                {settings.gazeEnabled ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>

              {/* Captions */}
              <button
                onClick={toggleCaptions}
                className={cn("text-white/70 hover:text-white transition-colors relative", captionsEnabled && "text-primary")}
                title="Captions"
              >
                <Captions size={20} />
                {captionsEnabled && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
              </button>

              {/* Settings Menu */}
              <div className="relative">
                 <button 
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className={cn("text-white/70 hover:text-white transition-colors", showSettingsMenu && "rotate-45")}
                  >
                    <Settings size={20} />
                 </button>

                 {showSettingsMenu && (
                    <div className="absolute bottom-full right-0 mb-4 w-48 bg-surface-1/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden p-1 animate-in slide-in-from-bottom-5 fade-in duration-200">
                        {/* Speed */}
                        <div className="p-2 border-b border-white/5">
                           <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-bold px-2">Playback Speed</div>
                           <div className="grid grid-cols-4 gap-1">
                              {[0.5, 1, 1.5, 2].map(rate => (
                                 <button
                                    key={rate}
                                    onClick={() => handleRateChange(rate)}
                                    className={cn("text-xs py-1 rounded hover:bg-white/10", playbackRate === rate ? "text-primary font-bold bg-white/5" : "text-white/70")}
                                  >
                                    {rate}x
                                  </button>
                              ))}
                           </div>
                        </div>
                        {/* Quality (Mock since YouTube API limits direct quality control sometimes) */}
                        <div className="p-2">
                           <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-bold px-2">Quality</div>
                           <div className="max-h-32 overflow-y-auto space-y-0.5 custom-scrollbar">
                              {availableQualities.length > 0 ? availableQualities.map(q => (
                                 <button
                                    key={q}
                                    onClick={() => handleQualityChange(q)}
                                    className={cn("w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/10 transition-colors", currentQuality === q ? "text-primary" : "text-white/70")}
                                 >
                                    {q.toUpperCase()}
                                 </button>
                              )) : (
                                <div className="text-xs text-white/30 px-2 italic">Auto</div>
                              )}
                           </div>
                        </div>
                    </div>
                 )}
              </div>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
