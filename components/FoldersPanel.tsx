"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Folder, Plus, X, Loader2, Trash2, FolderOpen } from "lucide-react";
import type { UserFolder } from "@/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function FoldersPanel() {
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        return;
      }

      const { data, error: err } = await supabase
        .from("user_folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (err) throw err;
      setFolders((data || []).map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        createdAt: f.created_at,
      })));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load folders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || creating) return;

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error: err } = await supabase
        .from("user_folders")
        .insert({
          user_id: user.id,
          name: newFolderName.trim(),
          description: newFolderDesc.trim() || null,
        })
        .select()
        .maybeSingle();

      if (err) throw err;
      if (data) {
        setFolders(prev => [{
          id: data.id,
          name: data.name,
          description: data.description,
          createdAt: data.created_at,
        }, ...prev]);
      }
      setNewFolderName("");
      setNewFolderDesc("");
      setShowCreateForm(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create folder");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm("Delete this folder? Playlists inside won't be deleted.")) return;

    try {
      const { error: err } = await supabase
        .from("user_folders")
        .delete()
        .eq("id", id);

      if (err) throw err;
      setFolders(prev => prev.filter(f => f.id !== id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete folder");
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-1">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <FolderOpen size={14} className="text-accent" />
          <h2 className="font-display text-xs tracking-widest uppercase text-text-muted">
            Folders
          </h2>
        </div>
        <p className="text-text-muted text-xs">Organize your playlists</p>
      </div>

      {/* Create Folder */}
      <div className="px-4 py-2 border-b border-border">
        {showCreateForm ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name…"
              className="w-full px-2 py-1 bg-surface-2 border border-border rounded text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent/50"
              autoFocus
            />
            <input
              type="text"
              value={newFolderDesc}
              onChange={(e) => setNewFolderDesc(e.target.value)}
              placeholder="Description (optional)…"
              className="w-full px-2 py-1 bg-surface-2 border border-border rounded text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent/50"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || creating}
                className="flex-1 px-2 py-1 text-xs font-display text-white bg-accent hover:bg-accent/90 disabled:opacity-40 rounded transition-colors"
              >
                {creating ? <Loader2 size={12} className="animate-spin inline mr-1" /> : "Create"}
              </button>
              <button
                onClick={() => { setShowCreateForm(false); setNewFolderName(""); setNewFolderDesc(""); }}
                className="text-text-muted hover:text-text-secondary transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 text-text-muted hover:text-accent text-xs font-display tracking-wider transition-colors"
          >
            <Plus size={12} />
            New folder
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="px-4 py-3 bg-danger/10 border-b border-danger/20 text-danger text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-text-muted" />
          </div>
        ) : folders.length === 0 ? (
          <div className="px-4 py-6 text-center space-y-2">
            <Folder size={24} className="mx-auto text-text-muted/50" />
            <p className="text-text-muted text-xs">No folders yet</p>
            <p className="text-text-muted text-xs text-sm leading-relaxed">
              Create folders to organize your playlists
            </p>
          </div>
        ) : (
          <div className="py-1">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors group"
              >
                <Folder size={14} className="text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-xs font-display truncate">
                    {folder.name}
                  </p>
                  {folder.description && (
                    <p className="text-text-muted text-xs truncate">
                      {folder.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-danger transition-all rounded-md hover:bg-surface-3"
                  title="Delete folder"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
