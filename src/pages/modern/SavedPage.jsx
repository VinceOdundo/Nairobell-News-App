import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Bookmark, 
  Download, 
  Share2, 
  Trash2,
  Filter,
  Search,
  Calendar,
  Tag,
  Globe,
  Archive,
  BookOpen,
  Star
} from 'lucide-react'
import { OptimizedNewsService } from '../../services/optimizedNewsService'
import { OfflineService } from '../../services/offlineService'
import { useAuth } from '../../contexts/AuthContext'
import ArticleCard from '../../components/modern/ArticleCard'
import Loading from '../../components/Loading'
import toast from 'react-hot-toast'

const SavedPage = () => {
  const { user } = useAuth()
  const [savedArticles, setSavedArticles] = useState([])
  const [offlineArticles, setOfflineArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('bookmarks')
  const [filters, setFilters] = useState({
    category: 'all',
    timeRange: 'all',
    tags: []
  })
  const [searchQuery, setSearchQuery] = useState('')

  const tabs = [
    { id: 'bookmarks', name: 'Bookmarked', icon: Bookmark, count: savedArticles.length },
    { id: 'offline', name: 'Offline', icon: Download, count: offlineArticles.length },
    { id: 'archive', name: 'Archive', icon: Archive, count: 0 }
  ]

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'politics', name: 'Politics' },
    { id: 'business', name: 'Business' },
    { id: 'technology', name: 'Technology' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'sports', name: 'Sports' },
    { id: 'health', name: 'Health' }
  ]

  const timeRanges = [
    { id: 'all', name: 'All Time' },
    { id: 'today', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' }
  ]

  useEffect(() => {
    if (user) {
      loadSavedContent()
    }
  }, [user, activeTab])

  const loadSavedContent = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'bookmarks') {
        // Load bookmarked articles
        const bookmarks = await OptimizedNewsService.getUserBookmarks(user.id)
        setSavedArticles(bookmarks)
      } else if (activeTab === 'offline') {
        // Load offline articles
        const offline = await OfflineService.getOfflineArticles()
        setOfflineArticles(offline)
      }
    } catch (error) {
      console.error('Error loading saved content:', error)
      toast.error('Failed to load saved content')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBookmark = async (articleId) => {
    try {
      await OptimizedNewsService.toggleBookmark(user.id, articleId)
      setSavedArticles(prev => prev.filter(article => article.id !== articleId))
      toast.success('Bookmark removed')
    } catch (error) {
      console.error('Error removing bookmark:', error)
      toast.error('Failed to remove bookmark')
    }
  }

  const handleDownloadForOffline = async (article) => {
    try {
      await OfflineService.saveArticleOffline(article)
      toast.success('Article saved for offline reading')
    } catch (error) {
      console.error('Error saving offline:', error)
      toast.error('Failed to save for offline')
    }
  }

  const handleRemoveOffline = async (articleId) => {
    try {
      await OfflineService.removeOfflineArticle(articleId)
      setOfflineArticles(prev => prev.filter(article => article.id !== articleId))
      toast.success('Removed from offline storage')
    } catch (error) {
      console.error('Error removing offline article:', error)
      toast.error('Failed to remove offline article')
    }
  }

  const handleShare = async (article) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.url
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(article.url)
      toast.success('Link copied to clipboard')
    }
  }

  const filteredArticles = () => {
    const articles = activeTab === 'bookmarks' ? savedArticles : offlineArticles
    let filtered = articles

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(article => article.category === filters.category)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query)
      )
    }

    // Apply time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date()
      const timeRangeMs = {
        today: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      }
      
      const cutoff = new Date(now.getTime() - timeRangeMs[filters.timeRange])
      filtered = filtered.filter(article => 
        new Date(article.saved_at || article.published_at) > cutoff
      )
    }

    return filtered
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to access saved content</h2>
          <p className="text-gray-600">
            Bookmark articles and save them for offline reading
          </p>
        </div>
      </div>
    )
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-500" />
                Saved Content
              </h1>
              <p className="text-gray-600 mt-1">
                Your bookmarked articles and offline reading list
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => toast.info('Sync feature coming soon')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Sync Offline
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
                {tab.count > 0 && (
                  <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved articles..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Time Range Filter */}
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {timeRanges.map(range => (
                <option key={range.id} value={range.id}>
                  {range.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {filteredArticles().length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles().map((article, index) => (
              <motion.div
                key={`${activeTab}-${article.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <ArticleCard 
                  article={article} 
                  showActions={false}
                />
                
                {/* Action Overlay */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg p-1">
                    <button
                      onClick={() => handleShare(article)}
                      className="p-2 text-gray-600 hover:text-blue-500 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    
                    {activeTab === 'bookmarks' && (
                      <>
                        <button
                          onClick={() => handleDownloadForOffline(article)}
                          className="p-2 text-gray-600 hover:text-green-500 transition-colors"
                          title="Save for offline"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveBookmark(article.id)}
                          className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                          title="Remove bookmark"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {activeTab === 'offline' && (
                      <button
                        onClick={() => handleRemoveOffline(article.id)}
                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                        title="Remove from offline"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Saved Date */}
                <div className="absolute bottom-3 left-3 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  Saved {new Date(article.saved_at || article.published_at).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {activeTab === 'bookmarks' ? (
              <>
                <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarked articles</h3>
                <p className="text-gray-600 mb-4">
                  Start bookmarking articles you want to read later
                </p>
              </>
            ) : activeTab === 'offline' ? (
              <>
                <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No offline articles</h3>
                <p className="text-gray-600 mb-4">
                  Save articles for offline reading when you're without internet
                </p>
              </>
            ) : (
              <>
                <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Archive is empty</h3>
                <p className="text-gray-600 mb-4">
                  Archived articles will appear here
                </p>
              </>
            )}
            
            <button
              onClick={() => window.location.href = '/home'}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Browse News
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedPage
