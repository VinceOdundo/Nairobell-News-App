import { supabase } from "../lib/supabase.js";
import { DatabaseService } from "./databaseService.js";
import { GeminiService } from "./enhancedGeminiService.js";

export class NewsService {
  static API_KEY =
    import.meta.env.VITE_GNEWS_API_KEY || "bab8859f3225f004320365ab98bb7076";
  static BASE_URL = "https://gnews.io/api/v4";

  // African countries mapping for GNews API
  static AFRICAN_COUNTRIES = {
    nigeria: "ng",
    kenya: "ke",
    "south-africa": "za",
    ghana: "gh",
    ethiopia: "et",
    egypt: "eg",
    morocco: "ma",
    tunisia: "tn",
    uganda: "ug",
    tanzania: "tz",
    algeria: "dz",
    angola: "ao",
    cameroon: "cm",
    "ivory-coast": "ci",
    senegal: "sn",
  };

  // Category mapping for GNews API
  static CATEGORY_MAPPING = {
    all: "general",
    politics: "general",
    business: "business",
    technology: "technology",
    entertainment: "entertainment",
    sports: "sports",
    health: "health",
    science: "science",
  };

  /**
   * Get articles from GNews API and optionally save to database
   */
  static async getArticles(options = {}) {
    const {
      category = "all",
      country = null,
      language = "en",
      query = null,
      limit = 10,
      trending = false,
      userId = null,
      offset = 0,
      saveToDb = true,
    } = options;

    try {
      let articles = [];

      if (trending) {
        articles = await this.getTopHeadlines({
          category,
          country,
          language,
          limit,
        });
      } else if (query) {
        articles = await this.searchArticles({
          query,
          category,
          country,
          language,
          limit,
        });
      } else {
        // Get general news
        articles = await this.getTopHeadlines({
          category,
          country,
          language,
          limit,
        });
      }

      // Save articles to database if requested
      if (saveToDb && articles.length > 0) {
        try {
          await this.saveArticlesToDatabase(articles);
        } catch (dbError) {
          console.warn("Failed to save articles to database:", dbError);
        }
      }

      // Apply user personalization if userId provided
      if (userId && articles.length > 0) {
        try {
          articles = await this.personalizeArticles(articles, userId);
        } catch (personalizeError) {
          console.warn("Failed to personalize articles:", personalizeError);
        }
      }

      return {
        articles: articles.slice(offset, offset + limit),
        total: articles.length,
        hasMore: articles.length > offset + limit,
      };
    } catch (error) {
      console.error("Error fetching articles:", error);

      // Fallback to database articles if API fails
      try {
        const dbArticles = await DatabaseService.getArticles({
          category: category === "all" ? null : category,
          country,
          limit,
          offset,
        });
        return dbArticles;
      } catch (dbError) {
        console.error("Database fallback failed:", dbError);
        return {
          articles: [],
          total: 0,
          hasMore: false,
          error: error.message,
        };
      }
    }
  }

