import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Globe,
  Smartphone,
  Brain,
  Headphones,
  Users,
  Zap,
  Star,
  Heart,
  TrendingUp,
  Shield,
  Radio,
  MessageCircle,
  Bookmark,
  Languages,
  Award,
  Camera,
  Mic,
  Sparkles,
  Target,
  BarChart3,
  Clock,
  Map,
  ChevronRight,
  Play,
  ArrowRight,
  Check,
  X,
  Menu,
} from "lucide-react";

export default function ModernLandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [stats, setStats] = useState({
    users: 50000,
    articles: 1200000,
    countries: 54,
    languages: 12,
  });

  const features = [
    {
      icon: Brain,
      title: "🧠 AI-Powered Personalization",
      description:
        "Advanced AI learns your preferences and delivers personalized African news that matters to you.",
      demo: "Smart recommendations based on your reading history, location, and interests",
      color: "from-purple-500 to-blue-500",
    },
    {
      icon: Headphones,
      title: "🎧 Multi-Language Audio News",
      description:
        "Listen to news in English, Swahili, French, Hausa, and more African languages.",
      demo: "AI-generated audio summaries with natural voice synthesis",
      color: "from-green-500 to-teal-500",
    },
    {
      icon: Sparkles,
      title: "✨ Interactive Storytelling",
      description:
        "Immersive news experiences with timelines, maps, and interactive elements.",
      demo: "Explore stories through interactive visualizations and multimedia",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Users,
      title: "👥 Community & Citizen Journalism",
      description:
        "Join discussions and contribute local news stories from your community.",
      demo: "Report local events and engage with fellow African news enthusiasts",
      color: "from-pink-500 to-purple-500",
    },
    {
      icon: Zap,
      title: "⚡ Real-Time Impact Analysis",
      description:
        "Understand how news affects different communities across Africa.",
      demo: "See economic, social, and political impact scores for every story",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Shield,
      title: "🛡️ Bias Detection & Multiple Perspectives",
      description:
        "Get balanced views with our AI-powered bias detection and source diversity.",
      demo: "Compare perspectives from different sources and regions",
      color: "from-blue-500 to-cyan-500",
    },
  ];

  const testimonials = [
    {
      name: "Amara Okafor",
      location: "Lagos, Nigeria",
      avatar:
        "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      quote:
        "Nairobell keeps me connected to what's happening across Africa. The audio feature is perfect for my commute! 🚗📱",
      rating: 5,
    },
    {
      name: "Kwame Asante",
      location: "Accra, Ghana",
      avatar:
        "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      quote:
        "The community features let me share stories from my neighborhood. It's like having a voice that reaches the whole continent! 🌍✊",
      rating: 5,
    },
    {
      name: "Fatima Al-Rashid",
      location: "Cairo, Egypt",
      avatar:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      quote:
        "Finally, news that understands African perspectives! The AI recommendations are incredibly accurate. 🎯💯",
      rating: 5,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [features.length]);

  useEffect(() => {
    // Animate stats on load
    const timer = setTimeout(() => {
      setStats({
        users: 125000,
        articles: 2500000,
        countries: 54,
        languages: 12,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Nairobell
              </span>
              <span className="text-sm bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                🌍 Africa's News Hub
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-orange-600 transition-colors"
              >
                Features
              </a>
              <a
                href="#community"
                className="text-gray-600 hover:text-orange-600 transition-colors"
              >
                Community
              </a>
              <a
                href="#about"
                className="text-gray-600 hover:text-orange-600 transition-colors"
              >
                About
              </a>
              <Link
                to="/login"
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300"
              >
                Get Started 🚀
              </Link>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 px-4 py-4"
          >
            <div className="space-y-4">
              <a href="#features" className="block text-gray-600">
                Features
              </a>
              <a href="#community" className="block text-gray-600">
                Community
              </a>
              <a href="#about" className="block text-gray-600">
                About
              </a>
              <Link to="/login" className="block text-orange-600 font-medium">
                Sign In
              </Link>
              <Link
                to="/register"
                className="block bg-orange-500 text-white px-4 py-2 rounded-lg text-center"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Your Gateway to
                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                  {" "}
                  African News
                </span>
                <br />
                <span className="text-3xl md:text-4xl">🌍 Reimagined</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Experience the future of African news with AI-powered
                personalization, multi-language audio, interactive storytelling,
                and vibrant community engagement. Stay informed, stay connected.
                ✨
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Start Reading 📚
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="border-2 border-orange-200 text-orange-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-orange-50 transition-all duration-300 flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  Watch Demo 🎥
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  {
                    label: "Active Readers",
                    value: stats.users.toLocaleString(),
                    icon: "👥",
                  },
                  {
                    label: "News Articles",
                    value: `${(stats.articles / 1000000).toFixed(1)}M`,
                    icon: "📰",
                  },
                  {
                    label: "African Countries",
                    value: stats.countries,
                    icon: "🌍",
                  },
                  { label: "Languages", value: stats.languages, icon: "🗣️" },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              {/* App Preview */}
              <div className="relative mx-auto w-80 h-96 bg-gray-900 rounded-3xl p-2 shadow-2xl">
                <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                  {/* Phone Screen Content */}
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 h-20 flex items-center justify-center">
                    <h3 className="text-white font-bold text-lg">
                      📱 Nairobell News
                    </h3>
                  </div>

                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-16 h-16 bg-orange-100 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded mb-2"></div>
                          <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Features */}
              {[
                { icon: Brain, label: "AI Powered", position: "top-4 -left-4" },
                {
                  icon: Headphones,
                  label: "Audio News",
                  position: "top-12 -right-8",
                },
                {
                  icon: Users,
                  label: "Community",
                  position: "bottom-16 -left-8",
                },
                {
                  icon: Zap,
                  label: "Real-time",
                  position: "bottom-4 -right-4",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5 + index * 0.2 }}
                  className={`absolute ${feature.position} bg-white rounded-full p-3 shadow-lg border-2 border-orange-100`}
                >
                  <feature.icon className="w-6 h-6 text-orange-500" />
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {feature.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-100 to-red-100 rounded-full -translate-y-48 translate-x-48 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full -translate-y-32 -translate-x-32 opacity-50"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              🚀 Revolutionary Features
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Experience news like never before with cutting-edge technology
              designed specifically for the African continent
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Showcase */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFeature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {" "}
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${features[currentFeature].color} flex items-center justify-center mb-6`}
                  >
                    {React.createElement(features[currentFeature].icon, {
                      className: "w-8 h-8 text-white",
                    })}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                    {features[currentFeature].description}
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700 italic">
                      💡 {features[currentFeature].demo}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Feature Navigation */}
              <div className="flex gap-2 mt-6">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeature(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentFeature ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setCurrentFeature(index)}
                  className={`p-6 rounded-xl cursor-pointer transition-all ${
                    index === currentFeature
                      ? "bg-white shadow-lg border-2 border-orange-200"
                      : "bg-white hover:shadow-md"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {feature.description.substring(0, 80)}...
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              💬 What Our Community Says
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600"
            >
              Join thousands of African news enthusiasts
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {testimonial.location}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>

                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Ready to Transform Your News Experience? 🚀
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-orange-100 mb-8"
          >
            Join the future of African news today. It's free, it's powerful, and
            it's built for you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/register"
              className="bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              Get Started Free 🎉
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/explore"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-orange-600 transition-all duration-300"
            >
              Explore Features 🔍
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Nairobell</span>
              </div>
              <p className="text-gray-400 mb-4">
                🌍 Africa's premier news platform, connecting communities across
                the continent.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>🧠 AI Personalization</li>
                <li>🎧 Audio News</li>
                <li>✨ Interactive Stories</li>
                <li>👥 Community</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Careers</li>
                <li>Press</li>
                <li>Contact</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📧 hello@nairobell.com</li>
                <li>🐦 @NairobellNews</li>
                <li>📸 @nairobell</li>
                <li>💼 LinkedIn</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 Nairobell. Made with ❤️ for Africa. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
