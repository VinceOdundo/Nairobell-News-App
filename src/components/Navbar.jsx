import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Newspaper, User, Home } from 'lucide-react'

function Navbar() {
  const { user } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Newspaper className="h-8 w-8 text-orange-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Nairobell</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/home"
              className="flex items-center text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>

            {user ? (
              <Link
                to="/profile"
                className="flex items-center text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-orange-600 text-white hover:bg-orange-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar