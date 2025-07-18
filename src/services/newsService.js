import { supabase } from "../lib/supabase";

// API configuration
const API_BASE_URL = "http://localhost:5000/api";

export class NewsService {
  // Mock data fallback for when API is unavailable
  static mockArticles = [
    {
      id: "1",
      title: "African Union Summit Addresses Climate Change",
      description:
        "Leaders from across Africa gather to discuss climate adaptation strategies and sustainable development goals.",
      content:
        "The African Union Summit opened today with a focus on climate change adaptation...",
      url: "https://example.com/article1",
      thumbnail:
        "https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=800",
      source: "African News Network",
      category: "politics",
      country_focus: ["africa"],
      language: "en",
      published_at: new Date().toISOString(),
      is_breaking: false,
      is_trending: true,
      engagement_score: 8.5,
      credibility_score: 9.0,
    },
    {
      id: "2",
      title: "Tech Innovation Hubs Emerge Across Nigeria",
      description:
        "Lagos and Abuja lead the charge in African fintech revolution with new startup incubators.",
      content:
        "Nigeria continues to cement its position as Africa's tech giant...",
      url: "https://example.com/article2",
      thumbnail:
        "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=800",
      source: "TechCabal",
      category: "technology",
      country_focus: ["nigeria"],
      language: "en",
      published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      is_breaking: false,
      is_trending: false,
      engagement_score: 7.8,
      credibility_score: 8.5,
    },
    {
      id: "3",
      title: "Kenya's Green Energy Project Shows Promise",
      description:
        "Solar and wind energy initiatives in Kenya exceed expectations, providing clean electricity to rural communities.",
      content:
        "Kenya's ambitious renewable energy program has achieved remarkable milestones...",
      url: "https://example.com/article3",
      thumbnail:
        "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800",
      source: "Daily Nation Kenya",
      category: "business",
      country_focus: ["kenya"],
      language: "en",
      published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      is_breaking: true,
      is_trending: true,
      engagement_score: 9.2,
      credibility_score: 8.8,
    },
  ];

  // Fetch articles from the Python API
  static async fetchFromAPI(endpoint, params = {}) {
    try {
      const url = new URL(`${API_BASE_URL}${endpoint}`);
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API fetch error:", error);
      throw error;
    }
  }

