import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  Wifi, 
  WifiOff, 
  HardDrive, 
  Trash2, 
  CheckCircle,
  Clock,
  Zap,
  Settings
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const OFFLINE_STORAGE_KEY = 'nairobell_offline_articles'
const OFFLINE_SETTINGS_KEY = 'nairobell_offline_settings'

export default function OfflineManager({ onClose }) {
  const { user, profile } = useAuth()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineArticles, setOfflineArticles] = useState([])
  const [offlineSettings, setOfflineSettings] = useState({
    autoDownload: true,
    maxArticles: 50,
    downloadImages: false, // Data-conscious default
    downloadOnWifiOnly: true,
    categoriesFilter: ['politics', 'business', 'technology']
  })
  const [storageUsed, setStorageUsed] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [lastSync, setLastSync] = useState(null)

  useEffect(() => {
    // Load offline data
    loadOfflineData()
    loadOfflineSettings()
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadOfflineData = () => {
    try {
      const stored = localStorage.getItem(OFFLINE_STORAGE_KEY)
      if (stored) {
        const articles = JSON.parse(stored)
        setOfflineArticles(articles)
        calculateStorageUsed(articles)
      }
    } catch (error) {
      console.error('Error loading offline data:', error)
    }
  }

  const loadOfflineSettings = () => {
    try {
      const stored = localStorage.getItem(OFFLINE_SETTINGS_KEY)
      if (stored) {
        setOfflineSettings(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading offline settings:', error)
    }
  }

  const saveOfflineSettings = (newSettings) => {
    try {
      localStorage.setItem(OFFLINE_SETTINGS_KEY, JSON.stringify(newSettings))
      setOfflineSettings(newSettings)
    } catch (error) {
      console.error('Error saving offline settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const calculateStorageUsed = (articles) => {
    const dataSize = new Blob([JSON.stringify(articles)]).size
    setStorageUsed(dataSize / (1024 * 1024)) // Convert to MB
  }

  const downloadForOffline = async (customArticles = null) => {
    if (!isOnline) {
      toast.error('Cannot download while offline')
      return
    }

    setDownloading(true)
    try {
      // In a real implementation, this would fetch from your API
      // For now, we'll simulate with mock data
      const articlesToDownload = customArticles || await fetchPersonalizedArticles()
      
      // Filter by user preferences
      const filteredArticles = articlesToDownload.filter(article => 
        offlineSettings.categoriesFilter.includes(article.category)
      ).slice(0, offlineSettings.maxArticles)

      // Prepare articles for offline storage (minimize data)
      const offlineData = filteredArticles.map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        content: article.content || article.description,
        source: article.source,
        category: article.category,
        published_at: article.published_at,
        thumbnail: offlineSettings.downloadImages ? article.thumbnail : null,
        url: article.url,
        country_focus: article.country_focus,
        credibility_score: article.credibility_score,
        downloaded_at: new Date().toISOString()
      }))

      // Store in localStorage (in production, use IndexedDB for larger storage)
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(offlineData))
      setOfflineArticles(offlineData)
      calculateStorageUsed(offlineData)
      setLastSync(new Date())
      
      toast.success(`${offlineData.length} articles downloaded for offline reading`)
    } catch (error) {
      console.error('Error downloading articles:', error)
      toast.error('Failed to download articles')
    } finally {
      setDownloading(false)
    }
  }

  const fetchPersonalizedArticles = async () => {
    // Mock implementation - in real app, fetch from your API
    return [
      {
        id: '1',
        title: 'African Economic Growth Surpasses Global Average',
        description: 'Several African economies show strong growth indicators...',
        source: 'African Development Bank',
        category: 'business',
        published_at: new Date().toISOString(),
        thumbnail: 'https://images.pexels.com/photos/3184435/pexels-photo-3184435.jpeg',
        url: 'https://example.com/article1',
        country_focus: ['nigeria', 'kenya', 'ghana'],
        credibility_score: 8.5
      },
      // Add more mock articles...
    ]
  }

  const clearOfflineData = () => {
    try {
      localStorage.removeItem(OFFLINE_STORAGE_KEY)
      setOfflineArticles([])
      setStorageUsed(0)
      toast.success('Offline data cleared')
    } catch (error) {
      console.error('Error clearing offline data:', error)
      toast.error('Failed to clear offline data')
    }
  }

  const removeArticle = (articleId) => {
    try {
      const updatedArticles = offlineArticles.filter(article => article.id !== articleId)
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updatedArticles))
      setOfflineArticles(updatedArticles)
      calculateStorageUsed(updatedArticles)
      toast.success('Article removed')
    } catch (error) {
      console.error('Error removing article:', error)
      toast.error('Failed to remove article')
    }
  }

  const updateSettings = (key, value) => {
    const newSettings = { ...offlineSettings, [key]: value }
    saveOfflineSettings(newSettings)
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
          <WifiOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Offline Reading</h2>
          <p className="text-gray-600 mb-6">
            Sign in to download articles for offline reading
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                Offline Reading Manager
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Download articles for data-conscious reading
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm ${
                isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
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

        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Settings Panel */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Offline Settings
                </h3>

                <div className="space-y-4">
                  {/* Auto Download */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto Download</h4>
                      <p className="text-sm text-gray-500">
                        Automatically download personalized articles
                      </p>
                    </div>
                    <button
                      onClick={() => updateSettings('autoDownload', !offlineSettings.autoDownload)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        offlineSettings.autoDownload ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        offlineSettings.autoDownload ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* WiFi Only */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">WiFi Only</h4>
                      <p className="text-sm text-gray-500">
                        Download only when connected to WiFi
                      </p>
                    </div>
                    <button
                      onClick={() => updateSettings('downloadOnWifiOnly', !offlineSettings.downloadOnWifiOnly)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        offlineSettings.downloadOnWifiOnly ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        offlineSettings.downloadOnWifiOnly ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Download Images */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Download Images</h4>
                      <p className="text-sm text-gray-500">
                        Include images (uses more data)
                      </p>
                    </div>
                    <button
                      onClick={() => updateSettings('downloadImages', !offlineSettings.downloadImages)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        offlineSettings.downloadImages ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        offlineSettings.downloadImages ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Max Articles */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Max Articles</h4>
                    <select
                      value={offlineSettings.maxArticles}
                      onChange={(e) => updateSettings('maxArticles', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={25}>25 articles</option>
                      <option value={50}>50 articles</option>
                      <option value={100}>100 articles</option>
                      <option value={200}>200 articles</option>
                    </select>
                  </div>

                  {/* Categories Filter */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Categories to Download</h4>
                    <div className="space-y-2">
                      {['politics', 'business', 'technology', 'entertainment', 'sports', 'health'].map(category => (
                        <label key={category} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={offlineSettings.categoriesFilter.includes(category)}
                            onChange={(e) => {
                              const newCategories = e.target.checked
                                ? [...offlineSettings.categoriesFilter, category]
                                : offlineSettings.categoriesFilter.filter(c => c !== category)
                              updateSettings('categoriesFilter', newCategories)
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={() => downloadForOffline()}
                  disabled={downloading || !isOnline}
                  className="w-full mt-6 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? 'Downloading...' : 'Download Now'}
                </button>
              </div>
            </div>

            {/* Offline Articles */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Downloaded Articles
                  {offlineArticles.length > 0 && (
                    <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {offlineArticles.length}
                    </span>
                  )}
                </h3>
                {offlineArticles.length > 0 && (
                  <button
                    onClick={clearOfflineData}
                    className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>

              {/* Storage Info */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">Storage Used:</span>
                  <span className="font-medium text-blue-900">
                    {storageUsed.toFixed(2)} MB
                  </span>
                </div>
                {lastSync && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                    <Clock className="w-3 h-3" />
                    Last sync: {lastSync.toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Articles List */}
              {offlineArticles.length === 0 ? (
                <div className="text-center py-8">
                  <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No offline articles</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Download articles to read without internet
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {offlineArticles.map((article) => (
                    <div
                      key={article.id}
                      className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 line-clamp-2 text-sm mb-1">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{article.source}</span>
                            <span>•</span>
                            <span className="capitalize">{article.category}</span>
                            <span>•</span>
                            <span>{new Date(article.downloaded_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeArticle(article.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Data Saving Tips */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Data Saving Tips
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Download on WiFi to save mobile data</li>
                  <li>• Disable images for 70% less data usage</li>
                  <li>• Choose specific categories you're interested in</li>
                  <li>• Clear old articles regularly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}