  /**
   * Get top headlines from GNews API
   */
  static async getTopHeadlines(options = {}) {
    const {
      category = "general",
      country = null,
      language = "en",
      limit = 10,
      query = null,
    } = options;

    try {
      const params = new URLSearchParams({
        category: this.CATEGORY_MAPPING[category] || "general",
        lang: language,
        max: Math.min(limit, 100), // GNews max is 100
        apikey: this.API_KEY,
      });

      if (country && this.AFRICAN_COUNTRIES[country]) {
        params.append("country", this.AFRICAN_COUNTRIES[country]);
      }

      if (query) {
        params.append("q", query);
      }

      const response = await fetch(`${this.BASE_URL}/top-headlines?${params}`);

      if (!response.ok) {
        throw new Error(
          `GNews API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.articles) {
        return this.transformGNewsArticles(data.articles);
      }

      return [];
    } catch (error) {
      console.error("Error fetching top headlines:", error);
      throw error;
    }
  }

  /**
   * Search articles using GNews API
   */
  static async searchArticles(options = {}) {
    const {
      query,
      category = null,
      country = null,
      language = "en",
      limit = 10,
      sortBy = "publishedAt",
    } = options;

    if (!query || query.trim().length < 2) {
      throw new Error("Search query must be at least 2 characters long");
    }

    try {
      const params = new URLSearchParams({
        q: query,
        lang: language,
        max: Math.min(limit, 100),
        sortby: sortBy,
        apikey: this.API_KEY,
      });

      if (country && this.AFRICAN_COUNTRIES[country]) {
        params.append("country", this.AFRICAN_COUNTRIES[country]);
      }

      const response = await fetch(`${this.BASE_URL}/search?${params}`);

      if (!response.ok) {
        throw new Error(
          `GNews API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.articles) {
        return this.transformGNewsArticles(data.articles);
      }

      return [];
    } catch (error) {
      console.error("Error searching articles:", error);
      throw error;
    }
  }

  /**
   * Transform GNews articles to our format
   */
  static transformGNewsArticles(gnewsArticles) {
    return gnewsArticles.map((article) => ({
      id: this.generateArticleId(article.title, article.url),
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      thumbnail: article.image,
      source: article.source?.name || "Unknown",
      source_url: article.source?.url,
      published_at: article.publishedAt,
      category: this.categorizeArticle(article.title, article.description),
      country_focus: this.detectCountryFocus(
        article.title + " " + article.description
      ),
      language: "en", // GNews doesn't provide language per article
      is_trending: false,
      engagement_score: Math.random() * 10, // Mock engagement score
      credibility_score: 7.5, // Default credibility score
      reading_time_minutes: this.estimateReadingTime(
        article.content || article.description
      ),
      tags: this.extractTags(article.title + " " + article.description),
      african_context: this.detectAfricanContext(
        article.title + " " + article.description
      ),
      view_count: 0,
      likes: 0,
    }));
  }

  /**
   * Generate unique article ID
   */
  static generateArticleId(title, url) {
    const content = `${title}_${url}`;
    return btoa(content).slice(0, 16);
  }

  /**
   * Categorize article based on content
   */
  static categorizeArticle(title, description) {
    const content = (title + " " + description).toLowerCase();

    if (
      content.includes("politic") ||
      content.includes("government") ||
      content.includes("election")
    ) {
      return "politics";
    }
    if (
      content.includes("business") ||
      content.includes("economy") ||
      content.includes("market")
    ) {
      return "business";
    }
    if (
      content.includes("technology") ||
      content.includes("tech") ||
      content.includes("digital")
    ) {
      return "technology";
    }
    if (
      content.includes("sport") ||
      content.includes("football") ||
      content.includes("soccer")
    ) {
      return "sports";
    }
    if (
      content.includes("health") ||
      content.includes("medical") ||
      content.includes("hospital")
    ) {
      return "health";
    }
    if (
      content.includes("entertainment") ||
      content.includes("movie") ||
      content.includes("music")
    ) {
      return "entertainment";
    }

    return "general";
  }

  /**
   * Detect country focus from content
   */
  static detectCountryFocus(content) {
    const lowerContent = content.toLowerCase();
    const countries = [];

    for (const [country, code] of Object.entries(this.AFRICAN_COUNTRIES)) {
      if (lowerContent.includes(country.replace("-", " "))) {
        countries.push(country);
      }
    }

    return countries;
  }

  /**
   * Detect African context in content
   */
  static detectAfricanContext(content) {
    const africanKeywords = [
      "africa",
      "african",
      "continent",
      "sahara",
      "nile",
      "lagos",
      "nairobi",
      "johannesburg",
      "cairo",
      "casablanca",
      "addis ababa",
      "accra",
      "abuja",
    ];

    const lowerContent = content.toLowerCase();
    const foundKeywords = africanKeywords.filter((keyword) =>
      lowerContent.includes(keyword)
    );

    return foundKeywords.length > 0 ? foundKeywords.join(", ") : null;
  }

  /**
   * Extract tags from content
   */
  static extractTags(content) {
    // Simple tag extraction - can be enhanced with NLP
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter(
        (word) =>
          ![
            "this",
            "that",
            "with",
            "from",
            "they",
            "have",
            "been",
            "will",
            "said",
          ].includes(word)
      );

    // Get most frequent words as tags
    const wordCount = {};
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Estimate reading time
   */
  static estimateReadingTime(content) {
    if (!content) return 1;
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Save articles to database
   */
  static async saveArticlesToDatabase(articles) {
    try {
      for (const article of articles) {
        await DatabaseService.saveArticle(article);
      }
    } catch (error) {
      console.error("Error saving articles to database:", error);
      throw error;
    }
  }

  /**
   * Personalize articles for user
   */
  static async personalizeArticles(articles, userId) {
    try {
      const userPrefs = await DatabaseService.getUserPreferences(userId);
      if (!userPrefs) return articles;

      // Simple personalization based on preferences
      return articles.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Prefer user's favorite categories
        if (userPrefs.preferred_categories?.includes(a.category)) scoreA += 10;
        if (userPrefs.preferred_categories?.includes(b.category)) scoreB += 10;

        // Prefer user's favorite countries
        if (
          userPrefs.preferred_countries?.some((country) =>
            a.country_focus?.includes(country)
          )
        )
          scoreA += 5;
        if (
          userPrefs.preferred_countries?.some((country) =>
            b.country_focus?.includes(country)
          )
        )
          scoreB += 5;

        return scoreB - scoreA;
      });
    } catch (error) {
      console.error("Error personalizing articles:", error);
      return articles;
    }
  }

  /**
   * Get trending topics
   */
  static async getTrendingTopics() {
    try {
      // Try to get from database first
      const dbTopics = await DatabaseService.getTrendingTopics();
      if (dbTopics && dbTopics.length > 0) {
        return dbTopics;
      }

      // Fallback: generate from recent articles
      const articles = await this.getTopHeadlines({ limit: 50 });
      const topics = this.extractTrendingTopics(articles);

      // Save to database for future use
      try {
        await DatabaseService.saveTrendingTopics(topics);
      } catch (saveError) {
        console.warn("Failed to save trending topics:", saveError);
      }

      return topics;
    } catch (error) {
      console.error("Error getting trending topics:", error);
      return [];
    }
  }

  /**
   * Extract trending topics from articles
   */
  static extractTrendingTopics(articles) {
    const topicCount = {};

    articles.forEach((article) => {
      // Extract potential topics from title and description
      const content = `${article.title} ${article.description}`.toLowerCase();
      const words = content
        .split(/\s+/)
        .filter((word) => word.length > 3)
        .filter(
          (word) =>
            !/^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|two|way|who|boy|did|man|men|car|use|her|now|air|end|why|ask)$/i.test(
              word
            )
        );

      words.forEach((word) => {
        topicCount[word] = (topicCount[word] || 0) + 1;
      });
    });

    return Object.entries(topicCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({
        id: this.generateArticleId(topic, Date.now().toString()),
        name: topic.charAt(0).toUpperCase() + topic.slice(1),
        count,
        trend_score: count / articles.length,
        created_at: new Date().toISOString(),
      }));
  }

  /**
   * Get user's bookmarked articles
   */
  static async getUserBookmarks(userId) {
    try {
      return await DatabaseService.getUserBookmarks(userId);
    } catch (error) {
      console.error("Error getting user bookmarks:", error);
      return [];
    }
  }

  /**
   * Toggle bookmark for an article
   */
  static async toggleBookmark(userId, articleId) {
    try {
      return await DatabaseService.toggleBookmark(userId, articleId);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      throw error;
    }
  }

  /**
   * Get article summary using AI
   */
  static async getArticleSummary(articleId, type = "short") {
    try {
      // First check if summary already exists in database
      const existingSummary = await DatabaseService.getArticleSummary(
        articleId,
        type
      );
      if (existingSummary) {
        return existingSummary;
      }

      // Get article content
      const article = await DatabaseService.getArticleById(articleId);
      if (!article) {
        throw new Error("Article not found");
      }

      // Generate summary using AI
      const summary = await GeminiService.generateSummary(article, type);

      // Save summary to database
      await DatabaseService.saveArticleSummary(articleId, summary, type);

      return summary;
    } catch (error) {
      console.error("Error generating article summary:", error);
      throw error;
    }
  }
}

// Legacy support - also export as default
export default NewsService;
