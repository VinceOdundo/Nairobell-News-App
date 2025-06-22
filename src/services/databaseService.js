import { supabase } from '../lib/supabase'
import { EnhancedGeminiService } from './enhancedGeminiService'

// Rate limiting configuration
const RATE_LIMITS = {
  'fetch_articles': { requests: 100, window: 3600 }, // 100 requests per hour
  'ai_summary': { requests: 20, window: 3600 }, // 20 AI requests per hour
  'user_action': { requests: 1000, window: 3600 } // 1000 user actions per hour
}

class DatabaseService {
  // Error logging
  static async logError(error, context = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase
        .from('error_logs')
        .insert([{
          user_id: user?.id || null,
          error_type: error.name || 'UnknownError',
          error_message: error.message,
          stack_trace: error.stack,
          request_data: context,
          user_agent: navigator.userAgent,
          ip_address: null // Will be set by backend
        }])
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  // Rate limiting check
  static async checkRateLimit(endpoint, userId = null) {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id
      }

      if (!userId) return true // Allow anonymous users with basic limits

      const limit = RATE_LIMITS[endpoint]
      if (!limit) return true

      const windowStart = new Date(Date.now() - (limit.window * 1000))
      
      const { data, error } = await supabase
        .from('api_rate_limits')
        .select('requests_count')
        .eq('user_id', userId)
        .eq('endpoint', endpoint)
        .gte('window_start', windowStart.toISOString())
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data && data.requests_count >= limit.requests) {
        return false // Rate limit exceeded
      }

      // Update or create rate limit record
      await supabase
        .from('api_rate_limits')
        .upsert([{
          user_id: userId,
          endpoint,
          requests_count: (data?.requests_count || 0) + 1,
          window_start: new Date().toISOString()
        }], {
          onConflict: 'user_id,endpoint,window_start'
        })

