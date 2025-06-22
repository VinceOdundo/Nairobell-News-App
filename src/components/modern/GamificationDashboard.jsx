import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Award, 
  Star, 
  Zap, 
  Target, 
  Trophy, 
  Calendar,
  Users,
  BookOpen,
  Share2,
  Flag,
  Gift,
  Crown,
  Flame
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const BADGE_TYPES = {
  'news_streak': {
    name: 'News Streak',
    icon: '🔥',
    description: 'Read news daily for consecutive days',
    levels: [7, 15, 30, 60, 100],
    rewards: ['5 points', '15 points', '50 points', '100 points', '200 points']
  },
  'local_hero': {
    name: 'Local Hero',
    icon: '🏆',
    description: 'Report verified local news and events',
    levels: [1, 5, 10, 25, 50],
    rewards: ['20 points', '100 points', '250 points', '500 points', '1000 points']
  },
  'fact_checker': {
    name: 'Fact Checker',
    icon: '🔍',
    description: 'Help verify news accuracy and combat misinformation',
    levels: [10, 25, 50, 100, 200],
    rewards: ['10 points', '50 points', '150 points', '300 points', '600 points']
  },
  'community_builder': {
    name: 'Community Builder',
    icon: '👥',
    description: 'Engage in discussions and build community',
    levels: [25, 50, 100, 250, 500],
    rewards: ['15 points', '75 points', '200 points', '400 points', '800 points']
  },
  'knowledge_master': {
    name: 'Knowledge Master',
    icon: '🧠',
    description: 'Excel in daily news quizzes',
    levels: [10, 25, 50, 100, 200],
    rewards: ['10 points', '50 points', '150 points', '300 points', '600 points']
  },
  'pan_african': {
    name: 'Pan-African',
    icon: '🌍',
    description: 'Read news from multiple African countries',
    levels: [5, 10, 20, 35, 54],
    rewards: ['25 points', '75 points', '200 points', '400 points', '1000 points']
  }
}

const CHALLENGES = [
  {
    id: 'weekly_reader',
    title: 'Weekly Reader',
    description: 'Read 15 articles this week',
    progress: 0,
    target: 15,
    reward: '50 points + News Streak boost',
    timeLimit: '6 days left',
    difficulty: 'Easy'
  },
  {
    id: 'multi_country',
    title: 'Continental Explorer',
    description: 'Read news from 5 different African countries',
    progress: 0,
    target: 5,
    reward: '100 points + Pan-African badge progress',
    timeLimit: '3 days left',
    difficulty: 'Medium'
  },
  {
    id: 'community_engage',
    title: 'Community Voice',
    description: 'Comment on 10 news articles',
    progress: 0,
    target: 10,
    reward: '75 points + Community Builder badge',
    timeLimit: '5 days left',
    difficulty: 'Medium'
  },
  {
    id: 'fact_verify',
    title: 'Truth Seeker',
    description: 'Help fact-check 5 citizen reports',
    progress: 0,
    target: 5,
    reward: '150 points + Fact Checker badge',
    timeLimit: '7 days left',
    difficulty: 'Hard'
  }
]

const DAILY_QUIZ_TOPICS = [
  'African Politics & Governance',
  'Economic Development',
  'Technology & Innovation',
  'Culture & Society',
  'Climate & Environment',
  'Sports & Entertainment'
]