  // Get latest news with fallback to mock data
  static async getLatestNews(options = {}) {
    const {
      page = 1,
      limit = 20,
      category = "",
      country = "",
      search = "",
    } = options;

    try {
      // Try to fetch from Python API first
      const data = await this.fetchFromAPI("/news", {
        page,
        limit,
        category,
        country,
        search,
      });

      // Ensure proper data structure
      const articles = data.articles || [];

      return {
        articles: articles.map((article) => ({
          ...article,
          // Ensure required fields exist
          id: article.id || Math.random().toString(36).substr(2, 9),
          title: article.title || "Untitled",
          description: article.description || "",
          content: article.content || article.description || "",
          url: article.url || "#",
          thumbnail:
            article.thumbnail ||
            `https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80`,
          source: article.source || "Unknown Source",
          category: article.category || "general",
          country_focus: Array.isArray(article.country_focus)
            ? article.country_focus
            : ["africa"],
          language: article.language || "en",
          published_at: article.published_at || new Date().toISOString(),
          is_breaking: article.is_breaking || false,
          is_trending: article.is_trending || false,
          engagement_score: article.engagement_score || 0,
          credibility_score: article.credibility_score || 5.0,
        })),
        hasMore: data.has_more || false,
        total: data.total || 0,
      };
    } catch (error) {
      console.warn("Python API unavailable, using fallback data:", error);

      // Fallback to mock data
      let articles = [...this.mockArticles];

      // Apply filters to mock data
      if (category) {
        articles = articles.filter(
          (a) => a.category.toLowerCase() === category.toLowerCase()
        );
      }
      if (country) {
        articles = articles.filter((a) =>
          a.country_focus.some((c) =>
            c.toLowerCase().includes(country.toLowerCase())
          )
        );
      }
      if (search) {
        const searchLower = search.toLowerCase();
        articles = articles.filter(
          (a) =>
            a.title.toLowerCase().includes(searchLower) ||
            a.description.toLowerCase().includes(searchLower)
        );
      }

      // Pagination for mock data
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        articles: articles.slice(start, end),
        hasMore: end < articles.length,
        total: articles.length,
      };
    }
  }

  // Get personalized feed with AI ranking fallback
  static async getPersonalizedFeed(userId, preferences = {}) {
    try {
      // First get general news
      const newsData = await this.getLatestNews({ limit: 50 });
      let articles = newsData.articles;

      if (!articles || articles.length === 0) {
        return { articles: [], hasMore: false };
      }

      // Simple personalization based on preferences
      if (preferences.country) {
        articles = articles.filter(
          (a) =>
            a.country_focus?.some((c) =>
              c.toLowerCase().includes(preferences.country.toLowerCase())
            ) ||
            a.country_focus?.includes("international") ||
            a.country_focus?.includes("africa")
        );
      }

      if (
        preferences.preferred_language &&
        preferences.preferred_language !== "en"
      ) {
        // Prioritize articles in preferred language, but don't exclude English
        articles.sort((a, b) => {
          if (
            a.language === preferences.preferred_language &&
            b.language !== preferences.preferred_language
          )
            return -1;
          if (
            b.language === preferences.preferred_language &&
            a.language !== preferences.preferred_language
          )
            return 1;
          return 0;
        });
      }

      if (preferences.interests && preferences.interests.length > 0) {
        articles.sort((a, b) => {
          const aScore = preferences.interests.includes(a.category) ? 1 : 0;
          const bScore = preferences.interests.includes(b.category) ? 1 : 0;
          return bScore - aScore;
        });
      }

      // Boost credibility score for personalized ranking
      articles.sort((a, b) => {
        const aScore = (a.credibility_score || 5) + (a.engagement_score || 0);
        const bScore = (b.credibility_score || 5) + (b.engagement_score || 0);
        return bScore - aScore;
      });

      // Limit to 20 for personalized feed
      return {
        articles: articles.slice(0, 20),
        hasMore: articles.length > 20,
      };
    } catch (error) {
      console.error("Error getting personalized feed:", error);
      // Fallback to latest news
      return await this.getLatestNews({ limit: 20 });
    }
  }

  // Get trending news
  static async getTrendingNews(limit = 10) {
    try {
      const data = await this.fetchFromAPI("/news/trending", { limit });
      return {
        articles: data.articles || [],
        total: data.total || 0,
        hasMore: data.hasMore || false,
      };
    } catch (error) {
      console.error("Error fetching trending news:", error);
      // Return mock trending articles as fallback
      const trendingMock = this.mockArticles.filter(
        (article) => article.is_trending
      );
      return {
        articles: trendingMock,
        total: trendingMock.length,
        hasMore: false,
      };
    }
  }

  // Get trending topics - NEW METHOD TO FIX THE ERROR
  static async getTrendingTopics() {
    try {
      const data = await this.fetchFromAPI("/trending-topics");
      return data.topics || [];
    } catch (error) {
      console.error("Error fetching trending topics:", error);
      // Return mock trending topics as fallback
      return [
        { id: 1, name: "Climate Change", count: 45, trend: "up" },
        { id: 2, name: "Technology", count: 38, trend: "up" },
        { id: 3, name: "Politics", count: 32, trend: "stable" },
        { id: 4, name: "Business", count: 28, trend: "down" },
        { id: 5, name: "Health", count: 24, trend: "up" },
      ];
    }
  }

  // Get topic trends - Additional method for better trending analysis
  static async getTopicTrends(timeframe = "24h") {
    try {
      const data = await this.fetchFromAPI("/topic-trends", { timeframe });
      return data.trends || [];
    } catch (error) {
      console.error("Error fetching topic trends:", error);
      return [];
    }
  }

  // Get articles method - updated to work with the existing structure
  static async getArticles(options = {}) {
    const {
      page = 1,
      limit = 20,
      category = "",
      country = "",
      search = "",
      trending = false,
    } = options;

    try {
      // Try to fetch from Python API first
      const data = await this.fetchFromAPI("/news", {
        page,
        limit,
        category,
        country,
        search,
        trending,
      });

      return {
        articles: data.articles || [],
        total: data.total || 0,
        hasMore: data.hasMore || false,
      };
    } catch (error) {
      console.error("Error fetching articles:", error);
      // Return mock data as fallback
      let filteredArticles = [...this.mockArticles];

      if (trending) {
        filteredArticles = filteredArticles.filter(
          (article) => article.is_trending
        );
      }

      if (category) {
        filteredArticles = filteredArticles.filter(
          (article) => article.category === category
        );
      }

      return {
        articles: filteredArticles.slice(0, limit),
        total: filteredArticles.length,
        hasMore: filteredArticles.length > limit,
      };
    }
  }

  // Get news by category
  static async getNewsByCategory(category, options = {}) {
    return await this.getLatestNews({ ...options, category });
  }

  // Get news by country
  static async getNewsByCountry(country, options = {}) {
    return await this.getLatestNews({ ...options, country });
  }

  // Search news
  static async searchNews(query, options = {}) {
    return await this.getLatestNews({ ...options, search: query });
  }

  // Get article summary (mock implementation)
  static async getArticleSummary(
    articleId,
    summaryType = "short",
    language = "en"
  ) {
    // This would normally call an AI service
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay

    const summaries = {
      short:
        "This article discusses recent developments in African news, highlighting key points and their impact on the region.",
      detailed:
        "This comprehensive article explores the latest developments across Africa, examining the political, economic, and social implications. The analysis includes expert opinions and data-driven insights that help readers understand the broader context and potential future outcomes.",
      eli5: "This news story talks about important things happening in Africa. It explains why these events matter and how they might affect people living there.",
    };

    return summaries[summaryType] || summaries.short;
  }

  // Save article (bookmark)
  static async saveArticle(userId, articleId) {
    try {
      const { data, error } = await supabase.from("bookmarks").insert([
        {
          user_id: userId,
          article_id: articleId,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error saving article:", error);
      return { success: false, error: error.message };
    }
  }

  // Remove saved article
  static async removeSavedArticle(userId, articleId) {
    try {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("article_id", articleId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error removing saved article:", error);
      return { success: false, error: error.message };
    }
  }

  // Get saved articles
  static async getSavedArticles(userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const start = (page - 1) * limit;

      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(start, start + limit - 1);

      if (error) throw error;

      // For now, return bookmark records. In a full implementation,
      // you'd join with actual article data
      return {
        articles: data || [],
        hasMore: (data?.length || 0) === limit,
        total: data?.length || 0,
      };
    } catch (error) {
      console.error("Error getting saved articles:", error);
      return { articles: [], hasMore: false, total: 0 };
    }
  }

  // Track reading activity
  static async trackReading(userId, articleId, readingTime = 0) {
    try {
      const { error } = await supabase.from("reading_history").insert([
        {
          user_id: userId,
          post_id: articleId,
          read_duration: readingTime,
          interaction_type: "read",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error tracking reading:", error);
      return { success: false };
    }
  }

  // Get reading history
  static async getReadingHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from("reading_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting reading history:", error);
      return [];
    }
  }

  // Refresh news cache
  static async refreshNews() {
    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to refresh news");
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error refreshing news:", error);
      return { success: false, error: error.message };
    }
  }

  // Get available categories
  static async getCategories() {
    try {
      const data = await this.fetchFromAPI("/categories");
      return (
        data.categories || [
          "general",
          "politics",
          "business",
          "technology",
          "sports",
          "health",
        ]
      );
    } catch (error) {
      return [
        "general",
        "politics",
        "business",
        "technology",
        "sports",
        "health",
      ];
    }
  }

  // Get available countries
  static async getCountries() {
    try {
      const data = await this.fetchFromAPI("/countries");
      return (
        data.countries || [
          "nigeria",
          "kenya",
          "south-africa",
          "ghana",
          "ethiopia",
          "egypt",
        ]
      );
    } catch (error) {
      return ["nigeria", "kenya", "south-africa", "ghana", "ethiopia", "egypt"];
    }
  }

  // Get news sources
  static async getSources() {
    try {
      const data = await this.fetchFromAPI("/sources");
      return data.sources || [];
    } catch (error) {
      return [];
    }
  }

  // Additional safety methods to prevent undefined function errors
  static async safeApiCall(methodName, ...args) {
    try {
      if (typeof this[methodName] === "function") {
        return await this[methodName](...args);
      } else {
        console.warn(`Method ${methodName} not found in NewsService`);
        return { articles: [], total: 0, hasMore: false };
      }
    } catch (error) {
      console.error(`Error calling NewsService.${methodName}:`, error);
      return { articles: [], total: 0, hasMore: false };
    }
  }

  // Ensure getArticles method exists and works
  static async getArticles(options = {}) {
    try {
      return await this.getLatestNews(options);
    } catch (error) {
      console.error("Error in getArticles:", error);
      return { articles: [], total: 0, hasMore: false };
    }
  }
}
