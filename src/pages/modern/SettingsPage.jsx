import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Settings as SettingsIcon, 
  Bell,
  Globe,
  Shield,
  Database,
  Moon,
  Sun,
  Languages,
  MapPin,
  Save,
  Eye,
  Volume2,
  Smartphone
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { OptimizedNewsService } from '../../services/optimizedNewsService'
import Loading from '../../components/Loading'
import toast from 'react-hot-toast'

const SettingsPage = () => {
  const { user, profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState({
    // Profile settings
    username: '',
    first_name: '',
    last_name: '',
    bio: '',
    country: '',
    region: '',
    preferred_language: 'en',
    
    // Notification settings
    notifications: {
      breaking_news: true,
      daily_digest: true,
      trending: false,
      community: true,
      citizen_reports: true
    },
    
    // Content preferences
    content: {
      show_summaries: true,
      auto_translate: false,
      audio_enabled: false,
      data_saver_mode: true,
      reading_speed: 'medium',
      show_bias_indicators: true
    },
    
    // Privacy settings
    privacy: {
      profile_visibility: 'public',
      activity_tracking: true,
      personalized_ads: false,
      data_sharing: false
    },
    
    // Appearance
    appearance: {
      theme: 'light',
      text_size: 'medium',
      high_contrast: false
    }
  })

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'content', name: 'Content', icon: Globe },
    { id: 'privacy', name: 'Privacy', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: SettingsIcon }
  ]

  const countries = [
    { code: 'nigeria', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'kenya', name: 'Kenya', flag: '🇰🇪' },
    { code: 'south-africa', name: 'South Africa', flag: '🇿🇦' },
    { code: 'ghana', name: 'Ghana', flag: '🇬🇭' },
    { code: 'ethiopia', name: 'Ethiopia', flag: '🇪🇹' },
    { code: 'egypt', name: 'Egypt', flag: '🇪🇬' },
    { code: 'morocco', name: 'Morocco', flag: '🇲🇦' },
    { code: 'tanzania', name: 'Tanzania', flag: '🇹🇿' },
    { code: 'uganda', name: 'Uganda', flag: '🇺🇬' },
    { code: 'zambia', name: 'Zambia', flag: '🇿🇲' }
  ]

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'sw', name: 'Swahili' },
    { code: 'ha', name: 'Hausa' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'am', name: 'Amharic' },
    { code: 'zu', name: 'Zulu' },
    { code: 'xh', name: 'Xhosa' },
    { code: 'ar', name: 'Arabic' },
    { code: 'fr', name: 'French' }
  ]

  useEffect(() => {
    if (user && profile) {
      loadUserSettings()
    }
  }, [user, profile])

  const loadUserSettings = async () => {
    try {
      setLoading(true)
      
      // Load user preferences from database
      const userPrefs = await OptimizedNewsService.getUserPreferences?.(user.id)
      
      setSettings(prev => ({
        ...prev,
        username: profile.username || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.bio || '',
        country: profile.country || '',
        region: profile.region || '',
        preferred_language: profile.preferred_language || 'en',
        notifications: userPrefs?.notification_settings || prev.notifications,
        content: userPrefs?.content_preferences || prev.content
      }))
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update profile
      await updateProfile({
        username: settings.username,
        first_name: settings.first_name,
        last_name: settings.last_name,
        bio: settings.bio,
        country: settings.country,
        region: settings.region,
        preferred_language: settings.preferred_language
      })

      // Update preferences
      await OptimizedNewsService.updateUserPreferences?.(user.id, {
        notification_settings: settings.notifications,
        content_preferences: settings.content,
        privacy_settings: settings.privacy,
        appearance_settings: settings.appearance
      })

      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const handleDirectChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SettingsIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to access settings</h2>
          <p className="text-gray-600">
            Customize your news experience
          </p>
        </div>
      </div>
    )
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <SettingsIcon className="w-8 h-8 text-blue-500" />
                Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Customize your Nairobell experience
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 mt-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
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

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={settings.username}
                    onChange={(e) => handleDirectChange('username', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={settings.first_name}
                    onChange={(e) => handleDirectChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={settings.last_name}
                    onChange={(e) => handleDirectChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    value={settings.country}
                    onChange={(e) => handleDirectChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Language
                  </label>
                  <select
                    value={settings.preferred_language}
                    onChange={(e) => handleDirectChange('preferred_language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={settings.bio}
                  onChange={(e) => handleDirectChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
              
              <div className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {key.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {key === 'breaking_news' && 'Get notified about urgent news updates'}
                        {key === 'daily_digest' && 'Receive a daily summary of top stories'}
                        {key === 'trending' && 'Updates about trending topics'}
                        {key === 'community' && 'Community discussion notifications'}
                        {key === 'citizen_reports' && 'New citizen journalism reports'}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Preferences</h2>
              
              <div className="space-y-6">
                {/* Reading preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reading Speed
                  </label>
                  <select
                    value={settings.content.reading_speed}
                    onChange={(e) => handleSettingChange('content', 'reading_speed', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="slow">Slow (Detailed summaries)</option>
                    <option value="medium">Medium (Standard summaries)</option>
                    <option value="fast">Fast (Quick highlights)</option>
                  </select>
                </div>

                {/* Boolean preferences */}
                <div className="space-y-4">
                  {Object.entries(settings.content).filter(([key]) => typeof settings.content[key] === 'boolean').map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {key === 'show_summaries' && 'Display AI-generated article summaries'}
                          {key === 'auto_translate' && 'Automatically translate articles to your preferred language'}
                          {key === 'audio_enabled' && 'Enable audio news and text-to-speech'}
                          {key === 'data_saver_mode' && 'Reduce data usage with optimized content'}
                          {key === 'show_bias_indicators' && 'Show media bias and credibility indicators'}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleSettingChange('content', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Visibility
                  </label>
                  <select
                    value={settings.privacy.profile_visibility}
                    onChange={(e) => handleSettingChange('privacy', 'profile_visibility', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {Object.entries(settings.privacy).filter(([key]) => typeof settings.privacy[key] === 'boolean').map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {key === 'activity_tracking' && 'Allow tracking for personalized recommendations'}
                          {key === 'personalized_ads' && 'Show personalized advertisements'}
                          {key === 'data_sharing' && 'Share anonymized data for research purposes'}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleSettingChange('privacy', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['light', 'dark', 'auto'].map(theme => (
                      <button
                        key={theme}
                        onClick={() => handleSettingChange('appearance', 'theme', theme)}
                        className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-colors ${
                          settings.appearance.theme === theme
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {theme === 'light' && <Sun className="w-4 h-4" />}
                        {theme === 'dark' && <Moon className="w-4 h-4" />}
                        {theme === 'auto' && <Smartphone className="w-4 h-4" />}
                        <span className="capitalize">{theme}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Size
                  </label>
                  <select
                    value={settings.appearance.text_size}
                    onChange={(e) => handleSettingChange('appearance', 'text_size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">High Contrast</div>
                    <div className="text-sm text-gray-500">
                      Improve readability with enhanced contrast
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.appearance.high_contrast}
                      onChange={(e) => handleSettingChange('appearance', 'high_contrast', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage
