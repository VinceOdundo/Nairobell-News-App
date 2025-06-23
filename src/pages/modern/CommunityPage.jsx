import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Plus,
  Search,
  Filter,
  ThumbsUp,
  MessageCircle,
  Share2,
  Flag,
  Crown,
  Shield
} from 'lucide-react'
import { CommunityDiscussionService } from '../../services/communityDiscussionService'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Loading'
import toast from 'react-hot-toast'

const CommunityPage = () => {
  const { user, profile } = useAuth()
  const [discussions, setDiscussions] = useState([])
  const [trendingTopics, setTrendingTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: []
  })
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    { id: 'all', name: 'All Discussions', icon: '💬' },
    { id: 'politics', name: 'Politics', icon: '🏛️' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'culture', name: 'Culture', icon: '🎭' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'general', name: 'General', icon: '🌍' }
  ]

  useEffect(() => {
    loadCommunityData()
  }, [selectedCategory])

  const loadCommunityData = async () => {
    try {
      setLoading(true)
      
      // Load discussions
      const discussionData = await CommunityDiscussionService.getDiscussions({
        category: selectedCategory === 'all' ? null : selectedCategory,
        limit: 20
      })
      setDiscussions(discussionData.discussions)

      // Load trending topics
      const trending = await CommunityDiscussionService.getTrendingTopics()
      setTrendingTopics(trending)

    } catch (error) {
      console.error('Error loading community data:', error)
      toast.error('Failed to load discussions')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDiscussion = async () => {
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await CommunityDiscussionService.createDiscussion({
        ...newDiscussion,
        user_id: user.id
      })
      
      toast.success('Discussion created successfully!')
      setShowCreateModal(false)
      setNewDiscussion({ title: '', content: '', category: 'general', tags: [] })
      loadCommunityData()
    } catch (error) {
      console.error('Error creating discussion:', error)
      toast.error('Failed to create discussion')
    }
  }

  const handleVoteDiscussion = async (discussionId, voteType) => {
    try {
      await CommunityDiscussionService.voteOnDiscussion(discussionId, user.id, voteType)
      // Refresh discussions to show updated vote count
      loadCommunityData()
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to vote')
    }
  }

  const getUserRole = (userId) => {
    // Simple role determination - in real app this would come from database
    if (userId === user?.id) return 'you'
    return 'member'
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'moderator': return <Shield className="w-4 h-4 text-blue-500" />
      case 'expert': return <Crown className="w-4 h-4 text-yellow-500" />
      default: return null
    }
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-orange-500" />
                Community Discussions
              </h1>
              <p className="text-gray-600 mt-1">
                Join the conversation with fellow Africans about the news that matters
              </p>
            </div>
            
            {user && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Start Discussion
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search discussions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-300'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Discussions List */}
            <div className="space-y-4">
              {discussions.map((discussion, index) => (
                <motion.div
                  key={discussion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Discussion Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {discussion.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <img
                            src={discussion.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${discussion.profiles?.username}&background=f97316&color=fff`}
                            alt={discussion.profiles?.username}
                            className="w-5 h-5 rounded-full"
                          />
                          <span>{discussion.profiles?.username}</span>
                          {getRoleIcon(discussion.profiles?.role)}
                        </div>
                        <span>•</span>
                        <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          {discussion.category}
                        </span>
                      </div>
                    </div>
                    
                    <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Discussion Content */}
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {discussion.content}
                  </p>

                  {/* Tags */}
                  {discussion.tags && discussion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {discussion.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Discussion Stats and Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleVoteDiscussion(discussion.id, 'upvote')}
                        className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">{discussion.upvotes || 0}</span>
                      </button>
                      
                      <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{discussion.reply_count || 0} replies</span>
                      </button>
                      
                      <button className="flex items-center gap-1 text-gray-500 hover:text-orange-500 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span className="text-sm">Share</span>
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Last activity: {new Date(discussion.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Trending Topics
              </h3>
              <div className="space-y-3">
                {trendingTopics.slice(0, 5).map((topic, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900 text-sm">
                      {topic.topic}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {topic.discussion_count} discussions
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Community Guidelines */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Community Guidelines
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Be respectful and constructive</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Share credible sources</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Stay on topic</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  <span>No hate speech or misinformation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Discussion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Start a New Discussion
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newDiscussion.title}
                    onChange={(e) => setNewDiscussion(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What would you like to discuss?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newDiscussion.category}
                    onChange={(e) => setNewDiscussion(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.filter(cat => cat.id !== 'all').map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={newDiscussion.content}
                    onChange={(e) => setNewDiscussion(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your thoughts, ask questions, or start a conversation..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDiscussion}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Create Discussion
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default CommunityPage
