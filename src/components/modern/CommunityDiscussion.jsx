import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  Flag, 
  Zap,
  Globe,
  Users,
  Award,
  Send,
  Eye,
  Heart
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { EnhancedGeminiService } from '../../services/enhancedGeminiService'
import toast from 'react-hot-toast'

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

export default function CommunityDiscussion({ article, onClose }) {
  const { user, profile } = useAuth()
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [discussionPrompts, setDiscussionPrompts] = useState([])
  const [aiModerationEnabled, setAiModerationEnabled] = useState(true)

  useEffect(() => {
    if (article) {
      loadDiscussions()
      generateDiscussionPrompts()
    }
  }, [article])

  const loadDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from('community_discussions')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            country,
            avatar_url,
            points
          )
        `)
        .eq('post_id', article.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDiscussions(data || [])
    } catch (error) {
      console.error('Error loading discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateDiscussionPrompts = async () => {
    try {
      const prompts = await EnhancedGeminiService.generateDiscussionPrompts(article)
      setDiscussionPrompts(prompts)
    } catch (error) {
      console.error('Error generating discussion prompts:', error)
    }
  }

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return

    try {
      setLoading(true)

      // AI moderation check
      if (aiModerationEnabled) {
        const moderation = await EnhancedGeminiService.moderateWithAfricanContext(
          newComment, 
          profile?.country || 'unknown'
        )
        
        if (!moderation?.is_appropriate) {
          toast.error(`Comment needs review: ${moderation?.suggestions || 'Please revise your comment'}`)
          setLoading(false)
          return
        }
      }

      const { data, error } = await supabase
        .from('community_discussions')
        .insert([{
          post_id: article.id,
          user_id: user.id,
          parent_id: replyingTo,
          content: newComment,
          language: profile?.preferred_language || 'en',
          ai_moderated: aiModerationEnabled
        }])
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            country,
            avatar_url,
            points
          )
        `)

      if (error) throw error

      // Add new comment to state
      setDiscussions(prev => [data[0], ...prev])
      setNewComment('')
      setReplyingTo(null)
      
      // Award points for community engagement
      await awardEngagementPoints(user.id, 'comment')
      
      toast.success('Comment posted successfully!')
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (discussionId, voteType) => {
    if (!user) {
      toast.error('Please sign in to vote')
      return
    }

    try {
      // Update vote counts
      const voteField = voteType === 'up' ? 'upvotes' : 'downvotes'
      const { error } = await supabase
        .from('community_discussions')
        .update({ [voteField]: supabase.raw(`${voteField} + 1`) })
        .eq('id', discussionId)

      if (error) throw error

      // Update local state
      setDiscussions(prev => prev.map(discussion => 
        discussion.id === discussionId 
          ? { ...discussion, [voteField]: discussion[voteField] + 1 }
          : discussion
      ))

      // Award points for voting
      await awardEngagementPoints(user.id, 'vote')
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to vote')
    }
  }

  const handleFlag = async (discussionId) => {
    if (!user) return

    try {
      await supabase
        .from('community_discussions')
        .update({ is_flagged: true })
        .eq('id', discussionId)

      toast.success('Comment flagged for review')
    } catch (error) {
      console.error('Error flagging comment:', error)
      toast.error('Failed to flag comment')
    }
  }

  const awardEngagementPoints = async (userId, actionType) => {
    const points = { comment: 5, vote: 1, reply: 3 }
    const pointsToAdd = points[actionType] || 0

    try {
      await supabase
        .from('profiles')
        .update({ points: supabase.raw(`points + ${pointsToAdd}`) })
        .eq('id', userId)
    } catch (error) {
      console.error('Error awarding points:', error)
    }
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const posted = new Date(date)
    const diffInMinutes = Math.floor((now - posted) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Community Discussion
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                Join the conversation about: {article.title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-orange-100">
                <Users className="w-4 h-4" />
                <span className="text-sm">{discussions.length}</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Discussion Prompts */}
        {discussionPrompts.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Discussion Starters
            </h3>
            <div className="space-y-2">
              {discussionPrompts.slice(0, 2).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setNewComment(prompt)}
                  className="text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 p-2 rounded-lg transition-colors w-full"
                >
                  💭 {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comment Input */}
        {user && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {profile?.display_name?.[0] || user.email[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? "Write a reply..." : "Share your thoughts on this story..."}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  {newComment.length > 0 && (
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {newComment.length}/500
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {profile?.country && (
                      <span className="flex items-center gap-1">
                        {COUNTRY_FLAGS[profile.country] || '🌍'}
                        {profile.country}
                      </span>
                    )}
                    {aiModerationEnabled && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Zap className="w-3 h-3" />
                        AI Moderated
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {replyingTo && (
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || loading}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                    >
                      <Send className="w-3 h-3" />
                      {replyingTo ? 'Reply' : 'Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discussions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : discussions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start the Conversation</h3>
              <p className="text-gray-500 mb-4">Be the first to share your thoughts on this story</p>
              {!user && (
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  Sign In to Comment
                </button>
              )}
            </div>
          ) : (
            discussions.map((discussion) => (
              <motion.div
                key={discussion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {discussion.profiles?.display_name?.[0] || 'U'}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {discussion.profiles?.display_name || discussion.profiles?.username}
                      </span>
                      {discussion.profiles?.country && (
                        <span className="text-sm">
                          {COUNTRY_FLAGS[discussion.profiles.country] || '🌍'}
                        </span>
                      )}
                      {discussion.profiles?.points > 100 && (
                        <Award className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-sm text-gray-500">
                        {formatTimeAgo(discussion.created_at)}
                      </span>
                      {discussion.ai_moderated && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          AI Moderated
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-3 leading-relaxed">
                      {discussion.content}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleVote(discussion.id, 'up')}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {discussion.upvotes}
                      </button>
                      
                      <button
                        onClick={() => handleVote(discussion.id, 'down')}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        {discussion.downvotes}
                      </button>
                      
                      {user && (
                        <button
                          onClick={() => setReplyingTo(discussion.id)}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Reply className="w-4 h-4" />
                          Reply
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleFlag(discussion.id)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Flag className="w-4 h-4" />
                        Flag
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}