      return true
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return true // Fail open for now
    }
  }

  // Content caching
  static async getFromCache(key) {
    try {
      const { data, error } = await supabase
        .from('content_cache')
        .select('content')
        .eq('cache_key', key)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data?.content || null
    } catch (error) {
      console.error('Cache retrieval failed:', error)
      return null
    }
  }

  static async setCache(key, content, ttlSeconds = 3600) {
    try {
      const expiresAt = new Date(Date.now() + (ttlSeconds * 1000))
      
      await supabase
        .from('content_cache')
        .upsert([{
          cache_key: key,
          content,
          expires_at: expiresAt.toISOString()
        }], {
          onConflict: 'cache_key'
        })
    } catch (error) {
      console.error('Cache setting failed:', error)
    }
  }

  // Input sanitization
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input
    
    // Basic XSS prevention
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:/gi, '') // Remove data: URLs
      .trim()
      .slice(0, 10000) // Limit length
  }

  // Validate article data
  static validateArticleData(article) {
    const required = ['title', 'content', 'source', 'category']
    const missing = required.filter(field => !article[field])
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`)
    }

    // Sanitize all string fields
    const sanitized = {}
    for (const [key, value] of Object.entries(article)) {
      sanitized[key] = this.sanitizeInput(value)
    }

    return sanitized
  }

  // Get articles with proper error handling and caching
  static async getArticles(options = {}) {
    try {
      const {
        category = null,
        country = null,
        limit = 20,
        offset = 0,
        trending = false,
        search = null,
        userId = null
      } = options

      // Check rate limit
      if (!await this.checkRateLimit('fetch_articles', userId)) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }

      // Try cache first
      const cacheKey = `articles_${JSON.stringify(options)}`
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (username, display_name, country, avatar_url),
          categories:category_id (name, slug, icon, color)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      // Apply filters
      if (category) {
        query = query.eq('category', category)
      }

      if (country) {
        query = query.contains('country_focus', [country])
      }

      if (trending) {
        query = query.eq('is_trending', true)
      }

      if (search) {
        query = query.textSearch('search_vector', search)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        await this.logError(error, { function: 'getArticles', options })
        throw error
      }

      const result = {
        articles: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      }

      // Cache the result
      await this.setCache(cacheKey, result, 300) // 5 minutes cache

      return result
    } catch (error) {
      await this.logError(error, { function: 'getArticles', options })
      throw error
    }
  }

  // Get trending topics
  static async getTrendingTopics() {
    try {
      const cacheKey = 'trending_topics'
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }

      const { data, error } = await supabase
        .from('trending_topics')
        .select('*')
        .order('trend_score', { ascending: false })
        .limit(10)

      if (error) {
        await this.logError(error, { function: 'getTrendingTopics' })
        throw error
      }

      await this.setCache(cacheKey, data, 600) // 10 minutes cache
      return data || []
    } catch (error) {
      await this.logError(error, { function: 'getTrendingTopics' })
      throw error
    }
  }

  // Get news sources
  static async getNewsSources(country = null) {
    try {
      const cacheKey = `news_sources_${country || 'all'}`
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }

      let query = supabase
        .from('news_sources')
        .select('*')
        .eq('is_active', true)
        .order('credibility_score', { ascending: false })

      if (country) {
        query = query.eq('country', country)
      }

      const { data, error } = await query

      if (error) {
        await this.logError(error, { function: 'getNewsSources', country })
        throw error
      }

      await this.setCache(cacheKey, data, 1800) // 30 minutes cache
      return data || []
    } catch (error) {
      await this.logError(error, { function: 'getNewsSources', country })
      throw error
    }
  }

  // Get countries and languages
  static async getCountries() {
    try {
      const cacheKey = 'countries'
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }

      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_african', true)
        .order('name')

      if (error) {
        await this.logError(error, { function: 'getCountries' })
        throw error
      }

      await this.setCache(cacheKey, data, 3600) // 1 hour cache
      return data || []
    } catch (error) {
      await this.logError(error, { function: 'getCountries' })
      throw error
    }
  }

  static async getLanguages() {
    try {
      const cacheKey = 'languages'
      const cached = await this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }

      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        await this.logError(error, { function: 'getLanguages' })
        throw error
      }

      await this.setCache(cacheKey, data, 3600) // 1 hour cache
      return data || []
    } catch (error) {
      await this.logError(error, { function: 'getLanguages' })
      throw error
    }
  }

  // User preferences
  static async getUserPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        await this.logError(error, { function: 'getUserPreferences', userId })
        throw error
      }

      return data
    } catch (error) {
      await this.logError(error, { function: 'getUserPreferences', userId })
      throw error
    }
  }

  // Create or update article
  static async upsertArticle(articleData, userId = null) {
    try {
      // Validate and sanitize input
      const validated = this.validateArticleData(articleData)
      
      // Check rate limit for content creation
      if (!await this.checkRateLimit('user_action', userId)) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }

      const { data, error } = await supabase
        .from('posts')
        .upsert([validated])
        .select()
        .single()

      if (error) {
        await this.logError(error, { function: 'upsertArticle', articleData: validated })
        throw error
      }

      // Clear relevant caches
      await this.clearCachePattern('articles_')
      await this.clearCachePattern('trending_')

      return data
    } catch (error) {
      await this.logError(error, { function: 'upsertArticle', articleData })
      throw error
    }
  }

  // Clear cache by pattern
  static async clearCachePattern(pattern) {
    try {
      await supabase
        .from('content_cache')
        .delete()
        .like('cache_key', `${pattern}%`)
    } catch (error) {
      console.error('Cache clearing failed:', error)
    }
  }

  // Cleanup expired cache entries
  static async cleanupExpiredCache() {
    try {
      await supabase
        .from('content_cache')
        .delete()
        .lt('expires_at', new Date().toISOString())
    } catch (error) {
      console.error('Cache cleanup failed:', error)
    }
  }
}

export { DatabaseService }