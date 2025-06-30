import { supabase } from "../lib/supabase";

// API configuration
const API_BASE_URL = "http://localhost:5000/api";

export class NewsService {
  s;

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
      const data = await this.fetchFromAPI("/trending", { limit });
      return data.trending_topics || [];
    } catch (error) {
      console.warn("Unable to fetch trending news, using fallback");
      // Return mock trending topics
      return [
        {
          topic: "African Union Summit",
          score: 0.9,
          category: "politics",
          description: "Continental cooperation",
        },
        {
          topic: "Economic Growth",
          score: 0.8,
          category: "business",
          description: "African economies expanding",
        },
        {
          topic: "Technology Innovation",
          score: 0.7,
          category: "technology",
          description: "Tech hubs emerging",
        },
        {
          topic: "Climate Action",
          score: 0.6,
          category: "environment",
          description: "Green energy initiatives",
        },
        {
          topic: "Healthcare Progress",
          score: 0.5,
          category: "health",
          description: "Medical advances",
        },
      ];
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
}
