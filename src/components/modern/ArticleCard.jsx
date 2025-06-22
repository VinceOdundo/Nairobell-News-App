import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Eye, Bookmark, Bookmark as BookmarkCheck, Share2, MessageCircle, TrendingUp, Globe, Headphones, Zap } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { NewsService } from '../../services/newsService'
import toast from 'react-hot-toast'

const CATEGORY_COLORS = {
  politics: 'bg-red-100 text-red-800 border-red-200',
  business: 'bg-green-100 text-green-800 border-green-200',
  technology: 'bg-blue-100 text-blue-800 border-blue-200',
  entertainment: 'bg-purple-100 text-purple-800 border-purple-200',
  sports: 'bg-orange-100 text-orange-800 border-orange-200',
  health: 'bg-pink-100 text-pink-800 border-pink-200'
}

const COUNTRY_FLAGS = {
  'kenya': '🇰🇪',
  'nigeria': '🇳🇬',
  'south-africa': '🇿🇦',
  'ethiopia': '🇪🇹',
  'ghana': '🇬🇭',
  'morocco': '🇲🇦',
  'egypt': '🇪🇬',
  'tunisia': '🇹🇳'
}

export default function ArticleCard({ article, compact = false, showActions = true }) {
  const { user, profile } = useAuth()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summary, setSummary] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [viewCount, setViewCount] = useState(article.view_count || 0)

  const formatTimeAgo = (date) => {
    const now = new Date()
    const published = new Date(date)
    const diffInHours = Math.floor((now - published) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return published.toLocaleDateString()
  }

  const handleBookmark = async (e) => {
    e.stopPropagation()
    if (!user) {
      toast.error('Please sign in to bookmark articles')
      return
    }

    try {
      // Toggle bookmark state optimistically
      setIsBookmarked(!isBookmarked)
      
      // In a real implementation, this would call the bookmark API
      toast.success(isBookmarked ? 'Bookmark removed' : 'Article bookmarked')
    } catch (error) {
      setIsBookmarked(isBookmarked) // Revert on error
      toast.error('Failed to bookmark article')
    }
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.url
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback for desktop
      await navigator.clipboard.writeText(article.url)
      toast.success('Link copied to clipboard')
    }
  }

  const handleSummary = async (e) => {
    e.stopPropagation()
    
    if (!showSummary && !summary) {
      setLoadingSummary(true)
      try {
        const generatedSummary = await NewsService.getArticleSummary(
          article.id, 
          'short', 
          profile?.preferred_language || 'en'
        )
        setSummary(generatedSummary)
      } catch (error) {
        toast.error('Failed to generate summary')
        return
      } finally {
        setLoadingSummary(false)
      }
    }
    
    setShowSummary(!showSummary)
  }

  const handleReadArticle = () => {
    // Record reading activity
    if (user) {
      NewsService.recordReadingActivity(user.id, article.id, {
        interaction_type: 'read',
        device_type: 'mobile'
      })
    }
    
    // Increment view count
    setViewCount(prev => prev + 1)
    
    // Open article
    window.open(article.url, '_blank', 'noopener,noreferrer')
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-all cursor-pointer"
        onClick={handleReadArticle}
      >
        <img
          src={article.thumbnail}
          alt={article.title}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-1">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{article.source}</span>
            <span>•</span>
            <span>{formatTimeAgo(article.published_at)}</span>
            {article.is_trending && (
              <>
                <span>•</span>
                <TrendingUp className="w-3 h-3 text-orange-500" />
              </>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Article Image */}
      <div className="relative cursor-pointer" onClick={handleReadArticle}>
        <img
          src={article.thumbnail}
          alt={article.title}
          className="w-full h-48 object-cover"
        />
        
        {/* Overlay indicators */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
            CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-800 border-gray-200'
          }`}>
            {article.category}
          </span>
          
          {article.is_trending && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Trending
            </span>
          )}
        </div>

        {/* Country flags */}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          {article.country_focus?.slice(0, 3).map(country => (
            <span key={country} className="text-lg">
              {COUNTRY_FLAGS[country] || '🌍'}
            </span>
          ))}
        </div>
      </div>

      {/* Article Content */}
      <div className="p-4">
        {/* Title */}
        <h2 
          className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-orange-600 transition-colors"
          onClick={handleReadArticle}
        >
          {article.title}
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {article.description}
        </p>

        {/* AI Summary */}
        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">AI Summary</span>
              </div>
              {loadingSummary ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-blue-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                </div>
              ) : (
                <p className="text-sm text-blue-700">{summary}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Article Meta */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(article.published_at)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{viewCount}</span>
          </div>
          
          <span className="font-medium text-gray-700">{article.source}</span>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSummary}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
              >
                <Zap className="w-3 h-3" />
                {loadingSummary ? 'Loading...' : showSummary ? 'Hide Summary' : 'AI Summary'}
              </button>
              
              <button
                onClick={() => toast.info('Audio feature coming soon!')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-full hover:bg-purple-100 transition-colors"
              >
                <Headphones className="w-3 h-3" />
                Listen
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmark}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-orange-600" />
                ) : (
                  <Bookmark className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Share2 className="w-4 h-4 text-gray-400" />
              </button>
              
              <button
                onClick={() => toast.info('Comments feature coming soon!')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.article>
  )
}