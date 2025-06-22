import React, { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNews } from '../contexts/NewsContext'
import Navbar from '../components/Navbar'
import Posts from '../components/Posts'
import Loading from '../components/Loading'

function Home() {
  const { user } = useAuth()
  const { fetchBookmarks } = useNews()

  useEffect(() => {
    if (user) {
      fetchBookmarks(user.id)
    }
  }, [user, fetchBookmarks])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Latest African News
          </h1>
          <p className="text-gray-600">
            Stay updated with the most important stories from across Africa
          </p>
        </div>
        <Posts />
      </div>
    </div>
  )
}

export default Home