export default function GamificationDashboard({ onClose }) {
  const { user, profile } = useAuth()
  const [userBadges, setUserBadges] = useState([])
  const [userChallenges, setUserChallenges] = useState(CHALLENGES)
  const [dailyQuizAvailable, setDailyQuizAvailable] = useState(true)
  const [todaysQuizTopic, setTodaysQuizTopic] = useState('')
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadUserBadges()
      loadLeaderboard()
      checkDailyQuiz()
    }
  }, [user])

  const loadUserBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      setUserBadges(data || [])
    } catch (error) {
      console.error('Error loading badges:', error)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, points, reading_streak, country')
        .order('points', { ascending: false })
        .limit(10)

      if (error) throw error
      setLeaderboard(data || [])
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkDailyQuiz = () => {
    const today = new Date().toDateString()
    const lastQuiz = localStorage.getItem('lastQuizDate')
    
    setDailyQuizAvailable(lastQuiz !== today)
    setTodaysQuizTopic(DAILY_QUIZ_TOPICS[new Date().getDay()])
  }

  const calculateBadgeProgress = (badgeType) => {
    const badge = userBadges.find(b => b.badge_type === badgeType)
    const currentLevel = badge?.badge_level || 0
    const badgeConfig = BADGE_TYPES[badgeType]
    
    if (!badgeConfig) return { progress: 0, nextTarget: 0, completed: false }
    
    if (currentLevel >= badgeConfig.levels.length) {
      return { progress: 100, nextTarget: 0, completed: true }
    }
    
    const nextTarget = badgeConfig.levels[currentLevel]
    // This would normally come from actual user activity data
    const currentProgress = Math.floor(Math.random() * nextTarget)
    
    return {
      progress: Math.min((currentProgress / nextTarget) * 100, 100),
      nextTarget,
      currentProgress,
      completed: false
    }
  }

  const startDailyQuiz = () => {
    toast.success('Daily quiz feature coming soon! 📚')
    // TODO: Implement quiz modal
  }

  const claimChallenge = (challengeId) => {
    toast.success('Challenge rewards claimed! 🎉')
    // TODO: Implement challenge completion logic
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
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Join the Community</h2>
          <p className="text-gray-600 mb-6">
            Sign in to earn badges, complete challenges, and climb the leaderboard
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Sign In to Continue
          </button>
        </div>
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Your News Journey
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                Badges • Challenges • Leaderboard
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* User Stats */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 mb-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {profile?.display_name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {profile?.display_name || profile?.username}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {profile?.country && `${profile.country} 🌍`}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                      <Star className="w-4 h-4" />
                      <span className="font-bold text-lg">{profile?.points || 0}</span>
                    </div>
                    <p className="text-xs text-gray-500">Total Points</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                      <Flame className="w-4 h-4" />
                      <span className="font-bold text-lg">{profile?.reading_streak || 0}</span>
                    </div>
                    <p className="text-xs text-gray-500">Day Streak</p>
                  </div>
                </div>
              </div>

              {/* Daily Quiz */}
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Daily Knowledge Quiz
                </h3>
                <p className="text-blue-700 text-sm mb-4">
                  Today's Topic: {todaysQuizTopic}
                </p>
                {dailyQuizAvailable ? (
                  <button
                    onClick={startDailyQuiz}
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Start Quiz (10 points)
                  </button>
                ) : (
                  <div className="text-center py-3 text-blue-600">
                    ✅ Quiz completed today!
                    <p className="text-xs text-blue-500 mt-1">Come back tomorrow</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <button className="w-full p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Report Local News (+20 pts)
                </button>
                <button className="w-full p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share Article (+5 pts)
                </button>
              </div>
            </div>

            {/* Badges & Challenges */}
            <div className="lg:col-span-2 space-y-6">
              {/* Badges */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Badges & Achievements
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(BADGE_TYPES).map(([type, config]) => {
                    const progress = calculateBadgeProgress(type)
                    const userBadge = userBadges.find(b => b.badge_type === type)
                    
                    return (
                      <div
                        key={type}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          userBadge 
                            ? 'border-orange-200 bg-orange-50' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-2xl">{config.icon}</div>
                          <div>
                            <h4 className="font-medium text-gray-900">{config.name}</h4>
                            {userBadge && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                Level {userBadge.badge_level}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                        
                        {!progress.completed && (
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>{progress.currentProgress || 0}/{progress.nextTarget}</span>
                              <span>{Math.round(progress.progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full transition-all"
                                style={{ width: `${progress.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Active Challenges */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Active Challenges
                </h3>
                <div className="space-y-4">
                  {userChallenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            {challenge.title}
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              challenge.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                              challenge.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {challenge.difficulty}
                            </span>
                          </h4>
                          <p className="text-sm text-gray-600">{challenge.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{challenge.timeLimit}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{challenge.progress}/{challenge.target}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-orange-600 font-medium flex items-center gap-1">
                          <Gift className="w-4 h-4" />
                          {challenge.reward}
                        </span>
                        {challenge.progress >= challenge.target && (
                          <button
                            onClick={() => claimChallenge(challenge.id)}
                            className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                          >
                            Claim
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaderboard */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Community Leaderboard
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaderboard.slice(0, 5).map((user, index) => (
                        <div
                          key={user.username}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            user.username === profile?.username 
                              ? 'bg-orange-100 border border-orange-200' 
                              : 'bg-white'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {user.display_name || user.username}
                              {user.username === profile?.username && (
                                <span className="text-orange-600 ml-1">(You)</span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{user.points} points</span>
                              <span>•</span>
                              <span>{user.reading_streak} day streak</span>
                              {user.country && <span>• {user.country}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}