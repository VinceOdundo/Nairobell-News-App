import { supabase } from '../lib/supabase'
import { GeminiService } from '../lib/gemini'

// Major African news sources
const AFRICAN_RSS_SOURCES = [
  {
    id: 'bbc-africa',
    name: 'BBC Africa',
    url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
    country: 'international',
    language: 'en',
    category: 'general',
    credibility_score: 9.0,
    political_lean: 'center'
  },
  {
    id: 'al-jazeera-africa',
    name: 'Al Jazeera Africa',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    country: 'international',
    language: 'en',
    category: 'general',
    credibility_score: 8.5,
    political_lean: 'center-left'
  },
  {
    id: 'daily-nation-kenya',
    name: 'Daily Nation Kenya',
    url: 'https://nation.africa/kenya/news/-/1056/1056.rss',
    country: 'kenya',
    language: 'en',
    category: 'general',
    credibility_score: 8.0,
    political_lean: 'center'
  },
  {
    id: 'punch-nigeria',
    name: 'The Punch Nigeria',
    url: 'https://punchng.com/feed/',
    country: 'nigeria',
    language: 'en',
    category: 'general',
    credibility_score: 7.5,
    political_lean: 'center'
  },
  {
    id: 'news24-south-africa',
    name: 'News24 South Africa',
    url: 'https://feeds.news24.com/articles/news24/TopStories/rss',
    country: 'south-africa',
    language: 'en',
    category: 'general',
    credibility_score: 8.0,
    political_lean: 'center'
  },
  {
    id: 'ghana-web',
    name: 'GhanaWeb',
    url: 'https://www.ghanaweb.com/GhanaHomePage/rss/news.xml',
    country: 'ghana',
    language: 'en',
    category: 'general',
    credibility_score: 7.0,
    political_lean: 'center'
  },
  {
    id: 'ethiopia-reporter',
    name: 'The Ethiopian Reporter',
    url: 'https://www.ethiopianreporter.com/feed/',
    country: 'ethiopia',
    language: 'en',
    category: 'general',
    credibility_score: 7.5,
    political_lean: 'center'
  },
  {
    id: 'morocco-world-news',
    name: 'Morocco World News',
    url: 'https://www.moroccoworldnews.com/feed/',
    country: 'morocco',
    language: 'en',
    category: 'general',
    credibility_score: 7.5,
    political_lean: 'center'
  }
]

export class RSSAggregationService {
  static async fetchAndProcessRSSFeed(source) {
    try {
      // In a real implementation, this would use a CORS proxy or backend service
      // For now, we'll simulate with enhanced mock data
      const mockArticles = await this.generateMockArticlesForSource(source)
      
      // Process each article with AI
      const processedArticles = []
      for (const article of mockArticles) {
        try {
          // Generate African context analysis
          const africanContext = await GeminiService.analyzeAfricanContext(article)
          
          // Determine trending status
          const trendingScore = await GeminiService.calculateTrendingScore(article)
          
          // Generate tags
          const aiTags = await GeminiService.generateTags(article)
          
          // Calculate credibility score
          const credibilityScore = await GeminiService.assessCredibility(article, source)
          
          const processedArticle = {
            ...article,
            source_id: source.id,
            source_name: source.name,
            source_credibility: source.credibility_score,
            political_lean: source.political_lean,
            african_context: africanContext,
            trending_score: trendingScore,
            is_trending: trendingScore > 0.7,
            ai_tags: aiTags,
            credibility_score: credibilityScore,
            processed_at: new Date().toISOString()
          }
          
          processedArticles.push(processedArticle)
        } catch (error) {
          console.error(`Error processing article: ${article.title}`, error)
        }
      }
      
      return processedArticles
    } catch (error) {
      console.error(`Error fetching RSS for ${source.name}:`, error)
      return []
    }
  }

