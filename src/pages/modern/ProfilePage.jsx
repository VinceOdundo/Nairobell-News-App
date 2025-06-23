import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  MapPin, 
  Calendar,
  Award,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Edit3,
  Settings,
  Star,
  Target,
  Trophy,
  Users
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { OptimizedNewsService } from '../../services/optimizedNewsService'
import { GamificationService } from '../../services/gamificationService'
import Loading from '../../components/Loading'
import GamificationDashboard from '../../components/modern/GamificationDashboard'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [userStats, setUserStats] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [readingStats, setReadingStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'achievements', name: 'Achievements', icon: Award },
    { id: 'activity', name: 'Activity', icon: TrendingUp },
    { id: 'gamification', name: 'Gamification', icon: Trophy }
  ]

  useEffect(() => {
    if (user) {
      loadProfileData()
    }
  }, [user])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      
      // Load user statistics
      const stats = await OptimizedNewsService.getUserReadingStats?.(user.id)
      setReadingStats(stats)

      // Load achievements
      const userAchievements = await GamificationService.getUserAchievements?.(user.id)
      setAchievements(userAchievements || [])

      // Load recent activity
      const activity = await OptimizedNewsService.getUserActivity?.(user.id)
      setRecentActivity(activity || [])

      // Calculate user stats
      setUserStats({
        articlesRead: stats?.totalReads || 0,
        currentStreak: profile?.reading_streak || 0,
        totalPoints: profile?.points || 0,
        level: calculateUserLevel(profile?.points || 0),
        joinDate: profile?.created_at || user.created_at
      })

    } catch (error) {
      console.error('Error loading profile data:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const calculateUserLevel = (points) => {
    if (points < 100) return 'Beginner'
    if (points < 500) return 'Reader'
    if (points < 1000) return 'Enthusiast'
    if (points < 2500) return 'Expert'
    if (points < 5000) return 'Master'
    return 'Legend'
  }

  const getLevelProgress = (points) => {
    const levels = [0, 100, 500, 1000, 2500, 5000, 10000]
    const currentLevelIndex = levels.findIndex(level => points < level) - 1
    const currentLevel = Math.max(0, currentLevelIndex)
    const nextLevel = Math.min(levels.length - 1, currentLevel + 1)
    
    const currentLevelPoints = levels[currentLevel]
    const nextLevelPoints = levels[nextLevel]
    const progress = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100
    
    return Math.min(100, Math.max(0, progress))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view profile</h2>
          <p className="text-gray-600">
            Track your reading progress and achievements
          </p>
        </div>
      </div>
    )
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <img
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || user.email}&background=ffffff&color=3b82f6&size=120`}
                alt={profile?.username}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                {userStats?.level}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {profile?.first_name && profile?.last_name 
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile?.username || 'User'
                }
              </h1>
              <p className="text-lg opacity-90 mb-3">
                @{profile?.username || user.email.split('@')[0]}
              </p>
              
              {profile?.bio && (
                <p className="opacity-75 mb-3 max-w-2xl">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm opacity-75">
                {profile?.country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="capitalize">{profile.country.replace('-', ' ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(userStats?.joinDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{userStats?.totalPoints || 0}</div>
                <div className="text-sm opacity-75">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{userStats?.articlesRead || 0}</div>
                <div className="text-sm opacity-75">Articles Read</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{userStats?.currentStreak || 0}</div>
                <div className="text-sm opacity-75">Day Streak</div>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-75">Progress to next level</span>
              <span className="text-sm font-medium">{getLevelProgress(userStats?.totalPoints || 0).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${getLevelProgress(userStats?.totalPoints || 0)}%` }}
              />
            </div>
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
                    ? 'border-blue-500 text-blue-600'
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {readingStats?.totalReads || 0}
                    </div>
                    <div className="text-sm text-gray-500">Articles Read</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {readingStats?.thisWeek || 0}
                    </div>
                    <div className="text-sm text-gray-500">This Week</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {readingStats?.avgPerDay || 0}
                    </div>
                    <div className="text-sm text-gray-500">Daily Average</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {achievements.length}
                    </div>
                    <div className="text-sm text-gray-500">Achievements</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.slice(0, 6).map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl">{achievement.badge_icon}</div>
                      <div>
                        <div className="font-medium text-gray-900">{achievement.name}</div>
                        <div className="text-sm text-gray-500">{achievement.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No achievements yet. Start reading to earn your first badge!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">All Achievements</h3>
              
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{achievement.badge_icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{achievement.name}</h4>
                          <p className="text-gray-600 text-sm mb-2">{achievement.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                              {achievement.points} points
                            </span>
                            <span className="text-xs text-gray-500">
                              {achievement.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start reading news, engaging with the community, and reporting local stories to earn achievements!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
              
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {activity.type === 'read' && <BookOpen className="w-5 h-5 text-gray-600" />}
                        {activity.type === 'comment' && <MessageSquare className="w-5 h-5 text-gray-600" />}
                        {activity.type === 'report' && <Edit3 className="w-5 h-5 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                  <p className="text-gray-600">
                    Your reading and engagement activity will appear here
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Gamification Tab */}
        {activeTab === 'gamification' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GamificationDashboard />
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
