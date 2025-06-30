/*
  # Initial Schema for African News Aggregator

  1. New Tables
    - `profiles` - User profiles with African context
    - `posts` - News articles with enhanced metadata
    - `bookmarks` - User bookmarks
    - `user_preferences` - Personalization settings
    - `reading_history` - Track reading patterns for AI
    - `community_discussions` - Discussion threads
    - `user_badges` - Gamification system
    - `news_summaries` - AI-generated summaries
    - `local_reports` - Citizen journalism submissions
    - `trending_topics` - Trending topics tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure community features

  3. Features
    - Multi-language support
    - AI integration ready
    - Gamification system
    - Community features
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  pronouns TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  country TEXT,
  region TEXT,
  bio TEXT,
  points INTEGER DEFAULT 0,
  reading_streak INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table with enhanced African context
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  content TEXT,
  author TEXT,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  country_focus TEXT[], -- African countries this news affects
  language TEXT DEFAULT 'en',
  published_at TIMESTAMPTZ NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  engagement_score FLOAT DEFAULT 0,
  credibility_score FLOAT DEFAULT 5.0, -- Out of 10
  is_trending BOOLEAN DEFAULT FALSE,
  is_breaking BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced bookmarks with notes and tags
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

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

-- Gamification system
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- 'news_streak', 'local_hero', 'fact_checker', 'community_builder'
  badge_level INTEGER DEFAULT 1,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB, -- Additional badge-specific data
  UNIQUE(user_id, badge_type)
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
  category TEXT NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for posts (public read)
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Only authenticated users can insert posts" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for bookmarks
CREATE POLICY "Users can manage own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- Policies for user preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Policies for reading history
CREATE POLICY "Users can manage own reading history" ON reading_history FOR ALL USING (auth.uid() = user_id);

-- Policies for news summaries (public read)
CREATE POLICY "Summaries are viewable by everyone" ON news_summaries FOR SELECT USING (true);

-- Policies for community discussions
CREATE POLICY "Discussions are viewable by everyone" ON community_discussions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create discussions" ON community_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discussions" ON community_discussions FOR UPDATE USING (auth.uid() = user_id);

-- Policies for user badges
CREATE POLICY "Badges are viewable by everyone" ON user_badges FOR SELECT USING (true);

-- Policies for local reports
CREATE POLICY "Users can view published reports" ON local_reports FOR SELECT USING (status = 'published' OR user_id = auth.uid());
CREATE POLICY "Users can create own reports" ON local_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending reports" ON local_reports FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Policies for trending topics (public read)
CREATE POLICY "Trending topics are viewable by everyone" ON trending_topics FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_country_focus ON posts USING GIN(country_focus);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_trending ON posts(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_community_discussions_post_id ON community_discussions(post_id);
CREATE INDEX IF NOT EXISTS idx_local_reports_status ON local_reports(status);
CREATE INDEX IF NOT EXISTS idx_trending_topics_country ON trending_topics(country, updated_at DESC);

-- Create functional unique index for trending topics (replaces the problematic table constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_topics_unique_daily 
ON trending_topics (topic, country, date_trunc('day', created_at));

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_discussions_updated_at BEFORE UPDATE ON community_discussions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trending_topics_updated_at BEFORE UPDATE ON trending_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();