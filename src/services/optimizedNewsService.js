import { DatabaseService } from './databaseService'
import { EnhancedGeminiService } from './enhancedGeminiService'
import { supabase } from '../lib/supabase'

export class OptimizedNewsService {
  
  // Get articles with full optimization
  static async getArticles(options = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return await DatabaseService.getArticles({
        ...options,
        userId: user?.id
      })
    } catch (error) {
      console.error('Error fetching articles:', error)
      // Return empty result instead of throwing to prevent app crashes
      return {
        articles: [],
        total: 0,
        hasMore: false,
        error: error.message
      }
    }
  }

  // Get personalized feed
  static async getPersonalizedFeed(userId, preferences = {}) {
    try {
      // Check rate limit
      if (!await DatabaseService.checkRateLimit('fetch_articles', userId)) {
        throw new Error('Rate limit exceeded')
      }

      // Get user preferences
      const userPrefs = await DatabaseService.getUserPreferences(userId)
      
      // Build query options based on preferences
      const options = {
        category: userPrefs?.preferred_categories?.[0],
        country: userPrefs?.preferred_countries?.[0],
        limit: 20,
        userId
      }

      const articles = await this.getArticles(options)

      // Use AI to personalize order if we have articles
      if (articles.articles.length > 0 && userPrefs) {
        try {
          const personalizedOrder = await EnhancedGeminiService.generatePersonalizedFeed(
            userPrefs,
            articles.articles
          )
          
          if (personalizedOrder && Array.isArray(personalizedOrder)) {
            const reorderedArticles = personalizedOrder
              .map(id => articles.articles.find(article => article.id === id))
              .filter(Boolean)
            
            return {
              ...articles,
              articles: reorderedArticles
            }
          }
        } catch (aiError) {
          console.warn('AI personalization failed:', aiError)
          await DatabaseService.logError(aiError, { function: 'personalizeArticles' })
        }
      }

      return articles
    } catch (error) {
      await DatabaseService.logError(error, { function: 'getPersonalizedFeed', userId })
      throw error
    }
  }

  // Get trending topics with caching
  static async getTrendingTopics() {
    try {
      return await DatabaseService.getTrendingTopics()
    } catch (error) {
      console.error('Error fetching trending topics:', error)
      return []
    }
  }

  // Search articles with optimization
  static async searchArticles(query, filters = {}) {
    try {
      if (!query || query.trim().length < 2) {
        throw new Error('Search query must be at least 2 characters')
      }

      const sanitizedQuery = DatabaseService.sanitizeInput(query)
      
      return await this.getArticles({
        ...filters,
        search: sanitizedQuery
      })
    } catch (error) {
      await DatabaseService.logError(error, { function: 'searchArticles', query, filters })
      throw error
    }
  }

  // Get article summary with rate limiting
  static async getArticleSummary(articleId, type = 'short', language = 'en') {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Check rate limit for AI operations
      if (!await DatabaseService.checkRateLimit('ai_summary', user?.id)) {
        throw new Error('AI summary rate limit exceeded. Please try again later.')
      }

      // Check for existing summary first
      const { data: existingSummary } = await supabase
        .from('news_summaries')
        .select('content')
        .eq('post_id', articleId)
        .eq('language', language)
        .eq('summary_type', type)
        .single()

      if (existingSummary) {
        return existingSummary.content
      }

      // Get the article
      const { data: article, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', articleId)
        .single()

      if (error) {
        throw new Error('Article not found')
      }

      // Generate summary using AI
      const summary = await EnhancedGeminiService.generateAfricanContextSummary(
        article, 
        type, 
        language
      )

      // Save summary to database
      await supabase
        .from('news_summaries')
        .insert([{
          post_id: articleId,
          language,
          summary_type: type,
          content: summary,
          generated_by: 'gemini'
        }])

      return summary
    } catch (error) {
      await DatabaseService.logError(error, { 
        function: 'getArticleSummary', 
        articleId, 
        type, 
        language 
      })
      throw error
    }
  }

  // Record reading activity with optimization
  static async recordReadingActivity(userId, articleId, activity) {
    try {
      if (!userId || !articleId) {
        return // Fail silently for anonymous users
      }

      // Check rate limit
      if (!await DatabaseService.checkRateLimit('user_action', userId)) {
        return // Fail silently to avoid disrupting user experience
      }

      // Sanitize activity data
      const sanitizedActivity = {
        interaction_type: DatabaseService.sanitizeInput(activity.interaction_type),
        device_type: DatabaseService.sanitizeInput(activity.device_type || 'unknown'),
        read_duration: activity.read_duration || null,
        read_percentage: activity.read_percentage || null
      }

      await supabase
        .from('reading_history')
        .insert([{
          user_id: userId,
          post_id: articleId,
          ...sanitizedActivity
        }])

      // Update user engagement metrics
      await supabase
        .from('profiles')
        .update({ 
          last_active: new Date().toISOString(),
          points: supabase.raw('points + 1') // Small points for reading
        })
        .eq('id', userId)

    } catch (error) {
      // Log error but don't throw to avoid disrupting user experience
      await DatabaseService.logError(error, { 
        function: 'recordReadingActivity', 
        userId, 
        articleId, 
        activity 
      })
    }
  }

  // Get news sources
  static async getNewsSources(country = null) {
    try {
      return await DatabaseService.getNewsSources(country)
    } catch (error) {
      console.error('Error fetching news sources:', error)
      return []
    }
  }

  // Get countries and languages
  static async getCountries() {
    try {
      return await DatabaseService.getCountries()
    } catch (error) {
      console.error('Error fetching countries:', error)
      return []
    }
  }

  static async getLanguages() {
    try {
      return await DatabaseService.getLanguages()
    } catch (error) {
      console.error('Error fetching languages:', error)
      return []
    }
  }

  // Submit local report with validation
  static async submitLocalReport(reportData, userId) {
    try {
      if (!userId) {
        throw new Error('Authentication required')
      }

      // Check rate limit
      if (!await DatabaseService.checkRateLimit('user_action', userId)) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }

      // Validate and sanitize report data
      const requiredFields = ['title', 'content', 'location', 'country', 'category']
      const missing = requiredFields.filter(field => !reportData[field])
      
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`)
      }

      const sanitizedData = {
        user_id: userId,
        title: DatabaseService.sanitizeInput(reportData.title),
        content: DatabaseService.sanitizeInput(reportData.content),
        location: DatabaseService.sanitizeInput(reportData.location),
        country: DatabaseService.sanitizeInput(reportData.country),
        category_id: reportData.category_id,
        media_urls: reportData.media_urls || [],
        verification_score: 5.0, // Default score
        status: 'pending'
      }

      // AI verification if enabled
      try {
        const verification = await EnhancedGeminiService.performAfricanFactCheck(
          `${sanitizedData.title}\n\n${sanitizedData.content}`,
          sanitizedData.country
        )
        
        if (verification) {
          sanitizedData.verification_score = verification.accuracy_score
          sanitizedData.status = verification.accuracy_score > 7 ? 'verified' : 'pending'
        }
      } catch (aiError) {
        console.warn('AI verification failed:', aiError)
      }

      const { data, error } = await supabase
        .from('local_reports')
        .insert([sanitizedData])
        .select()
        .single()

      if (error) {
        throw error
      }

      // Award points for reporting
      await supabase
        .from('profiles')
        .update({ points: supabase.raw('points + 20') })
        .eq('id', userId)

      return data
    } catch (error) {
      await DatabaseService.logError(error, { 
        function: 'submitLocalReport', 
        userId, 
        reportData 
      })
      throw error
    }
  }

  // Get user reading statistics
  static async getUserReadingStats(userId) {
    try {
      const { data, error } = await supabase
        .from('reading_history')
        .select('interaction_type, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (error) {
        throw error
      }

      // Calculate statistics
      const stats = {
        totalReads: data.length,
        thisWeek: data.filter(item => 
          new Date(item.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        avgPerDay: Math.round(data.length / 30)
      }

      return stats
    } catch (error) {
      await DatabaseService.logError(error, { function: 'getUserReadingStats', userId })
      throw error
    }
  }

  // Cleanup service - run periodically
  static async performMaintenance() {
    try {
      await DatabaseService.cleanupExpiredCache()
      console.log('Maintenance completed successfully')
    } catch (error) {
      console.error('Maintenance failed:', error)
    }
  }
}

// Auto-cleanup every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    OptimizedNewsService.performMaintenance()
  }, 60 * 60 * 1000)
}