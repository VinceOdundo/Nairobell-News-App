import React from 'react'
import { useNews } from '../contexts/NewsContext'
import Post from './Post'
import Loading from './Loading'

function Posts() {
  const { posts, loading } = useNews()

  if (loading) {
    return <Loading />
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No news articles available yet.</p>
        <p className="text-gray-400 text-sm mt-2">Check back later for updates.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  )
}

export default Posts