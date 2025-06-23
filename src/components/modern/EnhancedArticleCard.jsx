import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Bookmark,
  BookmarkCheck,
  Share2,
  MessageCircle,
  TrendingUp,
  Clock,
  Volume2,
  VolumeX,
  Languages,
  Eye,
  Lightbulb,
  Heart,
  ExternalLink,
  MapPin,
  User,
  Zap,
  Star,
  MoreHorizontal,
  Download,
  Copy,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Repeat
} from 'lucide-react';
import { AudioNewsService } from '../../services/audioNewsService';
import { InteractiveStoryService } from '../../services/interactiveStoryService';
import { AnalyticsService } from '../../services/analyticsService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  politics: 'bg-red-100 text-red-800 border-red-200',
  business: 'bg-green-100 text-green-800 border-green-200',
  technology: 'bg-blue-100 text-blue-800 border-blue-200',
  entertainment: 'bg-purple-100 text-purple-800 border-purple-200',
  sports: 'bg-orange-100 text-orange-800 border-orange-200',
  health: 'bg-pink-100 text-pink-800 border-pink-200',
  general: 'bg-gray-100 text-gray-800 border-gray-200'
}

const COUNTRY_FLAGS = {
  'kenya': '🇰🇪',
  'nigeria': '🇳🇬',
  'south-africa': '🇿🇦',
  'ethiopia': '🇪🇹',
  'ghana': '🇬🇭',
  'morocco': '🇲🇦',
  'egypt': '🇪🇬',
  'tunisia': '🇹🇳',
  'uganda': '🇺🇬',
  'tanzania': '🇹🇿'
}

