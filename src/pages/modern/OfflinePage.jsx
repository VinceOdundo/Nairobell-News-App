import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  WifiOff, 
  Download, 
  Smartphone,
  Globe,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Signal
} from 'lucide-react'
import { OfflineService } from '../../services/offlineService'
import { OptimizedNewsService } from '../../services/optimizedNewsService'
import ArticleCard from '../../components/modern/ArticleCard'
import Loading from '../../components/Loading'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const OfflinePage = () => {
  const { user } = useAuth()
  const [offlineArticles, setOfflineArticles] = useState([])
  const [offlineStats, setOfflineStats] = useState({
    totalArticles: 0,
    totalSize: 0,
    lastSync: null
  })
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [downloadQueue, setDownloadQueue] = useState([])

  useEffect(() => {
    loadOfflineData()
    
    // Listen for online/offline changes
    const handleOnlineChange = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnlineChange)
    window.addEventListener('offline', handleOnlineChange)
    
    return () => {
      window.removeEventListener('online', handleOnlineChange)
      window.removeEventListener('offline', handleOnlineChange)
    }
  }, [])

  const loadOfflineData = async () => {
    try {
      setLoading(true)
      
      // Load offline articles
      const articles = await OfflineService.getOfflineArticles()
      setOfflineArticles(articles)
      
      // Load offline stats
      const stats = await OfflineService.getOfflineStats()
      setOfflineStats(stats)
      
    } catch (error) {
      console.error('Error loading offline data:', error)
      toast.error('Failed to load offline data')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncContent = async () => {
    if (!isOnline) {
      toast.error('No internet connection available')
      return
    }

    setSyncing(true)
    try {
      // Get latest articles for offline storage
      const latestArticles = await OptimizedNewsService.getArticles({
        limit: 20,
        trending: true
      })

      // Download articles for offline use
      let successCount = 0
      for (const article of latestArticles.articles) {
        try {
          await OfflineService.saveArticleOffline(article)
          successCount++
        } catch (error) {
          console.error('Error saving article offline:', error)
        }
      }

      // Update offline stats
      await OfflineService.updateOfflineStats()
      await loadOfflineData()
      
      toast.success(`Synced ${successCount} articles for offline reading`)
    } catch (error) {
      console.error('Error syncing content:', error)
      toast.error('Failed to sync content')
    } finally {
      setSyncing(false)
    }
  }

  const handleSmartSync = async () => {
    if (!isOnline) {
      toast.error('No internet connection available')
      return
    }

    setSyncing(true)
    try {
      // Smart sync based on user preferences and reading history
      let userPrefs = null
      if (user) {
        // Get user preferences for smarter content selection
        userPrefs = await OptimizedNewsService.getUserPreferences?.(user.id)
      }

      const articles = await OptimizedNewsService.getArticles({
        limit: 15,
        category: userPrefs?.preferred_categories?.[0],
        country: userPrefs?.preferred_countries?.[0]
      })

      let successCount = 0
      for (const article of articles.articles) {
        try {
          await OfflineService.saveArticleOffline(article)
          successCount++
        } catch (error) {
          console.error('Error saving article offline:', error)
        }
      }

      await loadOfflineData()
      toast.success(`Smart sync completed: ${successCount} personalized articles downloaded`)
    } catch (error) {
      console.error('Error during smart sync:', error)
      toast.error('Smart sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleRemoveOfflineArticle = async (articleId) => {
    try {
      await OfflineService.removeOfflineArticle(articleId)
      setOfflineArticles(prev => prev.filter(article => article.id !== articleId))
      toast.success('Article removed from offline storage')
    } catch (error) {
      console.error('Error removing offline article:', error)
      toast.error('Failed to remove article')
    }
  }

  const handleClearAllOffline = async () => {
    if (window.confirm('Are you sure you want to clear all offline content?')) {
      try {
        await OfflineService.clearAllOfflineContent()
        setOfflineArticles([])
        setOfflineStats({
          totalArticles: 0,
          totalSize: 0,
          lastSync: null
        })
        toast.success('All offline content cleared')
      } catch (error) {
        console.error('Error clearing offline content:', error)
        toast.error('Failed to clear offline content')
      }
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <WifiOff className="w-8 h-8 text-purple-500" />
                Offline Reading
              </h1>
              <p className="text-gray-600 mt-1">
                Stay informed even without internet connection
              </p>
            </div>

            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isOnline 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isOnline ? (
                <>
                  <Signal className="w-4 h-4" />
                  <span className="text-sm font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {offlineStats.totalArticles}
                  </div>
                  <div className="text-sm text-blue-600">Articles Saved</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatFileSize(offlineStats.totalSize)}
                  </div>
                  <div className="text-sm text-green-600">Storage Used</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-900">
                    {offlineStats.lastSync 
                      ? new Date(offlineStats.lastSync).toLocaleDateString()
                      : 'Never'
                    }
                  </div>
                  <div className="text-sm text-purple-600">Last Sync</div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-900">
                    {isOnline ? 'Ready' : 'Active'}
                  </div>
                  <div className="text-sm text-orange-600">Offline Mode</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Sync Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Content</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={handleSyncContent}
              disabled={!isOnline || syncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Latest News
                </>
              )}
            </button>

            {user && (
              <button
                onClick={handleSmartSync}
                disabled={!isOnline || syncing}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                <Globe className="w-4 h-4" />
                Smart Sync (Personalized)
              </button>
            )}

            <button
              onClick={handleClearAllOffline}
              disabled={offlineStats.totalArticles === 0}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <WifiOff className="w-4 h-4" />
              Clear All Offline
            </button>
          </div>

          {!isOnline && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  You're currently offline. Sync will be available when connection is restored.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Offline Articles */}
        {offlineArticles.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Offline Articles ({offlineArticles.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offlineArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  <ArticleCard 
                    article={article} 
                    isOffline={true}
                    showActions={false}
                  />
                  
                  {/* Offline Indicator */}
                  <div className="absolute top-3 left-3 bg-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    Offline
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveOfflineArticle(article.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    title="Remove from offline"
                  >
                    <WifiOff className="w-4 h-4" />
                  </button>

                  {/* Download Date */}
                  <div className="absolute bottom-3 left-3 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    Downloaded {new Date(article.offline_saved_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <WifiOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offline content</h3>
            <p className="text-gray-600 mb-6">
              {isOnline 
                ? 'Sync some articles to read them offline' 
                : 'No articles available for offline reading'
              }
            </p>
            
            {isOnline && (
              <button
                onClick={handleSyncContent}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Download Articles for Offline
              </button>
            )}
          </div>
        )}

        {/* Tips for Offline Usage */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Offline Reading Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <strong>Smart Sync:</strong> Automatically downloads articles based on your reading preferences
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <strong>Data Efficient:</strong> Only essential content is downloaded to save storage
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <strong>Auto Cleanup:</strong> Old articles are automatically removed to free space
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <strong>Background Sync:</strong> Content syncs automatically when connected to WiFi
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfflinePage
