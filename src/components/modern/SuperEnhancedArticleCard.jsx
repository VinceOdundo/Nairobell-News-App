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
  Repeat,
  Headphones,
  Globe,
  CheckCircle,
  AlertTriangle
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

export default function SuperEnhancedArticleCard({ 
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
  const [credibilityScore] = useState(article.credibility_score || 7.5);
  const [impactScore] = useState(article.impact_score || 6.2);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedContent, setTranslatedContent] = useState('');
  
  const cardRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Track visibility for analytics
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting && showAnalytics) {
          AnalyticsService.trackEvent('article_view', {
            article_id: article.id,
            title: article.title,
            category: article.category,
            source: article.source,
            viewport_time: Date.now()
          }, user?.id);
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [article.id, user?.id, showAnalytics]);

  const handlePlayAudio = async () => {
    try {
      if (!audioData) {
        toast.loading('🎧 Generating audio...', { id: 'audio' });
        const audio = await AudioNewsService.generateAudioNews(article, {
          language: selectedLanguage,
          style: 'news'
        });
        setAudioData(audio);
        toast.success('🔊 Audio ready!', { id: 'audio' });
      }

      if (audioData?.audioBlob) {
        const audio = new Audio(URL.createObjectURL(audioData.audioBlob));
        audioRef.current = audio;
        
        audio.onended = () => setIsPlaying(false);
        audio.play();
        setIsPlaying(true);
      } else if (audioData?.script) {
        const utterance = new SpeechSynthesisUtterance(audioData.script);
        utterance.lang = selectedLanguage === 'sw' ? 'sw-KE' : 'en-US';
        utterance.onend = () => setIsPlaying(false);
        speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }

      AnalyticsService.trackEvent('audio_play', {
        article_id: article.id,
        language: selectedLanguage,
        audio_duration: audioData?.duration
      }, user?.id);

    } catch (error) {
      console.error('Audio playback error:', error);
      toast.error('🚫 Audio generation failed');
    }
  };

  const handlePauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    } else {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const handleBookmark = async () => {
    try {
      await onBookmark?.(article.id, !isBookmarked);
      setIsBookmarked(!isBookmarked);
      toast.success(isBookmarked ? '📋 Removed from saved' : '💾 Saved for later');
      
      AnalyticsService.trackEvent('bookmark', {
        article_id: article.id,
        action: !isBookmarked ? 'add' : 'remove'
      }, user?.id);
    } catch (error) {
      console.error('Bookmark error:', error);
      toast.error('❌ Failed to save article');
    }
  };

  const handleLike = async () => {
    try {
      const newLikes = hasLiked ? likes - 1 : likes + 1;
      setLikes(newLikes);
      setHasLiked(!hasLiked);
      
      AnalyticsService.trackEvent('like', {
        article_id: article.id,
        action: hasLiked ? 'unlike' : 'like'
      }, user?.id);
      
      toast.success(hasLiked ? '💔 Like removed' : '❤️ Article liked!');
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleShare = async (platform = 'general') => {
    try {
      const shareData = {
        title: `📰 ${article.title}`,
        text: `${article.description}\n\nRead more African news on Nairobell 🌍`,
        url: article.url
      };

      if (navigator.share && platform === 'general') {
        await navigator.share(shareData);
      } else {
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        toast.success('🔗 Link copied to clipboard!');
      }

      await onShare?.(article.id, platform);
      
      AnalyticsService.trackEvent('share', {
        article_id: article.id,
        platform,
        share_method: navigator.share ? 'native' : 'clipboard'
      }, user?.id);
    } catch (error) {
      console.error('Share error:', error);
      toast.error('❌ Share failed');
    }
  };

  const handleReadClick = async () => {
    setReadProgress(100);
    await onRead?.(article.id);
    
    AnalyticsService.trackEvent('article_read', {
      article_id: article.id,
      read_time: Date.now(),
      completion: 100,
      read_method: 'card_click'
    }, user?.id);

    // Open in new tab for better UX
    window.open(article.url, '_blank');
  };

  const handleInteractiveStory = async () => {
    try {
      if (!interactiveStory) {
        toast.loading('✨ Creating interactive story...', { id: 'story' });
        const story = await InteractiveStoryService.createInteractiveStory(article, {
          format: 'timeline',
          interactivity: 'medium',
          includeMedia: true
        });
        setInteractiveStory(story);
        toast.success('🎭 Interactive story ready!', { id: 'story' });
      }
      setShowInteractiveStory(true);
      
      AnalyticsService.trackEvent('interactive_story_view', {
        article_id: article.id,
        story_format: interactiveStory?.metadata?.format
      }, user?.id);
    } catch (error) {
      console.error('Interactive story error:', error);
      toast.error('❌ Failed to create interactive story');
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const published = new Date(date);
    const diffMs = now - published;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 7) return published.toLocaleDateString();
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const getTrendingBadge = () => {
    if (article.is_trending) {
      return (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute top-3 right-3 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
        >
          <TrendingUp className="w-3 h-3" />
          🔥 Trending
        </motion.div>
      );
    }
    return null;
  };

  const getCredibilityIndicator = () => {
    const color = credibilityScore >= 8 ? 'text-green-500' : 
                  credibilityScore >= 6 ? 'text-yellow-500' : 'text-red-500';
    const icon = credibilityScore >= 8 ? CheckCircle : 
                 credibilityScore >= 6 ? AlertTriangle : Flag;
    const IconComponent = icon;
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <IconComponent className="w-3 h-3" />
        <span className="text-xs font-medium">{credibilityScore.toFixed(1)}</span>
      </div>
    );
  };

  const getImpactBadge = () => {
    if (impactScore >= 7) {
      return (
        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Heart className="w-3 h-3 fill-current" />
          High Impact
        </span>
      );
    }
    return null;
  };

  const languages = AudioNewsService?.getSupportedLanguages() || [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
  ];

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
      className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden relative border border-gray-100 ${className}`}
    >
      {/* Trending Badge */}
      {getTrendingBadge()}

      {/* Hero Image with Overlay Actions */}
      {article.thumbnail && (
        <div className="relative h-48 overflow-hidden group">
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-3">
              {showAudio && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={isPlaying ? handlePauseAudio : handlePlayAudio}
                  className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 p-3 rounded-full transition-all shadow-lg"
                  title={isPlaying ? 'Pause Audio' : 'Play Audio'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </motion.button>
              )}
              
              {showInteractive && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleInteractiveStory}
                  className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 p-3 rounded-full transition-all shadow-lg"
                  title="Interactive Story"
                >
                  <Lightbulb className="w-5 h-5" />
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleReadClick}
                className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full transition-all shadow-lg"
                title="Read Full Article"
              >
                <ExternalLink className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Read Progress Bar */}
          {readProgress > 0 && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${readProgress}%` }}
                className="h-full bg-gradient-to-r from-orange-500 to-red-500"
              />
            </div>
          )}

          {/* Country Focus */}
          {article.country_focus?.length > 0 && (
            <div className="absolute bottom-3 left-3 flex gap-1">
              {article.country_focus.slice(0, 3).map((country) => (
                <span key={country} className="text-lg">
                  {COUNTRY_FLAGS[country] || '🌍'}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Header with Source and Metadata */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-orange-600 hover:text-orange-700 cursor-pointer">
              {article.source}
            </span>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="w-3 h-3" />
              <span>{getTimeAgo(article.published_at)}</span>
            </div>
            {article.reading_time && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600">{article.reading_time} min read</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {getCredibilityIndicator()}
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 
          className="font-bold text-gray-900 mb-3 line-clamp-2 hover:text-orange-600 transition-colors cursor-pointer text-lg leading-tight"
          onClick={handleReadClick}
        >
          {article.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {article.description}
        </p>

        {/* Tags and Impact */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[article.category] || CATEGORY_COLORS.general}`}>
            {article.category?.charAt(0).toUpperCase() + article.category?.slice(1)}
          </span>
          
          {getImpactBadge()}
          
          {article.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
              #{tag}
            </span>
          ))}
        </div>

        {/* Primary Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                hasLiked 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBookmark}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isBookmarked 
                  ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleShare()}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </motion.button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{article.views || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>{article.comments || 0}</span>
            </div>
          </div>
        </div>

        {/* Audio Language Selector */}
        {showAudio && (
          <AnimatePresence>
            {showLanguages && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 bg-gray-50 rounded-lg"
              >
                <p className="text-sm font-medium text-gray-700 mb-2">Choose Language:</p>
                <div className="grid grid-cols-2 gap-2">
                  {languages.slice(0, 4).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setShowLanguages(false);
                        if (audioData) setAudioData(null);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${
                        selectedLanguage === lang.code 
                          ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span className="font-medium">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Extended Actions */}
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-100"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button 
                  onClick={() => setShowLanguages(!showLanguages)}
                  className="flex items-center gap-2 p-2 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Listen</span>
                </button>
                <button className="flex items-center gap-2 p-2 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                  <Languages className="w-3 h-3" />
                  <span>Translate</span>
                </button>
                <button className="flex items-center gap-2 p-2 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
                <button className="flex items-center gap-2 p-2 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                  <Flag className="w-3 h-3" />
                  <span>Report</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Story Modal */}
      <AnimatePresence>
        {showInteractiveStory && interactiveStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowInteractiveStory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{interactiveStory.title}</h2>
                  <button
                    onClick={() => setShowInteractiveStory(false)}
                    className="text-white/80 hover:text-white text-2xl font-light"
                  >
                    ×
                  </button>
                </div>
                <p className="text-orange-100 mt-2">Interactive Story Experience</p>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                    {interactiveStory.introduction}
                  </p>
                  
                  {interactiveStory.sections?.map((section, index) => (
                    <motion.div 
                      key={section.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="mb-6 p-4 bg-gray-50 rounded-xl"
                    >
                      <h3 className="font-bold text-xl mb-3 text-gray-800">
                        {section.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {section.content}
                      </p>
                    </motion.div>
                  ))}
                  
                  {interactiveStory.keyPoints?.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-orange-50 p-6 rounded-xl border border-orange-200"
                    >
                      <h4 className="font-bold text-xl mb-4 text-orange-800 flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        Key Takeaways
                      </h4>
                      <ul className="space-y-2">
                        {interactiveStory.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-700">
                            <span className="bg-orange-200 text-orange-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
