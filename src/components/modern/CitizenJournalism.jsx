import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, 
  MapPin, 
  Send, 
  Upload, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Users,
  Award,
  Clock,
  Globe
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { EnhancedGeminiService } from '../../services/enhancedGeminiService'
import toast from 'react-hot-toast'

const AFRICAN_COUNTRIES = [
  'nigeria', 'kenya', 'south-africa', 'ghana', 'ethiopia', 'egypt', 'morocco', 
  'tunisia', 'uganda', 'tanzania', 'algeria', 'sudan', 'angola', 'mozambique'
]

const REPORT_CATEGORIES = [
  { id: 'breaking-news', label: 'Breaking News', icon: '🚨' },
  { id: 'local-politics', label: 'Local Politics', icon: '🏛️' },
  { id: 'community-events', label: 'Community Events', icon: '🎭' },
  { id: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
  { id: 'economic-issues', label: 'Economic Issues', icon: '💰' },
  { id: 'social-issues', label: 'Social Issues', icon: '👥' },
  { id: 'environment', label: 'Environment', icon: '🌿' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { id: 'technology', label: 'Technology', icon: '💻' }
]

export default function CitizenJournalism({ onClose }) {
  const { user, profile } = useAuth()
  const [step, setStep] = useState(1)
  const [reportData, setReportData] = useState({
    title: '',
    content: '',
    location: '',
    country: profile?.country || '',
    category: '',
    media_urls: []
  })
  const [submitting, setSubmitting] = useState(false)
  const [aiVerification, setAiVerification] = useState(null)
  const [myReports, setMyReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)

  useEffect(() => {
    if (user) {
      loadMyReports()
    }
  }, [user])

  const loadMyReports = async () => {
    setLoadingReports(true)
    try {
      const { data, error } = await supabase
        .from('local_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setMyReports(data || [])
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoadingReports(false)
    }
  }

  const handleInputChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAiVerification = async () => {
    if (!reportData.title || !reportData.content) {
      toast.error('Please fill in title and content first')
      return
    }

    setSubmitting(true)
    try {
      // AI verification using Gemini
      const verification = await EnhancedGeminiService.performAfricanFactCheck(
        `${reportData.title}\n\n${reportData.content}`,
        reportData.country
      )

      // Additional credibility assessment
      const credibilityCheck = await EnhancedGeminiService.moderateWithAfricanContext(
        reportData.content,
        reportData.country
      )

      setAiVerification({
        ...verification,
        content_appropriate: credibilityCheck?.is_appropriate,
        suggestions: credibilityCheck?.suggestions
      })

      if (verification.accuracy_score > 6 && credibilityCheck?.is_appropriate) {
        toast.success('Report looks credible! Ready to submit.')
      } else {
        toast.warning('Report needs review. Please check the AI feedback.')
      }
    } catch (error) {
      console.error('Error verifying report:', error)
      toast.error('AI verification failed. You can still submit manually.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReport = async () => {
    if (!user) {
      toast.error('Please sign in to submit reports')
      return
    }

    if (!reportData.title || !reportData.content || !reportData.location || !reportData.country || !reportData.category) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('local_reports')
        .insert([{
          user_id: user.id,
          title: reportData.title,
          content: reportData.content,
          location: reportData.location,
          country: reportData.country,
          category_id: null, // Would map to actual category IDs
          media_urls: reportData.media_urls,
          verification_score: aiVerification?.accuracy_score || 5.0,
          status: aiVerification?.accuracy_score > 7 ? 'verified' : 'pending'
        }])

      if (error) throw error

      // Award points for citizen journalism
      await supabase
        .from('profiles')
        .update({ points: supabase.raw('points + 20') })
        .eq('id', user.id)

      // Award Local Hero badge if this is their 5th report
      const reportCount = myReports.length + 1
      if (reportCount === 5) {
        await awardBadge(user.id, 'local_hero')
      }

      toast.success('Report submitted successfully! Our team will review it shortly.')
      setReportData({
        title: '',
        content: '',
        location: '',
        country: profile?.country || '',
        category: '',
        media_urls: []
      })
      setStep(1)
      setAiVerification(null)
      loadMyReports()
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const awardBadge = async (userId, badgeType) => {
    try {
      await supabase
        .from('user_badges')
        .insert([{
          user_id: userId,
          badge_type: badgeType,
          badge_level: 1,
          metadata: { earned_for: 'citizen_journalism' }
        }])
      
      toast.success('🏆 You earned the Local Hero badge!')
    } catch (error) {
      console.error('Error awarding badge:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100'
      case 'published': return 'text-blue-600 bg-blue-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />
      case 'published': return <Eye className="w-4 h-4" />
      case 'rejected': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-xl p-8 max-w-md w-full text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Join Our Citizen Journalism Network</h2>
          <p className="text-gray-600 mb-6">
            Sign in to report local news, events, and issues in your community
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Sign In to Continue
          </button>
        </motion.div>
      </motion.div>
    )
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
                <Camera className="w-5 h-5" />
                Citizen Journalism
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                Report local news and events from your community
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Report Form */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Submit a Report
                </h3>

                {/* Step 1: Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Report Title *
                    </label>
                    <input
                      type="text"
                      value={reportData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Brief, descriptive title of your report"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={reportData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="City, region, or specific location"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <select
                      value={reportData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select country</option>
                      {AFRICAN_COUNTRIES.map(country => (
                        <option key={country} value={country}>
                          {country.charAt(0).toUpperCase() + country.slice(1).replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {REPORT_CATEGORIES.map(category => (
                        <button
                          key={category.id}
                          onClick={() => handleInputChange('category', category.id)}
                          className={`p-3 text-left border rounded-lg transition-colors ${
                            reportData.category === category.id
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="text-lg mb-1">{category.icon}</div>
                          <div className="text-sm font-medium">{category.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Report Details *
                    </label>
                    <textarea
                      value={reportData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      placeholder="Provide detailed information about what happened, when, where, and who was involved. Be factual and objective."
                      rows={6}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {reportData.content.length}/1000 characters
                    </div>
                  </div>

                  {/* AI Verification */}
                  {reportData.title && reportData.content && (
                    <div className="space-y-3">
                      <button
                        onClick={handleAiVerification}
                        disabled={submitting}
                        className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        {submitting ? 'Verifying...' : 'AI Verification Check'}
                      </button>

                      {aiVerification && (
                        <div className={`p-4 rounded-lg border ${
                          aiVerification.accuracy_score > 6 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4" />
                            <span className="font-medium">AI Verification Results</span>
                          </div>
                          <div className="text-sm space-y-1">
                            <p><strong>Accuracy Score:</strong> {aiVerification.accuracy_score}/10</p>
                            <p><strong>Verdict:</strong> {aiVerification.verdict}</p>
                            {aiVerification.explanation && (
                              <p><strong>Analysis:</strong> {aiVerification.explanation}</p>
                            )}
                            {aiVerification.suggestions && (
                              <p><strong>Suggestions:</strong> {aiVerification.suggestions}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitReport}
                    disabled={submitting || !reportData.title || !reportData.content || !reportData.location || !reportData.country || !reportData.category}
                    className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            </div>

            {/* My Reports */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                My Reports
                {myReports.length > 0 && (
                  <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {myReports.length}
                  </span>
                )}
              </h3>

              {loadingReports ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : myReports.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reports submitted yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Your reports will appear here after submission
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {myReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 line-clamp-1">
                          {report.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          {report.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {report.content}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {report.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(report.submitted_at).toLocaleDateString()}
                        </span>
                        {report.verification_score && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {report.verification_score.toFixed(1)}/10
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Gamification Info */}
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Citizen Journalism Rewards
                </h4>
                <div className="text-sm space-y-1 text-gray-700">
                  <p>🏆 Submit 5 reports → Local Hero badge</p>
                  <p>⭐ Earn 20 points per verified report</p>
                  <p>🎯 High accuracy score → Featured reports</p>
                  <p>📱 Reports may be published in our news feed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}