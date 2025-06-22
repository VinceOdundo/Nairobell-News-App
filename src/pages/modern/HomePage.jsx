import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Clock, 
  MapPin, 
  Users, 
  Zap,
  Globe,
  Heart,
  Star
} from 'lucide-react'
import ModernNavbar from '../../components/modern/ModernNavbar'
import NewsFeed from '../../components/modern/NewsFeed'
import ArticleCard from '../../components/modern/ArticleCard'
import { NewsService } from '../../services/newsService'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Loading'

export default function HomePage() {
  const { user, profile } = useAuth()
  const [trendingTopics, setTrendingTopics] = useState([])
  const [trendingArticles, setTrendingArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrendingContent()
  }, [])

  const loadTrendingContent = async () => {
    try {
      const [topics, articles] = await Promise.all([
        NewsService.getTrendingTopics(),
        NewsService.getArticles({ trending: true, limit: 5 })
      ])
      
      setTrendingTopics(topics)
      setTrendingArticles(articles.articles)
    } catch (error) {
      console.error('Error loading trending content:', error)
    } finally {
      setLoading(false)
    }
  }

  const greeting = () => {
    const hour = new Date().getHours()
    const name = profile?.first_name || 'Reader'
    
    if (hour < 12) return `Good morning, ${name}`
    if (hour < 17) return `Good afternoon, ${name}`
    return `Good evening, ${name}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <div className="flex justify-center items-center h-96">
          <Loading />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">{greeting()}</h1>
                <p className="text-orange-100">
                  Welcome to your personalized African news experience
                </p>
              </div>
              <div className="hidden md:flex items-center gap-6 text-orange-100">
                <div className="text-center">
                  <div className="flex items-center gap-1 mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">Streak</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {profile?.reading_streak || 0}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-4 h-4" />
                    <span className="text-sm">Points</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {profile?.points || 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <NewsFeed personalized={!!user} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trending Topics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold text-gray-900">Trending Topics</h2>
              </div>
              
              <div className="space-y-3">
                {trendingTopics.slice(0, 5).map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{topic.topic}</p>
                      <p className="text-xs text-gray-500">{topic.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-600">
                          {Math.round(topic.score * 10)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Trending Articles */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold text-gray-900">Trending Now</h2>
              </div>
              
              <div className="space-y-4">
                {trendingArticles.slice(0, 3).map((article, index) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    compact={true}
                    showActions={false}
                  />
                ))}
              </div>
            </motion.div>

            {/* Community Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold text-gray-900">Community</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Active Readers</span>
                  </div>
                  <span className="font-bold text-gray-900">12,847</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Stories Shared</span>
                  </div>
                  <span className="font-bold text-gray-900">3,245</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Countries</span>
                  </div>
                  <span className="font-bold text-gray-900">54</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            {!user && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white"
              >
                <h3 className="text-lg font-bold mb-2">Join Nairobell</h3>
                <p className="text-orange-100 text-sm mb-4">
                  Get personalized news, bookmark articles, and join the conversation
                </p>
                <button className="w-full px-4 py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors">
                  Sign Up Free
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}