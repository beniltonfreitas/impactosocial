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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      article_views: {
        Row: {
          article_id: string
          id: string
          ip_address: unknown
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          article_id: string
          id?: string
          ip_address?: unknown
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          article_id?: string
          id?: string
          ip_address?: unknown
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author: string | null
          breaking: boolean
          category_id: string | null
          content: string | null
          created_at: string | null
          featured: boolean | null
          gallery_images: string[] | null
          id: string
          image_card_url: string | null
          image_credit: string | null
          image_og_url: string | null
          image_url: string | null
          premium_only: boolean | null
          published_at: string | null
          seo_meta_description: string | null
          seo_meta_title: string | null
          slug: string
          source_url: string | null
          status: string | null
          summary: string | null
          tags: string[] | null
          tenant_id: string | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author?: string | null
          breaking?: boolean
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          featured?: boolean | null
          gallery_images?: string[] | null
          id?: string
          image_card_url?: string | null
          image_credit?: string | null
          image_og_url?: string | null
          image_url?: string | null
          premium_only?: boolean | null
          published_at?: string | null
          seo_meta_description?: string | null
          seo_meta_title?: string | null
          slug: string
          source_url?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author?: string | null
          breaking?: boolean
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          featured?: boolean | null
          gallery_images?: string[] | null
          id?: string
          image_card_url?: string | null
          image_credit?: string | null
          image_og_url?: string | null
          image_url?: string | null
          premium_only?: boolean | null
          published_at?: string | null
          seo_meta_description?: string | null
          seo_meta_title?: string | null
          slug?: string
          source_url?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      comment_flags: {
        Row: {
          comment_id: string
          created_at: string | null
          details: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_flags_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_flags_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          article_id: string
          content: string
          created_at: string
          edited_at: string | null
          flags_count: number | null
          id: string
          parent_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string
          edited_at?: string | null
          flags_count?: number | null
          id?: string
          parent_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          flags_count?: number | null
          id?: string
          parent_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_with_users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_challenges: {
        Row: {
          challenge_type: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          id: string
          points_reward: number
          target_value: number
          user_id: string
        }
        Insert: {
          challenge_type: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          points_reward: number
          target_value: number
          user_id: string
        }
        Update: {
          challenge_type?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          points_reward?: number
          target_value?: number
          user_id?: string
        }
        Relationships: []
      }
      community_referrals: {
        Row: {
          clicks: number | null
          conversions: number | null
          created_at: string | null
          generated_link: string
          id: string
          ref_code: string
          target_url: string
          user_id: string
        }
        Insert: {
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          generated_link: string
          id?: string
          ref_code: string
          target_url: string
          user_id: string
        }
        Update: {
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          generated_link?: string
          id?: string
          ref_code?: string
          target_url?: string
          user_id?: string
        }
        Relationships: []
      }
      community_stats: {
        Row: {
          id: string
          points: number | null
          rank_position: number | null
          total_clicks: number | null
          total_conversions: number | null
          total_shares: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          points?: number | null
          rank_position?: number | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_shares?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          points?: number | null
          rank_position?: number | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_shares?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      entitlement: {
        Row: {
          active: boolean
          feature_key: string
          id: number
          tenant_id: string
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          feature_key: string
          id?: number
          tenant_id: string
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          feature_key?: string
          id?: number
          tenant_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entitlement_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_map: {
        Row: {
          active: boolean
          id: number
          note: string | null
          priority: number
          region_id: number
          tenant_id: string
        }
        Insert: {
          active?: boolean
          id?: number
          note?: string | null
          priority?: number
          region_id: number
          tenant_id: string
        }
        Update: {
          active?: boolean
          id?: number
          note?: string | null
          priority?: number
          region_id?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_map_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "region"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_map_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      pcd_articles: {
        Row: {
          accessibility_level: string | null
          audio_url: string | null
          created_at: string | null
          disability_tags: string[] | null
          id: string
          original_article_id: string | null
          sign_language_video_url: string | null
          simplified_content: string | null
          updated_at: string | null
        }
        Insert: {
          accessibility_level?: string | null
          audio_url?: string | null
          created_at?: string | null
          disability_tags?: string[] | null
          id?: string
          original_article_id?: string | null
          sign_language_video_url?: string | null
          simplified_content?: string | null
          updated_at?: string | null
        }
        Update: {
          accessibility_level?: string | null
          audio_url?: string | null
          created_at?: string | null
          disability_tags?: string[] | null
          id?: string
          original_article_id?: string | null
          sign_language_video_url?: string | null
          simplified_content?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pcd_articles_original_article_id_fkey"
            columns: ["original_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      pcd_athletes: {
        Row: {
          achievements: Json | null
          active: boolean | null
          bio: string | null
          city: string | null
          created_at: string | null
          disability_type: string | null
          id: string
          name: string
          photo_url: string | null
          social_media: Json | null
          sport: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          achievements?: Json | null
          active?: boolean | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          disability_type?: string | null
          id?: string
          name: string
          photo_url?: string | null
          social_media?: Json | null
          sport?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          achievements?: Json | null
          active?: boolean | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          disability_type?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          social_media?: Json | null
          sport?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pcd_benefits: {
        Row: {
          active: boolean | null
          category: string | null
          city: string | null
          coupon_code: string | null
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          id: string
          partner_name: string
          state: string | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          city?: string | null
          coupon_code?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          partner_name: string
          state?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          city?: string | null
          coupon_code?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          partner_name?: string
          state?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      pcd_blog_posts: {
        Row: {
          audio_url: string | null
          author_id: string | null
          category: string | null
          content: string
          created_at: string | null
          featured_image: string | null
          id: string
          published_at: string | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          audio_url?: string | null
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          audio_url?: string | null
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      pcd_campaigns: {
        Row: {
          beneficiary_name: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          ends_at: string | null
          external_url: string | null
          goal_cents: number | null
          id: string
          payment_platform: string | null
          raised_cents: number | null
          status: string | null
          title: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          beneficiary_name?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          ends_at?: string | null
          external_url?: string | null
          goal_cents?: number | null
          id?: string
          payment_platform?: string | null
          raised_cents?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          beneficiary_name?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          ends_at?: string | null
          external_url?: string | null
          goal_cents?: number | null
          id?: string
          payment_platform?: string | null
          raised_cents?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      pcd_complaints: {
        Row: {
          category: string | null
          city: string | null
          created_at: string | null
          description: string
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          media_urls: string[] | null
          protocol_number: string | null
          public_body: string | null
          state: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          visibility: string | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string | null
          description: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          media_urls?: string[] | null
          protocol_number?: string | null
          public_body?: string | null
          state?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          media_urls?: string[] | null
          protocol_number?: string | null
          public_body?: string | null
          state?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      pcd_config: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          module: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          module: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          module?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pcd_councils: {
        Row: {
          active: boolean | null
          address: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          level: string | null
          meeting_schedule: string | null
          name: string
          president_name: string | null
          state: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          level?: string | null
          meeting_schedule?: string | null
          name: string
          president_name?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          level?: string | null
          meeting_schedule?: string | null
          name?: string
          president_name?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      pcd_courses: {
        Row: {
          accessibility_features: Json | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          has_certificate: boolean | null
          id: string
          instructor: string | null
          price_cents: number | null
          published_at: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          accessibility_features?: Json | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          has_certificate?: boolean | null
          id?: string
          instructor?: string | null
          price_cents?: number | null
          published_at?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          accessibility_features?: Json | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          has_certificate?: boolean | null
          id?: string
          instructor?: string | null
          price_cents?: number | null
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pcd_legislation: {
        Row: {
          benefit_type: string[] | null
          created_at: string | null
          disability_types: string[] | null
          federal_law: boolean | null
          file_url: string | null
          full_text: string | null
          id: string
          municipality: string | null
          number: string | null
          published_at: string | null
          simplified_guide: string | null
          state_uf: string | null
          summary: string | null
          title: string
          type: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          benefit_type?: string[] | null
          created_at?: string | null
          disability_types?: string[] | null
          federal_law?: boolean | null
          file_url?: string | null
          full_text?: string | null
          id?: string
          municipality?: string | null
          number?: string | null
          published_at?: string | null
          simplified_guide?: string | null
          state_uf?: string | null
          summary?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          benefit_type?: string[] | null
          created_at?: string | null
          disability_types?: string[] | null
          federal_law?: boolean | null
          file_url?: string | null
          full_text?: string | null
          id?: string
          municipality?: string | null
          number?: string | null
          published_at?: string | null
          simplified_guide?: string | null
          state_uf?: string | null
          summary?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      pcd_portfolios: {
        Row: {
          business_name: string
          category: string | null
          city: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          phone: string | null
          portfolio_images: string[] | null
          premium: boolean | null
          qr_code_url: string | null
          social_media: Json | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          views: number | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          business_name: string
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          portfolio_images?: string[] | null
          premium?: boolean | null
          qr_code_url?: string | null
          social_media?: Json | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          business_name?: string
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          portfolio_images?: string[] | null
          premium?: boolean | null
          qr_code_url?: string | null
          social_media?: Json | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      pcd_products: {
        Row: {
          active: boolean | null
          category: string | null
          commission_rate: number | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          price_cents: number
          seller_id: string | null
          stock: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          price_cents: number
          seller_id?: string | null
          stock?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          price_cents?: number
          seller_id?: string | null
          stock?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pcd_videos: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          has_audio_description: boolean | null
          has_sign_language: boolean | null
          has_subtitles: boolean | null
          id: string
          published_at: string | null
          tenant_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
          views: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          has_audio_description?: boolean | null
          has_sign_language?: boolean | null
          has_subtitles?: boolean | null
          id?: string
          published_at?: string | null
          tenant_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
          views?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          has_audio_description?: boolean | null
          has_sign_language?: boolean | null
          has_subtitles?: boolean | null
          id?: string
          published_at?: string | null
          tenant_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pcd_videos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      region: {
        Row: {
          bbox_geojson: Json | null
          cep_end: string | null
          cep_start: string | null
          city: string
          city_ibge_id: number | null
          country_code: string
          id: number
          lat: number | null
          lng: number | null
          uf: string
        }
        Insert: {
          bbox_geojson?: Json | null
          cep_end?: string | null
          cep_start?: string | null
          city: string
          city_ibge_id?: number | null
          country_code?: string
          id?: number
          lat?: number | null
          lng?: number | null
          uf: string
        }
        Update: {
          bbox_geojson?: Json | null
          cep_end?: string | null
          cep_start?: string | null
          city?: string
          city_ibge_id?: number | null
          country_code?: string
          id?: number
          lat?: number | null
          lng?: number | null
          uf?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          name: string
          price_monthly_cents: number
          slug: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          name: string
          price_monthly_cents: number
          slug: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          name?: string
          price_monthly_cents?: number
          slug?: string
        }
        Relationships: []
      }
      tenant: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      tenant_pref: {
        Row: {
          anon_id: string | null
          cep: string | null
          id: number
          last_resolved_at: string
          region_id: number | null
          tenant_id_preferred: string | null
          user_id: string | null
        }
        Insert: {
          anon_id?: string | null
          cep?: string | null
          id?: number
          last_resolved_at?: string
          region_id?: number | null
          tenant_id_preferred?: string | null
          user_id?: string | null
        }
        Update: {
          anon_id?: string | null
          cep?: string | null
          id?: number
          last_resolved_at?: string
          region_id?: number | null
          tenant_id_preferred?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_pref_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "region"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_pref_tenant_id_preferred_fkey"
            columns: ["tenant_id_preferred"]
            isOneToOne: false
            referencedRelation: "tenant"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string | null
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string | null
          status: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      comments_with_users: {
        Row: {
          article_id: string | null
          avatar_url: string | null
          content: string | null
          created_at: string | null
          edited_at: string | null
          full_name: string | null
          id: string | null
          parent_id: string | null
          replies_count: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments_with_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      init_user_challenges: { Args: { _user_id: string }; Returns: undefined }
      normalize_cep: { Args: { cep_in: string }; Returns: string }
      register_article_view: {
        Args: {
          p_article_id: string
          p_referrer?: string
          p_session_id: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      resolve_by_cep: {
        Args: { cep_in: string }
        Returns: {
          city: string
          fallback: boolean
          tenant_domain: string
          tenant_slug: string
          uf: string
        }[]
      }
      resolve_by_geo: {
        Args: { lat_in: number; lng_in: number }
        Returns: {
          city: string
          fallback: boolean
          tenant_domain: string
          tenant_slug: string
          uf: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      challenge_type: "clicks_10" | "shares_5" | "conversions_3"
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
      app_role: ["admin", "moderator", "user"],
      challenge_type: ["clicks_10", "shares_5", "conversions_3"],
    },
  },
} as const
