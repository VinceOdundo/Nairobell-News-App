import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Filter, 
  Search,
  RefreshCw,
  Settings,
  AlertCircle
} from 'lucide-react'
import EnhancedArticleCard from './EnhancedArticleCard'
import { 
  useInfiniteArticles, 
  useStaticData, 
  useTrendingTopics 
} from '../../hooks/useOptimizedData'
import { 
  FeedLoadingSkeleton, 
  InlineLoading, 
  ErrorState, 
  EmptyState 
} from '../common/LoadingStates'
import ErrorBoundary from '../common/ErrorBoundary'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { id: 'all', label: 'All News', icon: '🌍' },
  { id: 'politics', label: 'Politics', icon: '🏛️' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎭' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'health', label: 'Health', icon: '🏥' }
]

export default function OptimizedNewsFeed({ personalized = false }) {
  const { user, profile } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Get static data
  const { countries, languages, loading: staticLoading } = useStaticData()

  // Get trending topics
  const { 
    data: trendingTopics, 
    loading: trendingLoading, 
    error: trendingError 
  } = useTrendingTopics()

  // Memoize filter options
  const filterOptions = useMemo(() => ({
    category: selectedCategory === 'all' ? null : selectedCategory,
    country: selectedCountry === 'all' ? null : selectedCountry,
    search: searchQuery.trim() || null,
    limit: 10
  }), [selectedCategory, selectedCountry, searchQuery])

  // Get infinite articles
  const {
    data: articles,
    loading,
    error,
    hasMore,
    loadMore,
    reset
  } = useInfiniteArticles(filterOptions)

  const handleRefresh = () => {
    reset()
    toast.success('Feed refreshed!')
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      reset() // Reset pagination when search changes
    }
  }

  const handleFilterChange = (type, value) => {
    if (type === 'category') {
      setSelectedCategory(value)
    } else if (type === 'country') {
      setSelectedCountry(value)
    }
    // Auto-reset when filters change due to useMemo dependency
  }

  if (staticLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <FeedLoadingSkeleton />
      </div>
    )
  }

  return (
    <ErrorBoundary componentName="OptimizedNewsFeed">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {personalized ? 'Your News' : 'Latest News'}
            </h1>
            <p className="text-gray-600 text-sm">
              {personalized 
                ? 'Personalized news based on your interests' 
                : 'Stay updated with the latest from across Africa'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh feed"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Filters"
            >
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
              placeholder="Search African news..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            />
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              {/* Categories */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleFilterChange('category', category.id)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors flex items-center gap-1 ${
                        selectedCategory === category.id
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-orange-300'
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Countries */}
              {countries.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Countries</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFilterChange('country', 'all')}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors flex items-center gap-1 ${
                        selectedCountry === 'all'
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-orange-300'
                      }`}
                    >
                      <span>🌍</span>
                      <span>All Africa</span>
                    </button>
                    {countries.slice(0, 8).map(country => (
                      <button
                        key={country.code}
                        onClick={() => handleFilterChange('country', country.code)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors flex items-center gap-1 ${
                          selectedCountry === country.code
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-orange-300'
                        }`}
                      >
                        <span>{country.flag_emoji}</span>
                        <span>{country.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trending Alert */}
        {trendingTopics && trendingTopics.length > 0 && !trendingLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Trending Now</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.slice(0, 3).map((topic, index) => (
                <span 
                  key={index}
                  className="text-sm text-orange-700 bg-orange-100 px-2 py-1 rounded-full"
                >
                  {topic.topic}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <ErrorState
            title="Failed to load articles"
            message={error.message || 'Please try again later'}
            onRetry={handleRefresh}
          />
        )}

        {/* Articles Grid */}
        {!error && (
          <>
            {articles.length === 0 && !loading ? (
              <EmptyState
                title="No articles found"
                message="Try adjusting your filters or search terms"
                icon="📰"
                action={
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      setSelectedCountry('all')
                      setSearchQuery('')
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Reset Filters
                  </button>
                }
              />
            ) : (
              <>
                <div className="grid gap-6">
                  {articles.map((article, index) => (
                    <EnhancedArticleCard
                      key={`${article.id}-${index}`}
                      article={article}
                      compact={false}
                    />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    {loading ? (
                      <InlineLoading message="Loading more articles..." />
                    ) : (
                      <button
                        onClick={loadMore}
                        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Load More Articles
                      </button>
                    )}
                  </div>
                )}

                {/* End of Feed */}
                {!hasMore && articles.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You've reached the end of the news feed</p>
                    <button
                      onClick={handleRefresh}
                      className="mt-2 text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Refresh for more stories
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}