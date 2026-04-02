export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      Account: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Folder: {
        Row: {
          createdAt: string
          description: string | null
          id: string
          parentId: string | null
          position: number
          title: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id: string
          parentId?: string | null
          position?: number
          title: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: string
          parentId?: string | null
          position?: number
          title?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Folder_parentId_fkey"
            columns: ["parentId"]
            isOneToOne: false
            referencedRelation: "Folder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Folder_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      LibraryItem: {
        Row: {
          createdAt: string
          externalId: string
          folderId: string | null
          id: string
          metadata: Json | null
          position: number
          title: string
          type: Database["public"]["Enums"]["LibraryItemType"]
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          externalId: string
          folderId?: string | null
          id: string
          metadata?: Json | null
          position?: number
          title: string
          type: Database["public"]["Enums"]["LibraryItemType"]
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          externalId?: string
          folderId?: string | null
          id?: string
          metadata?: Json | null
          position?: number
          title?: string
          type?: Database["public"]["Enums"]["LibraryItemType"]
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "LibraryItem_folderId_fkey"
            columns: ["folderId"]
            isOneToOne: false
            referencedRelation: "Folder"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "LibraryItem_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Note: {
        Row: {
          content: string
          createdAt: string
          id: string
          isImportant: boolean
          timestampSeconds: number | null
          updatedAt: string
          userId: string
          youtubeId: string | null
        }
        Insert: {
          content: string
          createdAt?: string
          id: string
          isImportant?: boolean
          timestampSeconds?: number | null
          updatedAt: string
          userId: string
          youtubeId?: string | null
        }
        Update: {
          content?: string
          createdAt?: string
          id?: string
          isImportant?: boolean
          timestampSeconds?: number | null
          updatedAt?: string
          userId?: string
          youtubeId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Note_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Notification: {
        Row: {
          createdAt: string
          global: boolean
          id: string
          message: string
          read: boolean
          title: string
          userId: string | null
        }
        Insert: {
          createdAt?: string
          global?: boolean
          id: string
          message: string
          read?: boolean
          title: string
          userId?: string | null
        }
        Update: {
          createdAt?: string
          global?: boolean
          id?: string
          message?: string
          read?: boolean
          title?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Notification_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Playlist: {
        Row: {
          channelId: string | null
          channelName: string | null
          createdAt: string
          description: string | null
          id: string
          scheduledAt: string | null
          thumbnail: string | null
          title: string
          totalDuration: number
          updatedAt: string
          userId: string
          youtubeId: string
        }
        Insert: {
          channelId?: string | null
          channelName?: string | null
          createdAt?: string
          description?: string | null
          id: string
          scheduledAt?: string | null
          thumbnail?: string | null
          title: string
          totalDuration?: number
          updatedAt: string
          userId: string
          youtubeId: string
        }
        Update: {
          channelId?: string | null
          channelName?: string | null
          createdAt?: string
          description?: string | null
          id?: string
          scheduledAt?: string | null
          thumbnail?: string | null
          title?: string
          totalDuration?: number
          updatedAt?: string
          userId?: string
          youtubeId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Playlist_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      PlaylistMark: {
        Row: {
          finished: boolean
          finishedAt: string
          id: string
          userId: string
          youtubeId: string
        }
        Insert: {
          finished?: boolean
          finishedAt?: string
          id: string
          userId: string
          youtubeId: string
        }
        Update: {
          finished?: boolean
          finishedAt?: string
          id?: string
          userId?: string
          youtubeId?: string
        }
        Relationships: [
          {
            foreignKeyName: "PlaylistMark_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Session: {
        Row: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Insert: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Update: {
          expires?: string
          id?: string
          sessionToken?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      SiteSettings: {
        Row: {
          id: string
          signupEnabled: boolean
          updatedAt: string
          adminPasswordHash: string | null
        }
        Insert: {
          id?: string
          signupEnabled?: boolean
          updatedAt: string
          adminPasswordHash?: string | null
        }
        Update: {
          id?: string
          signupEnabled?: boolean
          updatedAt?: string
          adminPasswordHash?: string | null
        }
        Relationships: []
      }
      Todo: {
        Row: {
          completed: boolean
          createdAt: string
          id: string
          reminderAt: string | null
          text: string
          type: Database["public"]["Enums"]["TodoType"]
          updatedAt: string
          userId: string
        }
        Insert: {
          completed?: boolean
          createdAt?: string
          id: string
          reminderAt?: string | null
          text: string
          type?: Database["public"]["Enums"]["TodoType"]
          updatedAt: string
          userId: string
        }
        Update: {
          completed?: boolean
          createdAt?: string
          id?: string
          reminderAt?: string | null
          text?: string
          type?: Database["public"]["Enums"]["TodoType"]
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Todo_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          currentStreak: number
          deletionScheduledAt: string | null
          email: string | null
          emailVerified: string | null
          id: string
          image: string | null
          isBlocked: boolean
          lastActiveDate: string | null
          lastLoginDate: string | null
          lastWeeklyReset: string | null
          longestStreak: number
          name: string | null
          passwordHash: string | null
          updatedAt: string
          weeklyVideosWatched: number
        }
        Insert: {
          createdAt?: string
          currentStreak?: number
          deletionScheduledAt?: string | null
          email?: string | null
          emailVerified?: string | null
          id: string
          image?: string | null
          isBlocked?: boolean
          lastActiveDate?: string | null
          lastLoginDate?: string | null
          lastWeeklyReset?: string | null
          longestStreak?: number
          name?: string | null
          passwordHash?: string | null
          updatedAt: string
          weeklyVideosWatched?: number
        }
        Update: {
          createdAt?: string
          currentStreak?: number
          deletionScheduledAt?: string | null
          email?: string | null
          emailVerified?: string | null
          id?: string
          image?: string | null
          isBlocked?: boolean
          lastActiveDate?: string | null
          lastLoginDate?: string | null
          lastWeeklyReset?: string | null
          longestStreak?: number
          name?: string | null
          passwordHash?: string | null
          updatedAt?: string
          weeklyVideosWatched?: number
        }
        Relationships: []
      }
      UserSettings: {
        Row: {
          autoPlayNext: boolean
          createdAt: string
          defaultPlaybackSpeed: number
          eyeTrackingEnabled: boolean
          eyeTrackingThreshold: number
          id: string
          inactivityTimeout: number
          onboardingCompleted: boolean
          sensitivityMode: string
          soundAlerts: boolean
          theme: string
          updatedAt: string
          userId: string
          watchBreakDurationMinutes: number
          watchBreakEnabled: boolean
          watchBreakMinutes: number
          weeklyGoal: number
        }
        Insert: {
          autoPlayNext?: boolean
          createdAt?: string
          defaultPlaybackSpeed?: number
          eyeTrackingEnabled?: boolean
          eyeTrackingThreshold?: number
          id: string
          inactivityTimeout?: number
          onboardingCompleted?: boolean
          sensitivityMode?: string
          soundAlerts?: boolean
          theme?: string
          updatedAt: string
          userId: string
          watchBreakDurationMinutes?: number
          watchBreakEnabled?: boolean
          watchBreakMinutes?: number
          weeklyGoal?: number
        }
        Update: {
          autoPlayNext?: boolean
          createdAt?: string
          defaultPlaybackSpeed?: number
          eyeTrackingEnabled?: boolean
          eyeTrackingThreshold?: number
          id?: string
          inactivityTimeout?: number
          onboardingCompleted?: boolean
          sensitivityMode?: string
          soundAlerts?: boolean
          theme?: string
          updatedAt?: string
          userId?: string
          watchBreakDurationMinutes?: number
          watchBreakEnabled?: boolean
          watchBreakMinutes?: number
          weeklyGoal?: number
        }
        Relationships: [
          {
            foreignKeyName: "UserSettings_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      VerificationToken: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
      Video: {
        Row: {
          createdAt: string
          description: string | null
          duration: number
          id: string
          playlistId: string | null
          position: number
          scheduledAt: string | null
          thumbnail: string | null
          title: string
          updatedAt: string
          userId: string
          youtubeId: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          duration?: number
          id: string
          playlistId?: string | null
          position?: number
          scheduledAt?: string | null
          thumbnail?: string | null
          title: string
          updatedAt: string
          userId: string
          youtubeId: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          duration?: number
          id?: string
          playlistId?: string | null
          position?: number
          scheduledAt?: string | null
          thumbnail?: string | null
          title?: string
          updatedAt?: string
          userId?: string
          youtubeId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Video_playlistId_fkey"
            columns: ["playlistId"]
            isOneToOne: false
            referencedRelation: "Playlist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Video_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      VideoProgress: {
        Row: {
          completed: boolean
          completedAt: string | null
          createdAt: string
          durationSeconds: number | null
          id: string
          secondsWatched: number
          updatedAt: string
          userId: string
          youtubeId: string
        }
        Insert: {
          completed?: boolean
          completedAt?: string | null
          createdAt?: string
          durationSeconds?: number | null
          id: string
          secondsWatched?: number
          updatedAt: string
          userId: string
          youtubeId: string
        }
        Update: {
          completed?: boolean
          completedAt?: string | null
          createdAt?: string
          durationSeconds?: number | null
          id?: string
          secondsWatched?: number
          updatedAt?: string
          userId?: string
          youtubeId?: string
        }
        Relationships: [
          {
            foreignKeyName: "VideoProgress_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      LibraryItemType: "PLAYLIST" | "VIDEO"
      TodoType: "TASK" | "PLAN" | "EVENT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      LibraryItemType: ["PLAYLIST", "VIDEO"],
      TodoType: ["TASK", "PLAN", "EVENT"],
    },
  },
} as const
