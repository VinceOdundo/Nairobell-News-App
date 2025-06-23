import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Globe, 
  MapPin, 
  BookOpen, 
  Zap,
  Users,
  Calendar,
  Filter,
  Play,
  Headphones
} from 'lucide-react'
import { AfricanNewsService } from '../../services/africanNewsService'
import { OptimizedNewsService } from '../../services/optimizedNewsService'
import { EnhancedGeminiService } from '../../services/enhancedGeminiService'
import ArticleCard from '../../components/modern/ArticleCard'
import Loading from '../../components/Loading'
import toast from 'react-hot-toast'

const ExplorePage = () => {
  const [trendingTopics, setTrendingTopics] = useState([])
  const [featuredStories, setFeaturedStories] = useState([])
  const [localNews, setLocalNews] = useState([])
  const [audioSummaries, setAudioSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [impactAnalysis, setImpactAnalysis] = useState(null)

  const regions = [
    { id: 'all', name: 'All Africa', icon: '🌍' },
    { id: 'west', name: 'West Africa', icon: '🇳🇬' },
    { id: 'east', name: 'East Africa', icon: '🇰🇪' },
    { id: 'north', name: 'North Africa', icon: '🇪🇬' },
    { id: 'south', name: 'Southern Africa', icon: '🇿🇦' },
    { id: 'central', name: 'Central Africa', icon: '🇨🇩' }
  ]

  useEffect(() => {
    loadExploreData()
  }, [selectedRegion])

  const loadExploreData = async () => {
    try {
      setLoading(true)

      // Load trending topics
      const trending = await AfricanNewsService.getTrendingAfricanTopics()
      setTrendingTopics(trending.slice(0, 6))

      // Load featured stories
      const featured = await OptimizedNewsService.getArticles({
        limit: 8,
        trending: true
      })
      setFeaturedStories(featured.articles)

      // Load local news if region is selected
      if (selectedRegion !== 'all') {
        const local = await AfricanNewsService.getAfricanNewsFeed({
          limit: 6,
          includeLocalContext: true
        })
        setLocalNews(local.articles)
      }

      // Generate impact analysis for major stories
      if (featured.articles.length > 0) {
        const analysis = await generateImpactAnalysis(featured.articles[0])
        setImpactAnalysis(analysis)
      }

    } catch (error) {
      console.error('Error loading explore data:', error)
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const generateImpactAnalysis = async (article) => {
    try {
      const prompt = `
        Analyze the personal impact of this news story for African readers:
        
        Title: ${article.title}
        Description: ${article.description}
        Countries: ${article.country_focus?.join(', ') || 'Africa'}
        
        Provide a brief analysis of:
        1. How this might affect everyday life
        2. Economic implications for individuals
        3. Social/cultural impact
        4. What actions people might consider
        
        Keep it concise and relevant to African context.
      `
      
      const analysis = await EnhancedGeminiService.generateResponse(prompt)
      return analysis
    } catch (error) {
      console.error('Error generating impact analysis:', error)
      return null
    }
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold mb-4">
              Explore Africa 🌍
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Discover trending stories, local insights, and the pulse of the continent
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Region Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Explore by Region</h2>
          <div className="flex flex-wrap gap-3">
            {regions.map(region => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedRegion === region.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-orange-50'
                }`}
              >
                <span>{region.icon}</span>
                <span className="text-sm font-medium">{region.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trending Topics */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingTopics.map((topic, index) => (
              <motion.div
                key={topic.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {topic.topic || topic.title}
                  </h3>
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                    #{index + 1}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {topic.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {topic.affected_countries?.join(', ') || 'Africa-wide'}
                  </span>
                  <span className="text-xs font-medium text-orange-600">
                    Trending Score: {topic.trend_score || '8.5'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Impact Analysis for Major Story */}
        {impactAnalysis && (
          <section className="mb-10">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">Personal Impact Analysis</h2>
              </div>
              <div className="prose text-gray-700">
                <p className="text-sm text-gray-600 mb-3">How this news affects you:</p>
                <div className="whitespace-pre-line text-sm">{impactAnalysis}</div>
              </div>
            </div>
          </section>
        )}

        {/* Featured Stories */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">Featured Stories</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStories.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ArticleCard article={article} showBias />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Audio Summaries Section */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Headphones className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">Audio News</h2>
            <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded-full">
              Data Friendly
            </span>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-gray-600 mb-4">
              Listen to AI-generated news summaries in your preferred African language.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                <Play className="w-4 h-4" />
                <span>Today's Headlines (EN)</span>
                <span className="text-xs opacity-75">2 min</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <Play className="w-4 h-4" />
                <span>Top Stories (Swahili)</span>
                <span className="text-xs opacity-75">3 min</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                <Play className="w-4 h-4" />
                <span>Weekly Digest (Hausa)</span>
                <span className="text-xs opacity-75">5 min</span>
              </button>
            </div>
          </div>
        </section>

        {/* Local News (if region selected) */}
        {selectedRegion !== 'all' && localNews.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">
                {regions.find(r => r.id === selectedRegion)?.name} News
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localNews.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ArticleCard article={article} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default ExplorePage
