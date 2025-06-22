import React from 'react'
import { Link } from 'react-router-dom'
import { Newspaper, Globe, Users, TrendingUp } from 'lucide-react'

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Newspaper className="h-8 w-8 text-orange-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Nairobell</span>
            </div>
            <div className="flex space-x-4">
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
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            African News
            <span className="text-orange-600"> Aggregator</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Stay informed with the latest news from across Africa. Built by Africans, for Africa.
            Get personalized news recommendations powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Start Reading
            </Link>
            <Link
              to="/home"
              className="border-2 border-orange-600 text-orange-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              Browse News
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-white rounded-xl shadow-sm">
            <Globe className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pan-African Coverage</h3>
            <p className="text-gray-600">
              News from all 54 African countries in one place
            </p>
          </div>
          <div className="text-center p-8 bg-white rounded-xl shadow-sm">
            <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered</h3>
            <p className="text-gray-600">
              Smart recommendations based on your interests
            </p>
          </div>
          <div className="text-center p-8 bg-white rounded-xl shadow-sm">
            <Users className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Driven</h3>
            <p className="text-gray-600">
              Built by African developers for African voices
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing