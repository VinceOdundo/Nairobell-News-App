import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Filter,
  TrendingUp,
  Globe,
  Search,
  RefreshCw,
  Settings,
} from "lucide-react";
import ArticleCard from "./ArticleCard";
import Loading from "../Loading";
import { NewsService } from "../../services/newsService";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const CATEGORIES = [
  { id: "all", label: "All News", icon: Globe },
  { id: "politics", label: "Politics", icon: TrendingUp },
  { id: "business", label: "Business", icon: TrendingUp },
  { id: "technology", label: "Technology", icon: TrendingUp },
  { id: "entertainment", label: "Entertainment", icon: TrendingUp },
  { id: "sports", label: "Sports", icon: TrendingUp },
  { id: "health", label: "Health", icon: TrendingUp },
];

const AFRICAN_COUNTRIES = [
  { code: "all", name: "All Africa", flag: "🌍" },
  { code: "nigeria", name: "Nigeria", flag: "🇳🇬" },
  { code: "kenya", name: "Kenya", flag: "🇰🇪" },
  { code: "south-africa", name: "South Africa", flag: "🇿🇦" },
  { code: "ghana", name: "Ghana", flag: "🇬🇭" },
  { code: "ethiopia", name: "Ethiopia", flag: "🇪🇹" },
  { code: "egypt", name: "Egypt", flag: "🇪🇬" },
  { code: "morocco", name: "Morocco", flag: "🇲🇦" },
];

export default function NewsFeed({ personalized = false }) {
  const { user, profile } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: "100px",
  });

  // Load initial articles
  useEffect(() => {
    loadArticles(true);
  }, [selectedCategory, selectedCountry, personalized]);

  // Load more when in view
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadArticles(false);
    }
  }, [inView, hasMore, loading]);

  const loadArticles = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(0);
    }

    try {
      const currentPage = reset ? 0 : page;
      const filters = {
        category: selectedCategory === "all" ? null : selectedCategory,
        country: selectedCountry === "all" ? null : selectedCountry,
        limit: 10,
        offset: currentPage * 10,
        search: searchQuery || null,
      };

      let result;
      if (personalized && user) {
        result = await NewsService.getPersonalizedFeed(user.id, filters);
      } else {
        result = await NewsService.getArticles(filters);
      }

      if (reset) {
        setArticles(result.articles);
      } else {
        setArticles((prev) => [...prev, ...result.articles]);
      }

      setHasMore(result.hasMore);
      setPage(currentPage + 1);
    } catch (error) {
      console.error("Error loading articles:", error);
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadArticles(true);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      loadArticles(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {personalized ? "Your News" : "Latest News"}
          </h1>
          <p className="text-gray-600 text-sm">
            {personalized
              ? "Personalized news based on your interests"
              : "Stay updated with the latest from across Africa"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-600 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search African news..."
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-2 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200"
          >
            {/* Categories */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      selectedCategory === category.id
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Countries */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Countries
              </h3>
              <div className="flex flex-wrap gap-2">
                {AFRICAN_COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => setSelectedCountry(country.code)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors flex items-center gap-1 ${
                      selectedCountry === country.code
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"
                    }`}
                  >
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Articles Grid */}
      {loading && articles.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      ) : (
        <>
          {" "}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
            {articles.map((article, index) => (
              <ArticleCard
                key={`${article.id}-${index}`}
                article={article}
                compact={false}
              />
            ))}
          </div>
          {/* Load More Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              <Loading />
            </div>
          )}
          {/* No More Articles */}
          {!hasMore && articles.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                You've reached the end of the news feed
              </p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-orange-600 hover:text-orange-700 font-medium"
              >
                Refresh for more stories
              </button>
            </div>
          )}
          {/* No Articles */}
          {!loading && articles.length === 0 && (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No articles found
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedCountry("all");
                  setSearchQuery("");
                  loadArticles(true);
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
