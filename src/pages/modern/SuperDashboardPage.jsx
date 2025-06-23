import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Globe,
  Zap,
  Heart,
  Clock,
  Target,
  Award,
  BookOpen,
  Headphones,
  Eye,
  Share2,
  MessageCircle,
  Bookmark,
  Star,
  Activity,
  Calendar,
  Filter,
  Download,
  Sparkles,
  Brain,
  Map,
  Radio,
  Mic,
  Camera,
  Video,
  Music,
  Podcast
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AnalyticsService } from '../../services/analyticsService';
import { PersonalizationService } from '../../services/personalizationService';
import { AudioNewsService } from '../../services/audioNewsService';
import { InteractiveStoryService } from '../../services/interactiveStoryService';
import SuperEnhancedArticleCard from '../../components/modern/SuperEnhancedArticleCard';
import ModernNavbar from '../../components/modern/ModernNavbar';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';

export default function SuperDashboardPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [personalizedFeed, setPersonalizedFeed] = useState([]);
  const [audioPlaylists, setAudioPlaylists] = useState([]);
  const [interactiveStories, setInteractiveStories] = useState([]);
  const [timeframe, setTimeframe] = useState('30d');
  const [viewMode, setViewMode] = useState('comprehensive');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, timeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        userInsights,
        personalizedContent,
        audioContent,
        interactiveContent
      ] = await Promise.all([
        AnalyticsService.getPersonalizedInsights(user.id, timeframe),
        PersonalizationService.generatePersonalizedFeed(user.id, {
          limit: 6,
          includeAI: true,
          diversityLevel: 'high'
        }),
        loadAudioContent(),
        loadInteractiveContent()
      ]);

      setInsights(userInsights);
      setPersonalizedFeed(personalizedContent.articles || []);
      setAudioPlaylists(audioContent);
      setInteractiveStories(interactiveContent);

    } catch (error) {
      console.error('Dashboard loading error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAudioContent = async () => {
    try {
      // Mock audio playlists - replace with actual service calls
      return [
        {
          id: 'morning-brief',
          title: '🌅 Morning News Brief',
          description: 'Your personalized morning update',
          duration: '12 min',
          articles: 5,
          language: 'en',
          thumbnail: 'https://images.pexels.com/photos/3184435/pexels-photo-3184435.jpeg?auto=compress&cs=tinysrgb&w=400'
        },
        {
          id: 'business-focus',
          title: '💼 Business Focus',
          description: 'Latest African business news',
          duration: '18 min',
          articles: 7,
          language: 'en',
          thumbnail: 'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=400'
        },
        {
          id: 'local-stories',
          title: '🏠 Local Stories',
          description: 'News from your region',
          duration: '8 min',
          articles: 4,
          language: 'sw',
          thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      ];
    } catch (error) {
      console.error('Audio content loading error:', error);
      return [];
    }
  };

  const loadInteractiveContent = async () => {
    try {
      // Mock interactive stories - replace with actual service calls
      return [
        {
          id: 'climate-impact',
          title: '🌍 Climate Change Impact',
          description: 'Interactive exploration of climate effects across Africa',
          complexity: 'medium',
          estimatedTime: '15 min',
          interactivity: 'high',
          thumbnail: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=400'
        },
        {
          id: 'election-guide',
          title: '🗳️ Election Guide 2024',
          description: 'Navigate upcoming elections across Africa',
          complexity: 'high',
          estimatedTime: '25 min',
          interactivity: 'very-high',
          thumbnail: 'https://images.pexels.com/photos/3184454/pexels-photo-3184454.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      ];
    } catch (error) {
      console.error('Interactive content loading error:', error);
      return [];
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Reading Streak',
            value: insights?.readingPatterns?.currentStreak || 0,
            unit: 'days',
            icon: Zap,
            color: 'from-orange-500 to-red-500',
            trend: '+12%'
          },
          {
            title: 'Articles Read',
            value: insights?.readingPatterns?.totalArticles || 0,
            unit: 'this month',
            icon: BookOpen,
            color: 'from-blue-500 to-cyan-500',
            trend: '+8%'
          },
          {
            title: 'Engagement Score',
            value: insights?.engagement?.interactionRate || 0,
            unit: '%',
            icon: Heart,
            color: 'from-pink-500 to-rose-500',
            trend: '+15%'
          },
          {
            title: 'Impact Points',
            value: profile?.impact_points || 0,
            unit: 'points',
            icon: Star,
            color: 'from-yellow-500 to-amber-500',
            trend: '+22%'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
              <span className="text-sm font-normal text-gray-500 ml-1">
                {stat.unit}
              </span>
            </h3>
            <p className="text-gray-600 text-sm">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Insights Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8" />
          <h2 className="text-2xl font-bold">✨ AI Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">📊 Your Reading DNA</h3>
            <p className="text-purple-100 text-sm leading-relaxed">
              You prefer morning reads, love in-depth political analysis, and show strong 
              engagement with East African content. Your reading velocity has increased 40% 
              this month! 🚀
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">🎯 Personalized Tips</h3>
            <ul className="text-purple-100 text-sm space-y-1">
              <li>• Try our new audio summaries for busy mornings</li>
              <li>• Explore interactive stories about climate change</li>
              <li>• Join discussions in your favorite communities</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Audio Playlists */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Headphones className="w-7 h-7 text-orange-500" />
            🎧 Audio News Playlists
          </h2>
          <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">
            Create Playlist →
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {audioPlaylists.map((playlist) => (
            <motion.div
              key={playlist.id}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="relative mb-4">
                <img
                  src={playlist.thumbnail}
                  alt={playlist.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <button className="bg-white text-orange-500 p-3 rounded-full">
                    <Radio className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-bold text-gray-900 mb-2">{playlist.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{playlist.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{playlist.articles} articles</span>
                <span>{playlist.duration}</span>
                <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  {playlist.language.toUpperCase()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Interactive Stories */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-purple-500" />
            ✨ Interactive Stories
          </h2>
          <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
            Explore All →
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {interactiveStories.map((story) => (
            <motion.div
              key={story.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <img
                src={story.thumbnail}
                alt={story.title}
                className="w-full h-40 object-cover"
              />
              
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-2">{story.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{story.description}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                      {story.complexity}
                    </span>
                    <span className="text-gray-500">{story.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-1 text-purple-600">
                    <Zap className="w-3 h-3" />
                    <span>{story.interactivity}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8">
      {/* Reading Patterns */}
      <div className="bg-white rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          📈 Reading Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Preferred Reading Times',
              data: insights?.readingPatterns?.preferredTimes,
              type: 'time-chart'
            },
            {
              title: 'Category Breakdown',
              data: insights?.topicPreferences?.primaryInterests,
              type: 'pie-chart'
            },
            {
              title: 'Weekly Trend',
              data: insights?.readingPatterns?.weeklyTrend,
              type: 'line-chart'
            }
          ].map((chart) => (
            <div key={chart.title} className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3">{chart.title}</h4>
              <div className="h-32 bg-white rounded-lg flex items-center justify-center">
                <p className="text-gray-500 text-sm">Chart: {chart.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-green-500" />
          💚 Engagement Insights
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Completion Rate', value: `${Math.round(insights?.engagement?.completionRate || 75)}%`, icon: Target },
            { label: 'Avg Session', value: `${Math.round(insights?.engagement?.averageSessionDuration || 12)}min`, icon: Clock },
            { label: 'Interactions', value: `${Math.round(insights?.engagement?.interactionRate || 45)}%`, icon: Heart },
            { label: 'Shares', value: insights?.engagement?.sharingBehavior?.total || 8, icon: Share2 }
          ].map((metric) => (
            <div key={metric.label} className="text-center p-4 bg-gray-50 rounded-xl">
              <metric.icon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="font-bold text-xl text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPersonalized = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Target className="w-7 h-7 text-orange-500" />
          🎯 Your Personalized Feed
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="comprehensive">Comprehensive</option>
            <option value="quick">Quick View</option>
            <option value="audio-first">Audio First</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {personalizedFeed.map((article) => (
          <SuperEnhancedArticleCard
            key={article.id}
            article={article}
            viewMode={viewMode}
            showInteractive={true}
            showAudio={true}
            showAnalytics={true}
            className="hover:shadow-xl transition-all duration-300"
          />
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-8 text-white"
          >
            <h1 className="text-3xl font-bold mb-2">
              🚀 Welcome back, {profile?.first_name || 'Reader'}!
            </h1>
            <p className="text-orange-100 mb-4">
              Your personalized African news experience, powered by AI
            </p>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Last visit: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>📍 {profile?.country || 'Global'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>👥 Nairobell Community</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: '🏠 Overview', icon: BarChart3 },
                { id: 'personalized', label: '🎯 For You', icon: Target },
                { id: 'analytics', label: '📊 Analytics', icon: Activity },
                { id: 'content', label: '🎨 Content Hub', icon: Sparkles }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'personalized' && renderPersonalized()}
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'content' && (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  🎨 Content Hub Coming Soon
                </h3>
                <p className="text-gray-500">
                  Advanced content creation and curation tools
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
