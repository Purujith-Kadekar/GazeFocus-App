"use client";

import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { 
  Folder as FolderIcon, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Trash2,
  ListVideo,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { YTPlaylist, YTVideo } from "@/types";
import Image from "next/image";

interface LibraryItemProps {
  id: string;
  type: "folder" | "playlist" | "video";
  title: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  onSelect?: () => void;
  onDelete?: () => void;
  playlistData?: YTPlaylist;
  videoData?: YTVideo;
  depth?: number;
  children?: React.ReactNode;
  isActive?: boolean;
}

export function LibraryItem({
  id,
  type,
  title,
  isExpanded,
  onToggle,
  onSelect,
  onDelete,
  videoData,
  depth = 0,
  children,
  isActive
}: LibraryItemProps) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: id,
    data: { type, id }
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: id,
    data: { type, id },
    disabled: type === "video" // Can't drop into a video
  });

  const style: React.CSSProperties = {
    paddingLeft: `${depth * 12 + 8}px`,
    ...(transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 999,
    } : {})
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle?.();
  };

  const isFolder = type === "folder";
  const isPlaylist = type === "playlist";

  return (
    <div ref={setDropRef} className="w-full">
      <div
        ref={setDragRef}
        style={style}
        className={cn(
          "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200",
          isOver && isFolder && "bg-primary/10 border-primary/30 border-dashed border",
          isActive ? "bg-primary/10 text-primary" : "hover:bg-surface-2 text-foreground/70 hover:text-foreground",
          isDragging && "opacity-50 grayscale scale-95",
          "select-none relative"
        )}
        onClick={onSelect}
      >
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners}
          className="opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity p-0.5 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </div>

        {/* Chevron for Expandable Items */}
        {(isFolder || isPlaylist) && (
          <button 
            onClick={handleToggle}
            className="p-0.5 hover:bg-surface-3 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}

        {/* Icon / Thumbnail */}
        <div className="shrink-0">
          {isFolder ? (
            isExpanded ? <FolderOpen size={16} className="text-primary" /> : <FolderIcon size={16} className="text-primary" />
          ) : isPlaylist ? (
             <ListVideo size={16} className="text-blue-400" />
          ) : (
            <div className="w-8 h-5 rounded overflow-hidden bg-surface-3">
               {videoData?.thumbnails?.default?.url && (
                  <Image src={videoData.thumbnails.default.url} alt="" width={32} height={20} className="object-cover w-full h-full" />
               )}
            </div>
          )}
        </div>

        {/* Title */}
        <span className="flex-1 text-xs font-medium truncate tracking-tight">
          {title}
        </span>

        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
           {onDelete && (
             <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1 hover:text-destructive transition-colors"
              >
               <Trash2 size={12} />
             </button>
           )}
        </div>
      </div>

      {/* Children rendering */}
      {isExpanded && children && (
        <div className="mt-0.5">
          {children}
        </div>
      )}
    </div>
  );
}
