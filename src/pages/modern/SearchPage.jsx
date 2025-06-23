import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Clock, 
  TrendingUp, 
  Globe,
  Mic,
  Settings,
  BookmarkPlus,
  Share2,
  Volume2,
  Languages
} from 'lucide-react'
import { OptimizedNewsService } from '../../services/optimizedNewsService'
import { AfricanNewsService } from '../../services/africanNewsService'
import { EnhancedGeminiService } from '../../services/enhancedGeminiService'
import ArticleCard from '../../components/modern/ArticleCard'
import Loading from '../../components/Loading'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const SearchPage = () => {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [filters, setFilters] = useState({
    category: 'all',
    country: 'all',
    timeRange: 'all',
    language: 'all',
    sortBy: 'relevance'
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [voiceSearching, setVoiceSearching] = useState(false)

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'politics', name: 'Politics' },
    { id: 'business', name: 'Business' },
    { id: 'technology', name: 'Technology' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'sports', name: 'Sports' },
    { id: 'health', name: 'Health' }
  ]

  const countries = [
    { id: 'all', name: 'All Countries', flag: '🌍' },
    { id: 'nigeria', name: 'Nigeria', flag: '🇳🇬' },
    { id: 'kenya', name: 'Kenya', flag: '🇰🇪' },
    { id: 'south-africa', name: 'South Africa', flag: '🇿🇦' },
    { id: 'ghana', name: 'Ghana', flag: '🇬🇭' },
    { id: 'ethiopia', name: 'Ethiopia', flag: '🇪🇹' },
    { id: 'egypt', name: 'Egypt', flag: '🇪🇬' },
    { id: 'morocco', name: 'Morocco', flag: '🇲🇦' }
  ]

  const timeRanges = [
    { id: 'all', name: 'All Time' },
    { id: 'today', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' }
  ]

  const languages = [
    { id: 'all', name: 'All Languages' },
    { id: 'en', name: 'English' },
    { id: 'sw', name: 'Swahili' },
    { id: 'ha', name: 'Hausa' },
    { id: 'yo', name: 'Yoruba' },
    { id: 'am', name: 'Amharic' },
    { id: 'zu', name: 'Zulu' }
  ]

  const sortOptions = [
    { id: 'relevance', name: 'Most Relevant' },
    { id: 'date', name: 'Most Recent' },
    { id: 'engagement', name: 'Most Popular' },
    { id: 'credibility', name: 'Most Credible' }
  ]

  const trendingSearches = [
    '2025 African economic outlook',
    'climate change adaptation',
    'fintech growth',
    'renewable energy projects',
    'youth entrepreneurship',
    'digital transformation'
  ]

  useEffect(() => {
    loadSearchHistory()
    generateSearchSuggestions()
  }, [])

  useEffect(() => {
    if (query.length > 2) {
      const timeoutId = setTimeout(performSearch, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setResults([])
    }
  }, [query, filters])

  const loadSearchHistory = () => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    setSearchHistory(history.slice(0, 5))
  }

  const saveSearchToHistory = (searchQuery) => {
    if (!searchQuery.trim()) return
    
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    const newHistory = [searchQuery, ...history.filter(item => item !== searchQuery)].slice(0, 10)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
    setSearchHistory(newHistory.slice(0, 5))
  }

  const generateSearchSuggestions = async () => {
    try {
      const trending = await AfricanNewsService.getTrendingAfricanTopics()
      const suggestions = trending.slice(0, 4).map(topic => topic.topic || topic.title)
      setSearchSuggestions(suggestions)
    } catch (error) {
      console.error('Error generating suggestions:', error)
    }
  }

  const performSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const searchFilters = {
        category: filters.category === 'all' ? null : filters.category,
        country: filters.country === 'all' ? null : filters.country,
        language: filters.language === 'all' ? null : filters.language,
        limit: 20
      }

      const searchResults = await OptimizedNewsService.searchArticles(query, searchFilters)
      
      // Sort results based on selected option
      let sortedResults = searchResults.articles || []
      switch (filters.sortBy) {
        case 'date':
          sortedResults.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
          break
        case 'engagement':
          sortedResults.sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0))
          break
        case 'credibility':
          sortedResults.sort((a, b) => (b.credibility_score || 0) - (a.credibility_score || 0))
          break
        default:
          // Keep relevance order from search
          break
      }

      setResults(sortedResults)
      saveSearchToHistory(query)
    } catch (error) {
      console.error('Error performing search:', error)
      toast.error('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceSearch = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Voice search not supported in this browser')
      return
    }

    setVoiceSearching(true)
    const recognition = new window.webkitSpeechRecognition()
    recognition.language = 'en-US'
    recognition.onresult = (event) => {
      const voiceQuery = event.results[0][0].transcript
      setQuery(voiceQuery)
      setVoiceSearching(false)
    }
    recognition.onerror = () => {
      setVoiceSearching(false)
      toast.error('Voice search failed')
    }
    recognition.start()
  }

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="flex items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                  placeholder="Search African news, topics, or keywords..."
                  className="w-full pl-10 pr-16 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <button
                    onClick={handleVoiceSearch}
                    disabled={voiceSearching}
                    className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {voiceSearching ? (
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={performSearch}
                disabled={loading}
                className="ml-3 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                Search
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Country Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={filters.country}
                    onChange={(e) => handleFilterChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  >
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={filters.language}
                    onChange={(e) => handleFilterChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  >
                    {languages.map(lang => (
                      <option key={lang.id} value={lang.id}>{lang.name}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search History and Suggestions */}
        {!query && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Recent Searches */}
            {searchHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  Recent Searches
                </h3>
                <div className="space-y-2">
                  {searchHistory.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="w-full text-left px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-sm"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Trending Searches
              </h3>
              <div className="space-y-2">
                {trendingSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(search)}
                    className="w-full text-left px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-sm"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results ({results.length})
              </h2>
              <div className="text-sm text-gray-500">
                Searched for: "{query}"
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ArticleCard article={article} showBias showCredibility />
                </motion.div>
              ))}
            </div>
          </div>
        ) : query && !loading ? (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setQuery('')
                setFilters({
                  category: 'all',
                  country: 'all',
                  timeRange: 'all',
                  language: 'all',
                  sortBy: 'relevance'
                })
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default SearchPage
