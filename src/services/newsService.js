import { supabase } from '../lib/supabase'
import { GeminiService } from '../lib/gemini'

// Mock news sources for development (replace with real API integrations)
const AFRICAN_NEWS_SOURCES = [
  {
    id: 'bbc-africa',
    name: 'BBC Africa',
    url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
    country: 'international',
    language: 'en'
  },
  {
    id: 'aljazeera-africa',
    name: 'Al Jazeera Africa',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    country: 'international',
    language: 'en'
  },
  {
    id: 'daily-nation',
    name: 'Daily Nation Kenya',
    url: 'https://nation.africa/kenya/rss',
    country: 'kenya',
    language: 'en'
  },
  {
    id: 'punch-nigeria',
    name: 'The Punch Nigeria',
    url: 'https://punchng.com/feed/',
    country: 'nigeria',
    language: 'en'
  }
]

// Mock articles for development
const MOCK_ARTICLES = [
  {
    id: '1',
    title: 'African Union Summit Addresses Climate Change Initiatives',
    description: 'Leaders from across Africa gather to discuss comprehensive climate action plans and sustainable development goals for the continent.',
    thumbnail: 'https://images.pexels.com/photos/3184435/pexels-photo-3184435.jpeg?auto=compress&cs=tinysrgb&w=800',
    url: 'https://example.com/au-climate-summit',
    source: 'African Union News',
    category: 'politics',
    country_focus: ['south-africa', 'ethiopia', 'kenya'],
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    is_trending: true,
    engagement_score: 8.5
  },
  {
    id: '2',
    title: 'Kenya Leads in Renewable Energy Innovation',
    description: 'Kenya\'s geothermal and solar energy projects are setting new standards for sustainable power generation across East Africa.',
    thumbnail: 'https://images.pexels.com/photos/9800029/pexels-photo-9800029.jpeg?auto=compress&cs=tinysrgb&w=800',
    url: 'https://example.com/kenya-renewable-energy',
    source: 'East African Standard',
    category: 'technology',
    country_focus: ['kenya'],
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    is_trending: false,
    engagement_score: 7.2
  },
  {
    id: '3',
    title: 'Lagos Tech Hub Attracts Global Investment',
    description: 'Nigeria\'s technology sector continues to grow with major international investors backing Lagos-based startups.',
    thumbnail: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800',
    url: 'https://example.com/lagos-tech-investment',
    source: 'TechPoint Africa',
    category: 'business',
    country_focus: ['nigeria'],
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    is_trending: true,
    engagement_score: 9.1
  },
  {
    id: '4',
    title: 'South African Music Artists Dominate Continental Awards',
    description: 'Artists from South Africa sweep major categories at the African Music Awards, showcasing the country\'s diverse musical talent.',
    thumbnail: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
    url: 'https://example.com/sa-music-awards',
    source: 'Channel24',
    category: 'entertainment',
    country_focus: ['south-africa'],
    published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    is_trending: false,
    engagement_score: 6.8
  },
  {
    id: '5',
    title: 'Morocco World Cup Infrastructure Boosts Tourism',
    description: 'Infrastructure developments for the upcoming World Cup are already showing positive impacts on Morocco\'s tourism sector.',
    thumbnail: 'https://images.pexels.com/photos/3288102/pexels-photo-3288102.jpeg?auto=compress&cs=tinysrgb&w=800',
    url: 'https://example.com/morocco-tourism-boost',
    source: 'Morocco World News',
    category: 'sports',
    country_focus: ['morocco'],
    published_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    is_trending: false,
    engagement_score: 7.5
  },
  {
    id: '6',
    title: 'Ethiopian Coffee Farmers Adopt New Technology',
    description: 'Mobile apps and AI-powered tools are helping Ethiopian coffee farmers optimize their yields and connect directly with international buyers.',
    thumbnail: 'https://images.pexels.com/photos/4021521/pexels-photo-4021521.jpeg?auto=compress&cs=tinysrgb&w=800',
    url: 'https://example.com/ethiopia-coffee-tech',
    source: 'Ethiopian Reporter',
    category: 'business',
    country_focus: ['ethiopia'],
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    is_trending: false,
    engagement_score: 6.2
  }
]

