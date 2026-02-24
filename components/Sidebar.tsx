"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { signOut, useSession } from "next-auth/react";
import { useStore } from "@/stores/useStore";
import { 
  fetchMyPlaylists, 
  fetchPlaylistVideos,
  fetchPlaylistInfo,
  extractPlaylistId
} from "@/lib/youtube";
import { LibraryItem } from "./LibraryItem";
import { 
  Plus, 
  Search, 
  Settings as SettingsIcon, 
  FolderPlus, 
  RefreshCw, 
  Loader2,
  ArrowRight,
  PlayCircle,
  Link as LinkIcon,
  X,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { YTPlaylist, YTVideo } from "@/types";

export function Sidebar() {
  const { data: session } = useSession();
  const {
    currentVideo,
    setCurrentVideo,
    setCurrentPlaylistId,
    playlistRefreshTrigger,
    setActivePlaylistVideos,
    libraryFolders,
    libraryPlaylists,
    rootItems,
    createFolder,
    moveItem,
    deleteFolder,
    setLibraryItems,
    setActiveView,
    activeView
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [playlistVideos, setPlaylistVideos] = useState<Record<string, YTVideo[]>>({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Import State
  const [showImportForm, setShowImportForm] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const ownPlaylists = await fetchMyPlaylists();
      
      // STRICT FILTER: Remove Liked Videos and system playlists
      const filtered = ownPlaylists.filter(pl => {
        const title = pl.title.toLowerCase();
        const isLiked = title.includes("liked") || pl.isSpecial;
        // YouTube sometimes uses specific IDs for Liked videos (e.g., starting with LL)
        const isLikedId = pl.id.startsWith("LL"); 
        return !isLiked && !isLikedId;
      });

      setLibraryItems(filtered);
    } catch (e) {
      console.error("Failed to load playlists", e);
    } finally {
      setLoading(false);
    }
  }, [setLibraryItems]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists, playlistRefreshTrigger]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (over && active.id !== over.id) {
      const itemId = active.id as string;
      const targetId = over.id as string;
      const targetType = over.data.current?.type;

      // Ensure we only move into folders
      if (targetType === "folder") {
        moveItem(itemId, targetId);
      } else {
        // Move to root if dropped elsewhere or explicitly on another item
        moveItem(itemId, null);
      }
    }
  };

  const loadVideos = async (playlistId: string) => {
    if (playlistVideos[playlistId]) return;
    try {
      const { videos } = await fetchPlaylistVideos(playlistId);
      setPlaylistVideos(prev => ({ ...prev, [playlistId]: videos }));
    } catch (e) {
      console.error("Failed to load videos", e);
    }
  };

  const handlePlaylistSelect = (playlist: YTPlaylist) => {
    setCurrentPlaylistId(playlist.id);
    if (!expandedItems.has(playlist.id)) {
        toggleExpand(playlist.id);
    }
    loadVideos(playlist.id);
  };

  const handleImportPlaylist = async () => {
    if (!importUrl.trim() || importing) return;
    setImporting(true);
    setImportError(null);
    try {
      const playlistId = extractPlaylistId(importUrl.trim());
      if (!playlistId) {
        setImportError("Invalid URL. Paste a YouTube playlist URL.");
        return;
      }
      
      const pl = await fetchPlaylistInfo(playlistId);
      pl.isImported = true;
      
      // Add to store
      setLibraryItems([pl]);
      
      setImportUrl("");
      setShowImportForm(false);
    } catch {
      setImportError("Could not find playlist. Check the URL or privacy.");
    } finally {
      setImporting(false);
    }
  };

  const renderItems = (itemIds: string[], depth = 0) => {
    return itemIds.map(id => {
      const folder = libraryFolders[id];
      const playlist = libraryPlaylists[id];

      if (folder) {
        return (
          <LibraryItem
            key={id}
            id={id}
            type="folder"
            title={folder.title}
            depth={depth}
            isExpanded={expandedItems.has(id)}
            onToggle={() => toggleExpand(id)}
            onDelete={() => deleteFolder(id)}
          >
            {renderItems(folder.itemIds, depth + 1)}
          </LibraryItem>
        );
      }

      if (playlist) {
        return (
          <LibraryItem
            key={id}
            id={id}
            type="playlist"
            title={playlist.title}
            depth={depth}
            playlistData={playlist}
            isExpanded={expandedItems.has(id)}
            onToggle={() => { toggleExpand(id); loadVideos(id); }}
            onSelect={() => handlePlaylistSelect(playlist)}
          >
            {(playlistVideos[id] || []).map(video => (
              <LibraryItem
                key={video.id}
                id={video.id}
                type="video"
                title={video.title}
                depth={depth + 1}
                videoData={video}
                isActive={currentVideo?.id === video.id}
                onSelect={() => {
                   setCurrentVideo(video);
                   setActivePlaylistVideos(playlistVideos[id] || []);
                }}
              />
            ))}
          </LibraryItem>
        );
      }

      return null;
    });
  };

  return (
    <aside className="flex flex-col h-full bg-surface-1 border-r border-border w-full select-none font-sans overflow-hidden shadow-2xl animate-in fade-in duration-500">
      {/* App Logo/Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <PlayCircle size={20} className="text-white fill-current" />
           </div>
           <div>
             <h1 className="text-sm font-bold tracking-tight">GazeFocus</h1>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Workspace</p>
           </div>
        </div>
        <button 
          onClick={loadPlaylists}
          className="p-2 hover:bg-surface-2 rounded-full transition-colors text-muted-foreground hover:text-foreground"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      {/* Global Navigation */}
      <div className="px-3 mb-6 space-y-1">
        <button 
          onClick={() => setActiveView("search")}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300 group",
            activeView === "search" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-surface-2 text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2.5">
            <Search size={16} />
            <span className="text-xs font-semibold">Discovery</span>
          </div>
          <ArrowRight size={14} className="opacity-0 group-hover:opacity-40 -translate-x-2 group-hover:translate-x-0 transition-all" />
        </button>

        <button 
          onClick={() => setActiveView("dashboard")}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300 group",
            activeView === "dashboard" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-surface-2 text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard size={16} />
            <span className="text-xs font-semibold">Dashboard</span>
          </div>
        </button>
        
        <button 
          onClick={() => setActiveView("settings")}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300 group",
            activeView === "settings" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-surface-2 text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2.5">
            <SettingsIcon size={16} />
            <span className="text-xs font-semibold">Preferences</span>
          </div>
        </button>
      </div>

      {/* Library Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-6 mb-2 flex items-center justify-between">
           <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">My Library</span>
           <div className="flex items-center gap-1">
             <button 
                onClick={() => createFolder("New Folder", null)}
                className="p-1 hover:bg-surface-2 rounded transition-colors text-muted-foreground hover:text-primary"
                title="New Folder"
              >
               <FolderPlus size={14} />
             </button>
             <button 
                onClick={() => setShowImportForm(!showImportForm)}
                className={cn("p-1 hover:bg-surface-2 rounded transition-colors text-muted-foreground hover:text-primary", showImportForm && "text-primary bg-primary/10")}
                title="Import Playlist URL"
              >
               <LinkIcon size={14} />
             </button>
           </div>
        </div>

        {/* Import Form */}
        {showImportForm && (
            <div className="mx-3 mb-4 p-3 bg-surface-2 rounded-xl border border-border animate-in slide-in-from-top-4 duration-300 ease-out shadow-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Import Playlist</span>
                    <button onClick={() => setShowImportForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X size={12} />
                    </button>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="YouTube Playlist URL..."
                        className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                    <button 
                        onClick={handleImportPlaylist}
                        disabled={importing || !importUrl}
                        className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 shadow-md shadow-primary/10 transition-all"
                    >
                        {importing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    </button>
                </div>
                {importError && <p className="text-[10px] text-destructive mt-2 animate-in fade-in">{importError}</p>}
            </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 custom-scrollbar scroll-smooth">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-0.5 pb-4">
              {renderItems(rootItems)}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeDragId ? (
                <div className="bg-surface-3 px-3 py-2 rounded-md shadow-2xl border border-primary/40 text-xs font-medium text-primary flex items-center gap-2 backdrop-blur-md scale-105 transition-transform">
                   {activeDragId.includes('folder') ? <FolderPlus size={14} /> : <PlayCircle size={14} className="text-blue-400" />}
                   <span>Dragging {activeDragId.includes('folder') ? 'Folder' : 'Playlist'}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {rootItems.length === 0 && !loading && (
            <div className="py-12 px-6 text-center border-2 border-dashed border-border rounded-xl mt-4 bg-surface-2/30">
               <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-3">
                  <Plus size={20} className="text-muted-foreground" />
               </div>
               <p className="text-xs text-muted-foreground leading-relaxed">
                 Your library is empty.<br/>Sync playlists or create folders.
               </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info & Logout */}
      <div className="p-4 mt-auto bg-surface-2/50 border-t border-border group/footer">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-border bg-surface-3 flex items-center justify-center">
                 {session?.user?.image ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">
                     {session?.user?.name?.substring(0, 2) || "PK"}
                   </span>
                 )}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-xs font-semibold truncate text-foreground">{session?.user?.name || "Purujith Kadekar"}</p>
                 <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">Pro Workspace</p>
              </div>
           </div>
           
           <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
              title="Sign Out"
            >
             <LogOut size={14} />
           </button>
         </div>
      </div>
    </aside>
  );
}
