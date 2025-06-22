/*
  # Enhanced Schema for African News Aggregator

  1. Table Enhancements
    - Add African-specific columns to existing `profiles` and `posts` tables
    - Create new tables for advanced features

  2. New Tables
    - `user_preferences` - Personalization settings with African context
    - `reading_history` - AI tracking for personalization
    - `news_summaries` - AI-generated content in multiple languages
    - `community_discussions` - Threaded discussions with AI moderation
    - `local_reports` - Citizen journalism with verification
    - `trending_topics` - Track African news trends
    - `enhanced_bookmarks` - Notes and tags for saved articles

  3. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for African context
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add new columns to existing profiles table if they don't exist
DO $$
BEGIN
  -- Add preferred_language column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_language') THEN
    ALTER TABLE profiles ADD COLUMN preferred_language TEXT DEFAULT 'en';
  END IF;
  
  -- Add country column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country') THEN
    ALTER TABLE profiles ADD COLUMN country TEXT;
  END IF;
  
  -- Add region column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'region') THEN
    ALTER TABLE profiles ADD COLUMN region TEXT;
  END IF;
  
  -- Add points column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'points') THEN
    ALTER TABLE profiles ADD COLUMN points INTEGER DEFAULT 0;
  END IF;
  
  -- Add reading_streak column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'reading_streak') THEN
    ALTER TABLE profiles ADD COLUMN reading_streak INTEGER DEFAULT 0;
  END IF;
  
  -- Add last_active column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_active') THEN
    ALTER TABLE profiles ADD COLUMN last_active TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add new columns to existing posts table if they don't exist
DO $$
BEGIN
  -- Add country_focus column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'country_focus') THEN
    ALTER TABLE posts ADD COLUMN country_focus TEXT[];
  END IF;
  
  -- Add language column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'language') THEN
    ALTER TABLE posts ADD COLUMN language TEXT DEFAULT 'en';
  END IF;
  
  -- Add engagement_score column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'engagement_score') THEN
    ALTER TABLE posts ADD COLUMN engagement_score FLOAT DEFAULT 0;
  END IF;
  
  -- Add credibility_score column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'credibility_score') THEN
    ALTER TABLE posts ADD COLUMN credibility_score FLOAT DEFAULT 5.0;
  END IF;
  
  -- Add is_trending column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_trending') THEN
    ALTER TABLE posts ADD COLUMN is_trending BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add is_breaking column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_breaking') THEN
    ALTER TABLE posts ADD COLUMN is_breaking BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add source column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'source') THEN
    ALTER TABLE posts ADD COLUMN source TEXT;
  END IF;
  
  -- Add url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'url') THEN
    ALTER TABLE posts ADD COLUMN url TEXT;
  END IF;
  
  -- Add thumbnail column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'thumbnail') THEN
    ALTER TABLE posts ADD COLUMN thumbnail TEXT;
  END IF;
  
  -- Add published_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'published_at') THEN
    ALTER TABLE posts ADD COLUMN published_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create new tables that don't exist yet

-- User preferences for personalization
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_categories TEXT[] DEFAULT ARRAY['politics', 'business', 'technology'],
  preferred_countries TEXT[], -- African countries of interest
  preferred_languages TEXT[] DEFAULT ARRAY['en'],
  notification_settings JSONB DEFAULT '{"breaking_news": true, "daily_digest": true, "trending": false}',
  reading_speed TEXT DEFAULT 'medium', -- slow, medium, fast
  content_preferences JSONB DEFAULT '{"show_summaries": true, "auto_translate": false, "audio_enabled": false}',
  data_saver_mode BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading history for AI personalization
CREATE TABLE IF NOT EXISTS reading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  read_duration INTEGER, -- seconds spent reading
  read_percentage FLOAT, -- how much of article was read
  interaction_type TEXT, -- 'read', 'skipped', 'shared', 'saved'
  device_type TEXT DEFAULT 'mobile',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-generated summaries and translations
CREATE TABLE IF NOT EXISTS news_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  summary_type TEXT NOT NULL, -- 'short', 'detailed', 'eli5', 'audio_script'
  content TEXT NOT NULL,
  generated_by TEXT DEFAULT 'gemini',
  quality_score FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, language, summary_type)
);

-- Community discussions
CREATE TABLE IF NOT EXISTS community_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES community_discussions(id), -- for threaded discussions
  content TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  ai_moderated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Citizen journalism / local reports
CREATE TABLE IF NOT EXISTS local_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  media_urls TEXT[],
  category_id UUID REFERENCES categories(id),
  status TEXT DEFAULT 'pending', -- pending, verified, rejected, published
  verification_score FLOAT DEFAULT 0,
  moderator_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
);

-- Trending topics tracking
CREATE TABLE IF NOT EXISTS trending_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  category TEXT,
  country TEXT,
  mention_count INTEGER DEFAULT 1,
  sentiment_score FLOAT DEFAULT 0,
  trend_score FLOAT DEFAULT 0,
  trending_date DATE DEFAULT CURRENT_DATE, -- Use simple date column for daily uniqueness
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(topic, country, trending_date) -- Simple unique constraint instead of functional index
);

-- Enhanced bookmarks with notes and tags (if not exists)
CREATE TABLE IF NOT EXISTS enhanced_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable Row Level Security on new tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies with IF NOT EXISTS equivalent (drop and recreate to avoid conflicts)

-- User preferences policies
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Reading history policies  
DROP POLICY IF EXISTS "Users can manage own reading history" ON reading_history;
CREATE POLICY "Users can manage own reading history" ON reading_history FOR ALL USING (auth.uid() = user_id);

-- News summaries policies (public read)
DROP POLICY IF EXISTS "Summaries are viewable by everyone" ON news_summaries;
CREATE POLICY "Summaries are viewable by everyone" ON news_summaries FOR SELECT USING (true);

-- Community discussions policies
DROP POLICY IF EXISTS "Discussions are viewable by everyone" ON community_discussions;
CREATE POLICY "Discussions are viewable by everyone" ON community_discussions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create discussions" ON community_discussions;
CREATE POLICY "Authenticated users can create discussions" ON community_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own discussions" ON community_discussions;
CREATE POLICY "Users can update own discussions" ON community_discussions FOR UPDATE USING (auth.uid() = user_id);

-- Local reports policies
DROP POLICY IF EXISTS "Users can view published reports" ON local_reports;
CREATE POLICY "Users can view published reports" ON local_reports FOR SELECT USING (status = 'published' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own reports" ON local_reports;
CREATE POLICY "Users can create own reports" ON local_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending reports" ON local_reports;
CREATE POLICY "Users can update own pending reports" ON local_reports FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Trending topics policies (public read)
DROP POLICY IF EXISTS "Trending topics are viewable by everyone" ON trending_topics;
CREATE POLICY "Trending topics are viewable by everyone" ON trending_topics FOR SELECT USING (true);

-- Enhanced bookmarks policies
DROP POLICY IF EXISTS "Users can manage own enhanced bookmarks" ON enhanced_bookmarks;
CREATE POLICY "Users can manage own enhanced bookmarks" ON enhanced_bookmarks FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance (new tables only)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_post_id ON reading_history(post_id);
CREATE INDEX IF NOT EXISTS idx_news_summaries_post_id ON news_summaries(post_id);
CREATE INDEX IF NOT EXISTS idx_news_summaries_language ON news_summaries(language);
CREATE INDEX IF NOT EXISTS idx_community_discussions_post_id ON community_discussions(post_id);
CREATE INDEX IF NOT EXISTS idx_community_discussions_user_id ON community_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_local_reports_status ON local_reports(status);
CREATE INDEX IF NOT EXISTS idx_local_reports_country ON local_reports(country);
CREATE INDEX IF NOT EXISTS idx_trending_topics_country ON trending_topics(country, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_date ON trending_topics(trending_date DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_bookmarks_user_id ON enhanced_bookmarks(user_id);

-- Additional indexes for existing tables (only if they don't exist)
DO $$
BEGIN
  -- Create GIN index for country_focus array if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_country_focus') THEN
    CREATE INDEX idx_posts_country_focus ON posts USING GIN(country_focus) WHERE country_focus IS NOT NULL;
  END IF;
  
  -- Create index for language if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_language') THEN
    CREATE INDEX idx_posts_language ON posts(language);
  END IF;
  
  -- Create partial index for trending posts if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_trending') THEN
    CREATE INDEX idx_posts_trending ON posts(is_trending) WHERE is_trending = true;
  END IF;
  
  -- Create partial index for breaking posts if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_breaking') THEN
    CREATE INDEX idx_posts_breaking ON posts(is_breaking) WHERE is_breaking = true;
  END IF;
  
  -- Create index for published_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_published_at') THEN
    CREATE INDEX idx_posts_published_at ON posts(published_at DESC) WHERE published_at IS NOT NULL;
  END IF;
END $$;

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at (only for new tables, check if they exist first)
DO $$
BEGIN
  -- Create trigger for user_preferences if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_preferences_updated_at') THEN
    CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Create trigger for community_discussions if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_community_discussions_updated_at') THEN
    CREATE TRIGGER update_community_discussions_updated_at 
    BEFORE UPDATE ON community_discussions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Create trigger for trending_topics if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_trending_topics_updated_at') THEN
    CREATE TRIGGER update_trending_topics_updated_at 
    BEFORE UPDATE ON trending_topics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to automatically create user preferences when profile is created
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create user preferences automatically (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'create_user_preferences_trigger') THEN
    CREATE TRIGGER create_user_preferences_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_user_preferences();
  END IF;
END $$;