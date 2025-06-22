import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const NewsContext = createContext()

export function useNews() {
  return useContext(NewsContext)
}

export function NewsProvider({ children }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [bookmarks, setBookmarks] = useState([])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookmarks = async (userId) => {
    if (!userId) return
    
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', userId)
      
      if (error) throw error
      setBookmarks(data?.map(b => b.post_id) || [])
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    }
  }

  const toggleBookmark = async (userId, postId) => {
    if (!userId) return

    try {
      const isBookmarked = bookmarks.includes(postId)
      
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', postId)
        
        if (error) throw error
        setBookmarks(prev => prev.filter(id => id !== postId))
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({ user_id: userId, post_id: postId })
        
        if (error) throw error
        setBookmarks(prev => [...prev, postId])
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const value = {
    posts,
    loading,
    bookmarks,
    fetchPosts,
    fetchBookmarks,
    toggleBookmark
  }

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  )
}