import { useState, useEffect, useCallback, useRef } from 'react'
import { OptimizedNewsService } from '../services/optimizedNewsService'
import { DatabaseService } from '../services/databaseService'

// Custom hook for data fetching with optimization
export const useOptimizedData = (fetchFunction, dependencies = [], options = {}) => {
  const {
    enabled = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 60 * 1000, // 1 minute
    retryOnError = true,
    maxRetries = 3
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  const retryCount = useRef(0)
  const abortController = useRef(null)

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return

    // Check if data is still fresh
    if (!force && data && lastFetch && (Date.now() - lastFetch < staleTime)) {
      return
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort()
    }

    abortController.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const result = await fetchFunction(abortController.current.signal)
      setData(result)
      setLastFetch(Date.now())
      retryCount.current = 0
    } catch (err) {
      if (err.name === 'AbortError') {
        return // Request was cancelled
      }

      setError(err)
      
      // Auto-retry logic
      if (retryOnError && retryCount.current < maxRetries) {
        retryCount.current++
        setTimeout(() => fetchData(true), 1000 * retryCount.current)
      } else {
        await DatabaseService.logError(err, { 
          hook: 'useOptimizedData',
          fetchFunction: fetchFunction.name 
        })
      }
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, enabled, data, lastFetch, staleTime, retryOnError, maxRetries])

  const refetch = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  useEffect(() => {
    fetchData()
    return () => {
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, dependencies)

  // Cache cleanup
  useEffect(() => {
    const cleanup = () => {
      if (lastFetch && (Date.now() - lastFetch > cacheTime)) {
        setData(null)
        setLastFetch(null)
      }
    }

    const interval = setInterval(cleanup, cacheTime)
    return () => clearInterval(interval)
  }, [lastFetch, cacheTime])

  return {
    data,
    loading,
    error,
    refetch,
    isStale: lastFetch && (Date.now() - lastFetch > staleTime),
    isFresh: lastFetch && (Date.now() - lastFetch < staleTime)
  }
}

// Hook for articles
export const useArticles = (options = {}) => {
  return useOptimizedData(
    async (signal) => {
      const result = await OptimizedNewsService.getArticles({
        ...options,
        signal
      })
      return result
    },
    [JSON.stringify(options)],
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for articles
      cacheTime: 10 * 60 * 1000 // 10 minutes cache
    }
  )
}

// Hook for trending topics
export const useTrendingTopics = () => {
  return useOptimizedData(
    async () => OptimizedNewsService.getTrendingTopics(),
    [],
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 15 * 60 * 1000 // 15 minutes cache
    }
  )
}

// Hook for personalized feed
export const usePersonalizedFeed = (userId) => {
  return useOptimizedData(
    async () => {
      if (!userId) return { articles: [], total: 0, hasMore: false }
      return OptimizedNewsService.getPersonalizedFeed(userId)
    },
    [userId],
    {
      enabled: !!userId,
      staleTime: 3 * 60 * 1000, // 3 minutes
      cacheTime: 10 * 60 * 1000 // 10 minutes cache
    }
  )
}

// Hook for countries and languages
export const useStaticData = () => {
  const countries = useOptimizedData(
    () => OptimizedNewsService.getCountries(),
    [],
    {
      staleTime: 60 * 60 * 1000, // 1 hour
      cacheTime: 24 * 60 * 60 * 1000 // 24 hours cache
    }
  )

  const languages = useOptimizedData(
    () => OptimizedNewsService.getLanguages(),
    [],
    {
      staleTime: 60 * 60 * 1000, // 1 hour
      cacheTime: 24 * 60 * 60 * 1000 // 24 hours cache
    }
  )

  return {
    countries: countries.data || [],
    languages: languages.data || [],
    loading: countries.loading || languages.loading,
    error: countries.error || languages.error
  }
}

// Hook for infinite scroll
export const useInfiniteArticles = (baseOptions = {}) => {
  const [allData, setAllData] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    setError(null)

    try {
      const result = await OptimizedNewsService.getArticles({
        ...baseOptions,
        offset: page * (baseOptions.limit || 20),
        limit: baseOptions.limit || 20
      })

      if (page === 0) {
        setAllData(result.articles)
      } else {
        setAllData(prev => [...prev, ...result.articles])
      }

      setHasMore(result.hasMore)
      setPage(prev => prev + 1)
    } catch (err) {
      setError(err)
      await DatabaseService.logError(err, { 
        hook: 'useInfiniteArticles',
        page,
        baseOptions 
      })
    } finally {
      setLoading(false)
    }
  }, [page, hasMore, loading, baseOptions])

  const reset = useCallback(() => {
    setAllData([])
    setPage(0)
    setHasMore(true)
    setError(null)
  }, [])

  useEffect(() => {
    reset()
  }, [JSON.stringify(baseOptions)])

  useEffect(() => {
    if (page === 0) {
      loadMore()
    }
  }, [page])

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    reset
  }
}

// Hook for search with debouncing
export const useSearchArticles = (query, filters = {}, debounceMs = 500) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(handler)
  }, [query, debounceMs])

  return useOptimizedData(
    async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { articles: [], total: 0, hasMore: false }
      }
      return OptimizedNewsService.searchArticles(debouncedQuery, filters)
    },
    [debouncedQuery, JSON.stringify(filters)],
    {
      enabled: debouncedQuery && debouncedQuery.length >= 2,
      staleTime: 30 * 1000, // 30 seconds for search
      cacheTime: 5 * 60 * 1000 // 5 minutes cache
    }
  )
}