export default function EnhancedArticleCard({ 
  article, 
  viewMode = 'feed',
  showInteractive = true,
  showAudio = true,
  showAnalytics = true,
  onRead,
  onBookmark,
  onShare,
  className = '' 
}) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState(null);
  const [showLanguages, setShowLanguages] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showInteractiveStory, setShowInteractiveStory] = useState(false);
  const [interactiveStory, setInteractiveStory] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [likes, setLikes] = useState(article.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  
  const cardRef = useRef(null);
  const audioRef = useRef(null);
  const [showSummary, setShowSummary] = useState(false)
  const [summary, setSummary] = useState('')
  const [summaryType, setSummaryType] = useState('standard')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [viewCount, setViewCount] = useState(article.views_count || 0)
  const [showDiscussion, setShowDiscussion] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [translatedContent, setTranslatedContent] = useState('')
  const [personalImpact, setPersonalImpact] = useState('')
  const [showPersonalImpact, setShowPersonalImpact] = useState(false)
  const [credibilityScore] = useState(article.credibility_score || 7.5)

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
      setIsBookmarked(!isBookmarked)
      
      if (!isBookmarked) {
        // Add bookmark
        const { error } = await supabase
          .from('enhanced_bookmarks')
          .insert([{
            user_id: user.id,
            post_id: article.id
          }])
        
        if (error) throw error
        toast.success('Article bookmarked')
      } else {
        // Remove bookmark
        const { error } = await supabase
          .from('enhanced_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', article.id)
        
        if (error) throw error
        toast.success('Bookmark removed')
      }
    } catch (error) {
      setIsBookmarked(isBookmarked)
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
        
        // Award points for sharing
        if (user) {
          await awardPoints(5, 'share')
        }
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      await navigator.clipboard.writeText(article.url)
      toast.success('Link copied to clipboard')
    }
  }

  const handleSummary = async (e, type = 'standard') => {
    e.stopPropagation()
    
    if (showSummary && summaryType === type && summary) {
      setShowSummary(false)
      return
    }
    
    setLoadingSummary(true)
    setSummaryType(type)
    
    try {
      const generatedSummary = await EnhancedGeminiService.generateAfricanContextSummary(
        article, 
        type, 
        profile?.preferred_language || 'en'
      )
      setSummary(generatedSummary)
      setShowSummary(true)
      
      // Award points for using AI features
      if (user) {
        await awardPoints(2, 'ai_usage')
      }
    } catch (error) {
      toast.error('Failed to generate summary')
      console.error('Summary error:', error)
    } finally {
      setLoadingSummary(false)
    }
  }

  const handlePersonalImpact = async (e) => {
    e.stopPropagation()
    
    if (!user || !profile) {
      toast.error('Please complete your profile to get personalized impact')
      return
    }
    
    if (showPersonalImpact && personalImpact) {
      setShowPersonalImpact(false)
      return
    }
    
    setLoadingSummary(true)
    try {
      const impact = await EnhancedGeminiService.generatePersonalizedImpact(article, profile)
      setPersonalImpact(impact)
      setShowPersonalImpact(true)
    } catch (error) {
      toast.error('Failed to generate personal impact analysis')
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleTranslate = async (e) => {
    e.stopPropagation()
    
    if (!profile?.preferred_language || profile.preferred_language === 'en') {
      toast.error('Please set your preferred language in settings')
      return
    }
    
    if (showTranslation && translatedContent) {
      setShowTranslation(false)
      return
    }
    
    setLoadingSummary(true)
    try {
      const translated = await EnhancedGeminiService.translateWithCulturalContext(
        article.description,
        'en',
        profile.preferred_language
      )
      setTranslatedContent(translated)
      setShowTranslation(true)
      
      // Award points for using translation
      if (user) {
        await awardPoints(3, 'translation')
      }
    } catch (error) {
      toast.error('Translation failed')
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleReadArticle = async () => {
    // Record reading activity
    if (user) {
      try {
        await supabase
          .from('reading_history')
          .insert([{
            user_id: user.id,
            post_id: article.id,
            interaction_type: 'read',
            device_type: 'mobile'
          }])
        
        // Award points for reading
        await awardPoints(1, 'read')
      } catch (error) {
        console.error('Error recording reading activity:', error)
      }
    }
    
    // Increment view count
    setViewCount(prev => prev + 1)
    
    // Open article
    window.open(article.url, '_blank', 'noopener,noreferrer')
  }

  const awardPoints = async (points, activity) => {
    try {
      await supabase
        .from('profiles')
        .update({ points: supabase.raw(`points + ${points}`) })
        .eq('id', user.id)
    } catch (error) {
      console.error('Error awarding points:', error)
    }
  }

  const getCredibilityColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-100'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getCredibilityIcon = (score) => {
    if (score >= 8) return <CheckCircle className="w-3 h-3" />
    if (score >= 6) return <AlertTriangle className="w-3 h-3" />
    return <AlertTriangle className="w-3 h-3" />
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
          loading="lazy"
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
    <>
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
            loading="lazy"
          />
          
          {/* Overlay indicators */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
              CATEGORY_COLORS[article.category] || CATEGORY_COLORS.general
            }`}>
              {article.category}
            </span>
            
            {article.is_trending && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Trending
              </span>
            )}

            {article.is_breaking && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 animate-pulse">
                🚨 Breaking
              </span>
            )}
          </div>

          {/* Country flags and credibility */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <div className="flex items-center gap-1">
              {article.country_focus?.slice(0, 3).map(country => (
                <span key={country} className="text-lg">
                  {COUNTRY_FLAGS[country] || '🌍'}
                </span>
              ))}
            </div>
            
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCredibilityColor(credibilityScore)}`}>
              {getCredibilityIcon(credibilityScore)}
              {credibilityScore.toFixed(1)}
            </span>
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
            {showTranslation && translatedContent ? translatedContent : article.description}
          </p>

          {/* Personal Impact Analysis */}
          <AnimatePresence>
            {showPersonalImpact && personalImpact && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Personal Impact</span>
                </div>
                <p className="text-sm text-purple-700">{personalImpact}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Summary */}
          <AnimatePresence>
            {showSummary && summary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    AI Summary ({summaryType})
                  </span>
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
            <div className="space-y-3">
              {/* Primary Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={(e) => handleSummary(e, 'standard')}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      <Zap className="w-3 h-3" />
                      {loadingSummary && summaryType === 'standard' ? 'Loading...' : 'AI Summary'}
                    </button>
                  </div>
                  
                  {profile?.preferred_language && profile.preferred_language !== 'en' && (
                    <button
                      onClick={handleTranslate}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-full hover:bg-green-100 transition-colors"
                    >
                      <Languages className="w-3 h-3" />
                      {loadingSummary && showTranslation ? 'Translating...' : 'Translate'}
                    </button>
                  )}
                  
                  {user && (
                    <button
                      onClick={handlePersonalImpact}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-full hover:bg-purple-100 transition-colors"
                    >
                      <Heart className="w-3 h-3" />
                      Impact
                    </button>
                  )}
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
                    onClick={() => setShowDiscussion(true)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Secondary Summary Options */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={(e) => handleSummary(e, 'eli5')}
                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  ELI5 Summary
                </button>
                <span className="text-gray-300">•</span>
                <button
                  onClick={(e) => handleSummary(e, 'impact')}
                  className="text-xs text-gray-500 hover:text-green-600 transition-colors"
                >
                  Impact Analysis
                </button>
                <span className="text-gray-300">•</span>
                <button
                  onClick={() => toast.info('Audio feature coming soon!')}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors"
                >
                  <Headphones className="w-3 h-3" />
                  Listen
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.article>

      {/* Community Discussion Modal */}
      <AnimatePresence>
        {showDiscussion && (
          <CommunityDiscussion
            article={article}
            onClose={() => setShowDiscussion(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}