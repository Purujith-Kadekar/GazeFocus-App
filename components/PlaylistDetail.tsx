"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useStore } from "@/stores/useStore";
import { fetchPlaylistVideos, formatDuration } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import type { YTPlaylist, YTVideo } from "@/types";
import { ArrowLeft, PlayCircle, Loader2, RefreshCw } from "lucide-react";

interface PlaylistDetailProps {
    playlist: YTPlaylist;
}

export function PlaylistDetail({ playlist }: PlaylistDetailProps) {
    const { currentVideo, setCurrentVideo, setActiveView } = useStore();
    const [videos, setVideos] = useState<YTVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadVideos = async () => {
        setLoading(true);
        setError(null);
        try {
            const { videos } = await fetchPlaylistVideos(playlist.id);
            setVideos(videos);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load videos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVideos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playlist.id]);

    const handlePlayVideo = (video: YTVideo) => {
        setCurrentVideo(video);
        setActiveView("player");
    };

    return (
        <div className="flex flex-col h-full bg-surface">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-surface-1">
                <div className="flex items-center gap-3 mb-3">
                    <button
                        onClick={() => setActiveView("player")}
                        className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                        aria-label="Back"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-display text-sm tracking-wider uppercase text-text-primary truncate">
                            {playlist.title}
                        </h2>
                        <p className="text-text-muted text-xs mt-0.5">
                            {playlist.channelTitle ? `${playlist.channelTitle} • ` : ""}
                            {playlist.itemCount} videos
                        </p>
                    </div>
                    <button
                        onClick={loadVideos}
                        disabled={loading}
                        className="text-text-muted hover:text-text-secondary transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
                {playlist.description && (
                    <p className="text-text-secondary text-xs line-clamp-2">
                        {playlist.description}
                    </p>
                )}
            </div>

            {/* Video list */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-text-muted" />
                    </div>
                ) : error ? (
                    <div className="px-6 py-8 text-center space-y-3">
                        <p className="text-danger text-sm">{error}</p>
                        <button
                            onClick={loadVideos}
                            className="text-xs text-text-secondary hover:text-text-primary underline"
                        >
                            Try again
                        </button>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <p className="text-text-muted text-sm font-display">No videos in this playlist</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {videos.map((video, index) => (
                            <button
                                key={video.id}
                                onClick={() => handlePlayVideo(video)}
                                className={cn(
                                    "w-full flex items-center gap-4 px-6 py-3 text-left hover:bg-surface-1 transition-colors group",
                                    currentVideo?.id === video.id && "bg-accent/5 border-l-2 border-accent"
                                )}
                            >
                                {/* Index */}
                                <span className="text-text-muted text-xs w-6 text-right tabular-nums shrink-0">
                                    {currentVideo?.id === video.id ? (
                                        <PlayCircle size={14} className="text-accent" />
                                    ) : (
                                        index + 1
                                    )}
                                </span>

                                {/* Thumbnail */}
                                <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-surface-3 shrink-0">
                                    {video.thumbnails.medium?.url && (
                                        <Image
                                            src={video.thumbnails.medium.url}
                                            alt=""
                                            fill
                                            className="object-cover"
                                        />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                        <PlayCircle size={20} className="text-white" />
                                    </div>
                                    <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 rounded text-white text-xs tabular-nums">
                                        {formatDuration(video.durationSeconds)}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-text-primary text-sm leading-snug line-clamp-2">
                                        {video.title}
                                    </p>
                                    <p className="text-text-muted text-xs mt-1">
                                        {video.channelTitle}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
