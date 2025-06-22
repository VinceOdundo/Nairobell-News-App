import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Menu, 
  X, 
  Globe, 
  User, 
  Settings, 
  LogOut,
  Bell,
  Bookmark,
  TrendingUp,
  MapPin,
  Download,
  MessageCircle,
  Camera,
  Trophy,
  Zap,
  WifiOff
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import CommunityDiscussion from './CommunityDiscussion'
import CitizenJournalism from './CitizenJournalism'
import GamificationDashboard from './GamificationDashboard'
import OfflineManager from './OfflineManager'
import toast from 'react-hot-toast'

const AFRICAN_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'yo', name: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'zu', name: 'isiZulu', flag: '🇿🇦' },
  { code: 'xh', name: 'isiXhosa', flag: '🇿🇦' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'fr', name: 'Français', flag: '🇨🇮' },
  { code: 'ar', name: 'العربية', flag: '🇪🇬' },
  { code: 'pt', name: 'Português', flag: '🇦🇴' }
]

export default function EnhancedNavbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState(profile?.preferred_language || 'en')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Modal states
  const [showCommunity, setShowCommunity] = useState(false)
  const [showCitizenJournalism, setShowCitizenJournalism] = useState(false)
  const [showGamification, setShowGamification] = useState(false)
  const [showOfflineManager, setShowOfflineManager] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (profile?.preferred_language) {
      setSelectedLanguage(profile.preferred_language)
    }
  }, [profile])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setIsMenuOpen(false)
    }
  }

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode)
    setIsLanguageOpen(false)
    
    // Update user preference if logged in
    if (user) {
      // TODO: Update user preferences in database
      toast.success(`Language changed to ${AFRICAN_LANGUAGES.find(l => l.code === langCode)?.name}`)
    } else {
      toast.success(`Language changed to ${AFRICAN_LANGUAGES.find(l => l.code === langCode)?.name}`)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setIsMenuOpen(false)
  }

  const navItems = [
    { path: '/home', label: 'Home', icon: TrendingUp },
    { path: '/trending', label: 'Trending', icon: TrendingUp },
    { path: '/local', label: 'Local News', icon: MapPin },
    { path: '/bookmarks', label: 'Bookmarks', icon: Bookmark }
  ]

  const quickActions = [
    {
      label: 'Community',
      icon: MessageCircle,
      action: () => setShowCommunity(true),
      color: 'text-blue-600 hover:bg-blue-50'
    },
    {
      label: 'Report News',
      icon: Camera,
      action: () => setShowCitizenJournalism(true),
      color: 'text-green-600 hover:bg-green-50'
    },
    {
      label: 'Achievements',
      icon: Trophy,
      action: () => setShowGamification(true),
      color: 'text-yellow-600 hover:bg-yellow-50'
    },
    {
      label: 'Offline',
      icon: isOnline ? Download : WifiOff,
      action: () => setShowOfflineManager(true),
      color: isOnline ? 'text-purple-600 hover:bg-purple-50' : 'text-red-600 hover:bg-red-50'
    }
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Nairobell
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    location.pathname === path
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            {/* Search Bar */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search African news..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </form>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Online/Offline Indicator */}
              <div className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isOnline ? <Zap className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </div>

              {/* Quick Actions */}
              <div className="hidden lg:flex items-center space-x-1">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`p-2 rounded-full transition-colors ${action.color}`}
                    title={action.label}
                  >
                    <action.icon size={18} />
                  </button>
                ))}
              </div>

              {/* Language Selector */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                >
                  <Globe size={16} />
                  <span>{AFRICAN_LANGUAGES.find(l => l.code === selectedLanguage)?.flag}</span>
                </button>

                <AnimatePresence>
                  {isLanguageOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto"
                    >
                      {AFRICAN_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                            selectedLanguage === lang.code ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-full text-gray-700 hover:text-orange-600 hover:bg-gray-50 relative"
                  >
                    <Bell size={18} />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-gray-200">
                          <h3 className="font-medium text-gray-900">Notifications</h3>
                        </div>
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>No new notifications</p>
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto">
                            {notifications.map((notification, index) => (
                              <div key={index} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                                <p className="text-sm text-gray-900">{notification.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                  >
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.username}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {profile?.display_name?.[0] || user.email[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="hidden md:block">{profile?.display_name || profile?.username || 'User'}</span>
                    {profile?.points > 0 && (
                      <span className="hidden md:flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        <Zap className="w-3 h-3" />
                        {profile.points}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900">
                            {profile?.display_name || profile?.username}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {profile?.points > 0 && (
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span className="flex items-center gap-1 text-orange-600">
                                <Zap className="w-3 h-3" />
                                {profile.points} points
                              </span>
                              {profile.reading_streak > 0 && (
                                <span className="flex items-center gap-1 text-red-600">
                                  🔥 {profile.reading_streak} days
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quick Actions for Mobile */}
                        <div className="lg:hidden border-b border-gray-200">
                          {quickActions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                action.action()
                                setIsMenuOpen(false)
                              }}
                              className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <action.icon size={16} />
                              <span>{action.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* Menu Items */}
                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User size={16} />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Settings size={16} />
                          <span>Settings</span>
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-md hover:from-orange-600 hover:to-red-700 transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-700 hover:text-orange-600 hover:bg-gray-50"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <div className="px-4 py-2 space-y-1">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="relative mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search African news..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </form>

                {/* Mobile Navigation Items */}
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === path
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      {/* Modals */}
      <AnimatePresence>
        {showCommunity && (
          <CommunityDiscussion onClose={() => setShowCommunity(false)} />
        )}
        {showCitizenJournalism && (
          <CitizenJournalism onClose={() => setShowCitizenJournalism(false)} />
        )}
        {showGamification && (
          <GamificationDashboard onClose={() => setShowGamification(false)} />
        )}
        {showOfflineManager && (
          <OfflineManager onClose={() => setShowOfflineManager(false)} />
        )}
      </AnimatePresence>
    </>
  )
}