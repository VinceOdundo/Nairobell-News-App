import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Camera, 
  MapPin, 
  Upload, 
  Award,
  TrendingUp,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Edit3,
  Star,
  Shield
} from 'lucide-react'
import { CitizenJournalismService } from '../../services/citizenJournalismService'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Loading'
import toast from 'react-hot-toast'

const CitizenJournalismPage = () => {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('submit')
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reportForm, setReportForm] = useState({
    title: '',
    content: '',
    location: '',
    category: 'governance',
    subcategory: '',
    urgency_level: 'medium',
    language: 'en',
    media_urls: [],
    tags: []
  })
  const [reports, setReports] = useState([])

  const tabs = [
    { id: 'submit', name: 'Submit Report', icon: Edit3 },
    { id: 'dashboard', name: 'My Reports', icon: Award },
    { id: 'local', name: 'Local News', icon: MapPin },
    { id: 'trending', name: 'Trending', icon: TrendingUp }
  ]

  const urgencyLevels = [
    { id: 'low', name: 'Low', color: 'green', description: 'General news' },
    { id: 'medium', name: 'Medium', color: 'yellow', description: 'Important but not urgent' },
    { id: 'high', name: 'High', color: 'red', description: 'Breaking news or urgent issues' }
  ]

  const languages = [
    { id: 'en', name: 'English' },
    { id: 'sw', name: 'Swahili' },
    { id: 'ha', name: 'Hausa' },
    { id: 'yo', name: 'Yoruba' },
    { id: 'am', name: 'Amharic' },
    { id: 'zu', name: 'Zulu' }
  ]

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 'local') {
      loadLocalReports()
    }
  }, [activeTab])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const data = await CitizenJournalismService.getCitizenJournalismDashboard(user.id)
      setDashboard(data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadLocalReports = async () => {
    try {
      const localData = await CitizenJournalismService.getLocalReports({
        location: profile?.location || user?.user_metadata?.location,
        limit: 10
      })
      setReports(localData.reports)
    } catch (error) {
      console.error('Error loading local reports:', error)
    }
  }

  const handleSubmitReport = async () => {
    if (!reportForm.title.trim() || !reportForm.content.trim() || !reportForm.location.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const result = await CitizenJournalismService.submitLocalReport(reportForm, user.id)
      
      toast.success(`Report submitted! Verification score: ${result.verification_score.toFixed(1)}/10`)
      
      // Reset form
      setReportForm({
        title: '',
        content: '',
        location: '',
        category: 'governance',
        subcategory: '',
        urgency_level: 'medium',
        language: 'en',
        media_urls: [],
        tags: []
      })

      // Refresh dashboard
      await loadDashboardData()
      
      // Switch to dashboard tab
      setActiveTab('dashboard')
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'green'
      case 'pending_review': return 'yellow'
      case 'draft': return 'gray'
      case 'rejected': return 'red'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-4 h-4" />
      case 'pending_review': return <Clock className="w-4 h-4" />
      case 'rejected': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Join the Community</h2>
          <p className="text-gray-600 mb-4">
            Sign in to submit local news reports and become a citizen journalist
          </p>
        </div>
      </div>
    )
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Camera className="w-8 h-8" />
                Citizen Journalism
              </h1>
              <p className="text-lg opacity-90">
                Be the voice of your community. Report local news that matters.
              </p>
            </div>
            
            {dashboard && (
              <div className="text-right">
                <div className="text-2xl font-bold">{dashboard.user_stats.total_reports}</div>
                <div className="text-sm opacity-75">Reports Submitted</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Submit Report Tab */}
        {activeTab === 'submit' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Submit a Local News Report</h2>
              
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Title *
                  </label>
                  <input
                    type="text"
                    value={reportForm.title}
                    onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What's happening in your community?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={reportForm.location}
                      onChange={(e) => setReportForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Area, Country"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Category and Subcategory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={reportForm.category}
                      onChange={(e) => setReportForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {dashboard?.report_categories?.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency Level
                    </label>
                    <select
                      value={reportForm.urgency_level}
                      onChange={(e) => setReportForm(prev => ({ ...prev, urgency_level: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {urgencyLevels.map(level => (
                        <option key={level.id} value={level.id}>
                          {level.name} - {level.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={reportForm.language}
                    onChange={(e) => setReportForm(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {languages.map(lang => (
                      <option key={lang.id} value={lang.id}>{lang.name}</option>
                    ))}
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Content *
                  </label>
                  <textarea
                    value={reportForm.content}
                    onChange={(e) => setReportForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Provide detailed information about what happened, when, where, and why it matters to your community..."
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Our AI will help verify your report and check for accuracy
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    * Required fields
                  </div>
                  <button
                    onClick={handleSubmitReport}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {dashboard.user_stats.total_reports}
                    </div>
                    <div className="text-sm text-gray-500">Total Reports</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {dashboard.user_stats.published_reports}
                    </div>
                    <div className="text-sm text-gray-500">Published</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {dashboard.user_stats.average_score.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">Avg Score</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {dashboard.user_stats.verification_level || 'Beginner'}
                    </div>
                    <div className="text-sm text-gray-500">Level</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Your Recent Reports</h3>
              </div>
              <div className="p-6">
                {dashboard.local_reports?.reports?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboard.local_reports.reports.map((report, index) => (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{report.title}</h4>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(report.status)}-100 text-${getStatusColor(report.status)}-600`}>
                            {getStatusIcon(report.status)}
                            {report.status.replace('_', ' ')}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {report.content}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{report.location}</span>
                          <span>Score: {report.verification_score}/10</span>
                          <span>{new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No reports submitted yet</p>
                    <button
                      onClick={() => setActiveTab('submit')}
                      className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Submit your first report
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Local News Tab */}
        {activeTab === 'local' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Local News from Your Area</h2>
              <p className="text-gray-600">
                Community-reported news from {profile?.location || 'your region'}
              </p>
            </div>

            {reports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={report.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${report.profiles?.username}&background=8b5cf6&color=fff`}
                        alt={report.profiles?.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-sm">{report.profiles?.username}</div>
                        <div className="text-xs text-gray-500">{report.location}</div>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {report.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                      {report.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {new Date(report.published_at).toLocaleDateString()}
                      </span>
                      <span className="text-purple-600 font-medium">
                        Score: {report.verification_score}/10
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No local reports yet</h3>
                <p className="text-gray-600 mb-4">
                  Be the first to report news from your area
                </p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Submit a Report
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Trending Tab */}
        {activeTab === 'trending' && dashboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Trending Local Topics</h2>
              <p className="text-gray-600">
                What's being reported by citizen journalists across Africa
              </p>
            </div>

            {dashboard.trending_topics?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboard.trending_topics.map((topic, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg border border-gray-200 p-6"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {topic.category}
                      </h3>
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-orange-500 mb-1">
                      {topic.count}
                    </div>
                    <div className="text-sm text-gray-500">
                      reports this week
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No trending topics yet</h3>
                <p className="text-gray-600">
                  Trending topics will appear as more reports are submitted
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default CitizenJournalismPage
