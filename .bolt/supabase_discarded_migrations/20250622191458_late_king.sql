/*
  # Create Missing Critical Tables

  1. News Sources Management
    - `news_sources` table for RSS feed management
    - Enable RLS and add policies
    
  2. Content Cache
    - `content_cache` for performance optimization
    - TTL-based cache management
    
  3. API Rate Limiting
    - `api_rate_limits` for request management
    - User-based rate limiting
    
  4. Error Logging
    - `error_logs` for monitoring and debugging
    - Structured error logging
    
  5. Countries and Languages
    - Move hardcoded data to database
    - Enable proper internationalization
*/

-- News Sources table
CREATE TABLE IF NOT EXISTS news_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL UNIQUE,
  rss_url text,
  country text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  category text NOT NULL DEFAULT 'general',
  credibility_score decimal(3,1) DEFAULT 7.0,
  political_lean text DEFAULT 'center',
  is_active boolean DEFAULT true,
  last_fetched_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content Cache table
CREATE TABLE IF NOT EXISTS content_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  content jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- API Rate Limits table
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  requests_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

-- Error Logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  error_type text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  request_data jsonb,
  user_agent text,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

-- Countries lookup table
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  flag_emoji text,
  continent text DEFAULT 'Africa',
  is_african boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Languages lookup table
CREATE TABLE IF NOT EXISTS languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  native_name text,
  is_african boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_sources_country ON news_sources(country);
CREATE INDEX IF NOT EXISTS idx_news_sources_active ON news_sources(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_content_cache_expires ON content_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_content_cache_key ON content_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_endpoint ON api_rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);

-- Enable RLS
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "News sources are viewable by everyone"
  ON news_sources FOR SELECT TO public
  USING (true);

CREATE POLICY "Only admins can manage news sources"
  ON news_sources FOR ALL TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY "Content cache is viewable by everyone"
  ON content_cache FOR SELECT TO public
  USING (true);

CREATE POLICY "Users can view their own rate limits"
  ON api_rate_limits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can view error logs"
  ON error_logs FOR SELECT TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY "Countries are viewable by everyone"
  ON countries FOR SELECT TO public
  USING (true);

CREATE POLICY "Languages are viewable by everyone"
  ON languages FOR SELECT TO public
  USING (true);

-- Insert initial data
INSERT INTO countries (code, name, flag_emoji) VALUES
  ('NG', 'Nigeria', '🇳🇬'),
  ('KE', 'Kenya', '🇰🇪'),
  ('ZA', 'South Africa', '🇿🇦'),
  ('GH', 'Ghana', '🇬🇭'),
  ('ET', 'Ethiopia', '🇪🇹'),
  ('EG', 'Egypt', '🇪🇬'),
  ('MA', 'Morocco', '🇲🇦'),
  ('UG', 'Uganda', '🇺🇬'),
  ('TZ', 'Tanzania', '🇹🇿'),
  ('DZ', 'Algeria', '🇩🇿')
ON CONFLICT (code) DO NOTHING;

INSERT INTO languages (code, name, native_name) VALUES
  ('en', 'English', 'English'),
  ('sw', 'Swahili', 'Kiswahili'),
  ('am', 'Amharic', 'አማርኛ'),
  ('ha', 'Hausa', 'Hausa'),
  ('yo', 'Yoruba', 'Yorùbá'),
  ('ig', 'Igbo', 'Igbo'),
  ('zu', 'Zulu', 'isiZulu'),
  ('xh', 'Xhosa', 'isiXhosa'),
  ('af', 'Afrikaans', 'Afrikaans'),
  ('fr', 'French', 'Français'),
  ('ar', 'Arabic', 'العربية'),
  ('pt', 'Portuguese', 'Português')
ON CONFLICT (code) DO NOTHING;

-- Insert initial news sources
INSERT INTO news_sources (name, url, rss_url, country, language, credibility_score) VALUES
  ('BBC Africa', 'https://bbc.com/news/world/africa', 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', 'international', 'en', 9.0),
  ('Al Jazeera Africa', 'https://aljazeera.com/africa', 'https://www.aljazeera.com/xml/rss/all.xml', 'international', 'en', 8.5),
  ('Daily Nation Kenya', 'https://nation.africa/kenya', 'https://nation.africa/kenya/rss', 'KE', 'en', 8.0),
  ('The Punch Nigeria', 'https://punchng.com', 'https://punchng.com/feed/', 'NG', 'en', 7.5),
  ('News24 South Africa', 'https://news24.com', 'https://feeds.news24.com/articles/news24/TopStories/rss', 'ZA', 'en', 8.0)
ON CONFLICT (url) DO NOTHING;