export class NewsService {
  static async getArticles(options = {}) {
    const {
      category = null,
      country = null,
      limit = 20,
      offset = 0,
      trending = false,
      search = null
    } = options

    try {
      // In development, return mock data
      let articles = [...MOCK_ARTICLES]

      // Apply filters
      if (category) {
        articles = articles.filter(article => article.category === category)
      }

      if (country) {
        articles = articles.filter(article => 
          article.country_focus.includes(country)
        )
      }

      if (trending) {
        articles = articles.filter(article => article.is_trending)
      }

      if (search) {
        const searchLower = search.toLowerCase()
        articles = articles.filter(article =>
          article.title.toLowerCase().includes(searchLower) ||
          article.description.toLowerCase().includes(searchLower)
        )
      }

      // Sort by engagement score and date
      articles.sort((a, b) => {
        if (trending) {
          return b.engagement_score - a.engagement_score
        }
        return new Date(b.published_at) - new Date(a.published_at)
      })

      // Apply pagination
      const paginatedArticles = articles.slice(offset, offset + limit)

      return {
        articles: paginatedArticles,
        total: articles.length,
        hasMore: offset + limit < articles.length
      }

    } catch (error) {
      console.error('Error fetching articles:', error)
      throw error
    }
  }

  static async getPersonalizedFeed(userId, preferences = {}) {
    try {
      // Get user reading history and preferences
      const { data: readingHistory } = await supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)

      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Get articles based on preferences
      const articles = await this.getArticles({
        category: userPrefs?.preferred_categories?.[0],
        limit: 20
      })

      // Use Gemini to personalize the feed
      if (articles.articles.length > 0) {
        try {
          const personalizedOrder = await GeminiService.generatePersonalizedFeed(
            userPrefs || {},
            articles.articles
          )
          
          // Reorder articles based on AI recommendations
          if (personalizedOrder && Array.isArray(personalizedOrder)) {
            const reorderedArticles = personalizedOrder
              .map(id => articles.articles.find(article => article.id === id))
              .filter(Boolean)
            
            return {
              ...articles,
              articles: reorderedArticles
            }
          }
        } catch (error) {
          console.warn('AI personalization failed, using default order:', error)
        }
      }

      return articles
    } catch (error) {
      console.error('Error getting personalized feed:', error)
      return this.getArticles()
    }
  }

  static async getTrendingTopics() {
    try {
      // In a real implementation, this would aggregate from multiple sources
      const articles = await this.getArticles({ trending: true, limit: 50 })
      
      // Use Gemini to identify trending topics
      const topics = await GeminiService.generateTrendingTopics(articles.articles)
      
      return topics || [
        { topic: 'Climate Action', score: 0.9, category: 'politics', description: 'African climate initiatives' },
        { topic: 'Tech Innovation', score: 0.8, category: 'technology', description: 'African tech startups' },
        { topic: 'Economic Growth', score: 0.7, category: 'business', description: 'African economic development' }
      ]
    } catch (error) {
      console.error('Error getting trending topics:', error)
      return []
    }
  }

  static async searchArticles(query, filters = {}) {
    return this.getArticles({
      ...filters,
      search: query
    })
  }

  static async getArticleSummary(articleId, type = 'short', language = 'en') {
    try {
      // First check if summary already exists
      const { data: existingSummary } = await supabase
        .from('news_summaries')
        .select('*')
        .eq('post_id', articleId)
        .eq('language', language)
        .eq('summary_type', type)
        .single()

      if (existingSummary) {
        return existingSummary.content
      }

      // Get the article
      const article = MOCK_ARTICLES.find(a => a.id === articleId)
      if (!article) {
        throw new Error('Article not found')
      }

      // Generate summary using Gemini
      const summary = await GeminiService.generateSummary(article, type, language)

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
      console.error('Error generating article summary:', error)
      throw error
    }
  }

  static async recordReadingActivity(userId, articleId, activity) {
    try {
      await supabase
        .from('reading_history')
        .insert([{
          user_id: userId,
          post_id: articleId,
          ...activity
        }])
    } catch (error) {
      console.error('Error recording reading activity:', error)
    }
  }
}