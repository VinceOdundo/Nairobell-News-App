import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNews } from '../contexts/NewsContext'
import { Bookmark, ExternalLink, Calendar, Tag } from 'lucide-react'

function Post({ post }) {
  const { user } = useAuth()
  const { bookmarks, toggleBookmark } = useNews()
  const isBookmarked = bookmarks.includes(post.id)

  const handleBookmark = () => {
    if (user) {
      toggleBookmark(user.id, post.id)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <article className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {post.image_url && (
        <img
          src={post.image_url}
          alt={post.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(post.created_at)}
          </div>
          {user && (
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-full transition-colors ${
                isBookmarked
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
          {post.title}
        </h2>

        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Tag className="w-4 h-4 mr-1" />
            {post.source || 'African News'}
          </div>

          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              Read More
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export default Post