  static async generateMockArticlesForSource(source) {
    const topics = {
      'kenya': [
        'Nairobi tech hub attracts international investors',
        'Kenya leads East Africa in renewable energy adoption',
        'Coffee farmers benefit from new mobile payment system',
        'Wildlife conservation efforts show promising results'
      ],
      'nigeria': [
        'Lagos fintech startups raise record funding',
        'Nigeria oil production reaches new milestone',
        'Nollywood films gain international recognition',
        'Agricultural technology transforms rural communities'
      ],
      'south-africa': [
        'Cape Town becomes African tech capital',
        'Mining sector adopts sustainable practices',
        'Rugby team wins continental championship',
        'Renewable energy projects reduce load shedding'
      ],
      'ghana': [
        'Accra hosts major African economic summit',
        'Cocoa farmers adopt climate-smart agriculture',
        'Ghana card digital ID system expands services',
        'Music industry exports reach record highs'
      ],
      'ethiopia': [
        'Addis Ababa light rail system expands network',
        'Coffee exports break previous records',
        'Ethiopian airlines adds new African routes',
        'Renewable energy from Grand Renaissance Dam'
      ],
      'morocco': [
        'Casablanca finance city attracts regional banks',
        'Solar energy projects power rural communities',
        'World Cup infrastructure boosts tourism',
        'Moroccan filmmakers win international awards'
      ],
      'international': [
        'African Union addresses climate change initiatives',
        'Continental free trade area shows economic growth',
        'Digital transformation accelerates across Africa',
        'Youth entrepreneurship programs launch continent-wide'
      ]
    }

    const countryTopics = topics[source.country] || topics['international']
    const selectedTopic = countryTopics[Math.floor(Math.random() * countryTopics.length)]
    
    return [{
      id: `${source.id}-${Date.now()}`,
      title: selectedTopic,
      description: `${selectedTopic} - Detailed coverage of this developing story with analysis and local context.`,
      url: `https://example.com/${source.id}/${Date.now()}`,
      thumbnail: `https://images.pexels.com/photos/${2000000 + Math.floor(Math.random() * 1000000)}/pexels-photo-${2000000 + Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=800`,
      published_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      content: `This is a comprehensive article about ${selectedTopic.toLowerCase()}. The story covers multiple aspects including economic impact, social implications, and future prospects for the region.`,
      category: this.categorizeArticle(selectedTopic),
      country_focus: [source.country],
      language: source.language
    }]
  }

  static categorizeArticle(title) {
    const titleLower = title.toLowerCase()
    if (titleLower.includes('tech') || titleLower.includes('digital') || titleLower.includes('fintech')) return 'technology'
    if (titleLower.includes('economy') || titleLower.includes('business') || titleLower.includes('investment')) return 'business'
    if (titleLower.includes('politics') || titleLower.includes('government') || titleLower.includes('policy')) return 'politics'
    if (titleLower.includes('sport') || titleLower.includes('football') || titleLower.includes('rugby')) return 'sports'
    if (titleLower.includes('music') || titleLower.includes('film') || titleLower.includes('entertainment')) return 'entertainment'
    if (titleLower.includes('health') || titleLower.includes('medical') || titleLower.includes('hospital')) return 'health'
    return 'general'
  }

  static async aggregateAllSources() {
    console.log('Starting RSS aggregation for African news sources...')
    const allArticles = []
    
    for (const source of AFRICAN_RSS_SOURCES) {
      try {
        const articles = await this.fetchAndProcessRSSFeed(source)
        allArticles.push(...articles)
        console.log(`Processed ${articles.length} articles from ${source.name}`)
      } catch (error) {
        console.error(`Failed to process ${source.name}:`, error)
      }
    }
    
    // Store articles in Supabase
    if (allArticles.length > 0) {
      await this.storeArticles(allArticles)
    }
    
    console.log(`Total articles aggregated: ${allArticles.length}`)
    return allArticles
  }

  static async storeArticles(articles) {
    try {
      // Insert articles into posts table
      const { data, error } = await supabase
        .from('posts')
        .upsert(articles.map(article => ({
          id: article.id,
          title: article.title,
          content: article.content,
          description: article.description,
          url: article.url,
          thumbnail: article.thumbnail,
          source: article.source_name,
          category_id: null, // You'd need to map to category IDs
          category: article.category,
          country_focus: article.country_focus,
          language: article.language,
          published_at: article.published_at,
          is_trending: article.is_trending,
          engagement_score: article.trending_score || 0,
          credibility_score: article.credibility_score || 5.0,
          tags: article.ai_tags || []
        })), {
          onConflict: 'url'
        })

      if (error) {
        console.error('Error storing articles:', error)
      } else {
        console.log(`Successfully stored ${articles.length} articles`)
      }
    } catch (error) {
      console.error('Error in storeArticles:', error)
    }
  }

  static async startPeriodicAggregation() {
    // Run immediately
    await this.aggregateAllSources()
    
    // Then run every 30 minutes
    setInterval(async () => {
      await this.aggregateAllSources()
    }, 30 * 60 * 1000)
  }
}