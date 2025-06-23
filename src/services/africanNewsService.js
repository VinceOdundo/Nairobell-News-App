import { supabase } from "../lib/supabase";
import { EnhancedGeminiService } from "./enhancedGeminiService";
import { DatabaseService } from "./databaseService";
import { RSSAggregationService } from "./rssAggregationService";

// Major African languages with their codes
const AFRICAN_LANGUAGES = {
  sw: {
    name: "Swahili",
    countries: ["kenya", "tanzania", "uganda", "rwanda", "burundi", "drc"],
  },
  am: { name: "Amharic", countries: ["ethiopia"] },
  yo: { name: "Yoruba", countries: ["nigeria", "benin", "togo"] },
  ha: { name: "Hausa", countries: ["nigeria", "niger", "chad", "ghana"] },
  zu: { name: "Zulu", countries: ["south-africa", "zimbabwe"] },
  xh: { name: "Xhosa", countries: ["south-africa"] },
  af: { name: "Afrikaans", countries: ["south-africa", "namibia"] },
  ar: {
    name: "Arabic",
    countries: ["egypt", "sudan", "morocco", "algeria", "tunisia", "libya"],
  },
  fr: {
    name: "French",
    countries: [
      "senegal",
      "mali",
      "burkina-faso",
      "ivory-coast",
      "guinea",
      "cameroon",
      "chad",
      "gabon",
      "madagascar",
      "drc",
    ],
  },
  pt: {
    name: "Portuguese",
    countries: [
      "angola",
      "mozambique",
      "cape-verde",
      "guinea-bissau",
      "sao-tome",
    ],
  },
  ig: { name: "Igbo", countries: ["nigeria"] },
  om: { name: "Oromo", countries: ["ethiopia"] },
  ti: { name: "Tigrinya", countries: ["ethiopia", "eritrea"] },
};

// Enhanced African news sources with credibility ratings
const ENHANCED_AFRICAN_SOURCES = [
  // International with African focus
  {
    id: "bbc-africa",
    name: "BBC Africa",
    url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml",
    country: "international",
    language: "en",
    credibility_score: 9.0,
    bias_rating: "center-left",
    audience_reach: "high",
    data_efficiency: "medium",
  },
  {
    id: "aljazeera-africa",
    name: "Al Jazeera Africa",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    country: "international",
    language: "en",
    credibility_score: 8.5,
    bias_rating: "center-left",
    audience_reach: "high",
    data_efficiency: "medium",
  },
  {
    id: "cnn-africa",
    name: "CNN Africa",
    url: "http://rss.cnn.com/rss/edition_africa.rss",
    country: "international",
    language: "en",
    credibility_score: 8.0,
    bias_rating: "center-left",
    audience_reach: "high",
    data_efficiency: "low",
  },

  // East Africa
  {
    id: "daily-nation-kenya",
    name: "Daily Nation Kenya",
    url: "https://nation.africa/kenya/news/rss",
    country: "kenya",
    language: "en",
    credibility_score: 8.0,
    bias_rating: "center",
    audience_reach: "high",
    data_efficiency: "high",
  },
  {
    id: "the-citizen-tanzania",
    name: "The Citizen Tanzania",
    url: "https://www.thecitizen.co.tz/tanzania/news/rss",
    country: "tanzania",
    language: "en",
    credibility_score: 7.5,
    bias_rating: "center",
    audience_reach: "medium",
    data_efficiency: "high",
  },
  {
    id: "new-vision-uganda",
    name: "New Vision Uganda",
    url: "https://www.newvision.co.ug/rss/news.xml",
    country: "uganda",
    language: "en",
    credibility_score: 7.0,
    bias_rating: "center-right",
    audience_reach: "medium",
    data_efficiency: "high",
  },
  {
    id: "ethiopia-reporter",
    name: "The Ethiopian Reporter",
    url: "https://www.ethiopianreporter.com/feed/",
    country: "ethiopia",
    language: "en",
    credibility_score: 7.5,
    bias_rating: "center",
    audience_reach: "medium",
    data_efficiency: "high",
  },

  // West Africa
  {
    id: "punch-nigeria",
    name: "The Punch Nigeria",
    url: "https://punchng.com/feed/",
    country: "nigeria",
    language: "en",
    credibility_score: 7.5,
    bias_rating: "center",
    audience_reach: "high",
    data_efficiency: "medium",
  },
  {
    id: "premium-times-nigeria",
    name: "Premium Times Nigeria",
    url: "https://www.premiumtimesng.com/feed",
    country: "nigeria",
    language: "en",
    credibility_score: 8.5,
    bias_rating: "center-left",
    audience_reach: "high",
    data_efficiency: "high",
  },
  {
    id: "ghana-web",
    name: "GhanaWeb",
    url: "https://www.ghanaweb.com/GhanaHomePage/rss/news.xml",
    country: "ghana",
    language: "en",
    credibility_score: 7.0,
    bias_rating: "center",
    audience_reach: "high",
    data_efficiency: "medium",
  },
  {
    id: "joy-online-ghana",
    name: "Joy Online Ghana",
    url: "https://www.myjoyonline.com/feed/",
    country: "ghana",
    language: "en",
    credibility_score: 7.5,
    bias_rating: "center",
    audience_reach: "medium",
    data_efficiency: "high",
  },

  // Southern Africa
  {
    id: "news24-south-africa",
    name: "News24 South Africa",
    url: "https://feeds.news24.com/articles/news24/TopStories/rss",
    country: "south-africa",
    language: "en",
    credibility_score: 8.0,
    bias_rating: "center",
    audience_reach: "high",
    data_efficiency: "medium",
  },
  {
    id: "daily-maverick-sa",
    name: "Daily Maverick",
    url: "https://www.dailymaverick.co.za/dmrss/",
    country: "south-africa",
    language: "en",
    credibility_score: 8.5,
    bias_rating: "center-left",
    audience_reach: "medium",
    data_efficiency: "high",
  },
  {
    id: "herald-zimbabwe",
    name: "The Herald Zimbabwe",
    url: "https://www.herald.co.zw/feed/",
    country: "zimbabwe",
    language: "en",
    credibility_score: 6.5,
    bias_rating: "right",
    audience_reach: "medium",
    data_efficiency: "high",
  },

  // North Africa
  {
    id: "ahram-online-egypt",
    name: "Al-Ahram Online",
    url: "http://english.ahram.org.eg/UI/Front/rss.aspx",
    country: "egypt",
    language: "en",
    credibility_score: 7.0,
    bias_rating: "center-right",
    audience_reach: "high",
    data_efficiency: "medium",
  },
  {
    id: "morocco-world-news",
    name: "Morocco World News",
    url: "https://www.moroccoworldnews.com/feed/",
    country: "morocco",
    language: "en",
    credibility_score: 7.5,
    bias_rating: "center",
    audience_reach: "medium",
    data_efficiency: "high",
  },
];

export class AfricanNewsService {
  // Main aggregation with African context
  static async getAfricanNewsFeed(options = {}) {
    const {
      userId = null,
      country = null,
      language = "en",
      category = null,
      limit = 20,
      offset = 0,
      includeTranslation = false,
      dataEfficient = false,
    } = options;

    try {
      // Get user preferences if userId provided
      let userPrefs = null;
      if (userId) {
        userPrefs = await DatabaseService.getUserPreferences(userId);
      }

      // Build query with African context
      let query = supabase.from("posts").select(`
          id,
          title,
          description,
          url,
          thumbnail,
          source,
          category,
          country_focus,
          language,
          published_at,
          is_trending,
          engagement_score,
          credibility_score,
          african_context,
          bias_rating,
          tags,
          ${dataEfficient ? "" : "content,"}
          reading_time_minutes
        `);

      // Apply filters with African context
      if (country) {
        query = query.contains("country_focus", [country]);
      }

      if (category) {
        query = query.eq("category", category);
      }

      // Prioritize African sources and context
      query = query
        .gte("credibility_score", 6.0) // Minimum credibility threshold
        .order("african_relevance_score", { ascending: false })
        .order("published_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: articles, error } = await query;

      if (error) throw error;

      // Enhance articles with African context
      const enhancedArticles = await Promise.all(
        articles.map(async (article) => {
          try {
            // Add bias indicators
            const biasInfo = this.getBiasIndicator(article.bias_rating);

            // Add African context if missing
            let africanContext = article.african_context;
            if (!africanContext) {
              africanContext =
                await EnhancedGeminiService.analyzeAfricanContext(article);
            }

            // Add translation if requested and not in user's language
            let translatedContent = null;
            if (
              includeTranslation &&
              language !== "en" &&
              AFRICAN_LANGUAGES[language]
            ) {
              translatedContent = await this.translateToAfricanLanguage(
                article,
                language
              );
            }

            return {
              ...article,
              bias_info: biasInfo,
              african_context: africanContext,
              translated_content: translatedContent,
              is_local: this.isLocalContent(article, country),
              data_efficient_thumbnail: dataEfficient
                ? this.getDataEfficientThumbnail(article.thumbnail)
                : article.thumbnail,
            };
          } catch (enhanceError) {
            console.warn("Error enhancing article:", enhanceError);
            return article;
          }
        })
      );

      // Apply AI personalization if user preferences available
      let personalizedArticles = enhancedArticles;
      if (userPrefs) {
        personalizedArticles = await this.personalizeAfricanFeed(
          enhancedArticles,
          userPrefs
        );
      }

      return {
        articles: personalizedArticles,
        total: articles.length,
        hasMore: articles.length === limit,
        african_context_score:
          this.calculateAfricanContextScore(personalizedArticles),
      };
    } catch (error) {
      await DatabaseService.logError(error, {
        function: "getAfricanNewsFeed",
        options,
      });
      throw error;
    }
  }

  // Translate content to African languages
  static async translateToAfricanLanguage(article, targetLanguage) {
    try {
      if (!AFRICAN_LANGUAGES[targetLanguage]) {
        throw new Error(`Unsupported African language: ${targetLanguage}`);
      }

      const langInfo = AFRICAN_LANGUAGES[targetLanguage];

      const translationPrompt = `
      Translate this news article to ${langInfo.name} (${targetLanguage}):
      
      Title: ${article.title}
      Description: ${article.description}
      
      Guidelines:
      - Maintain journalistic tone and accuracy
      - Use appropriate cultural context for ${langInfo.countries.join(", ")}
      - Keep technical terms in original language if no local equivalent exists
      - Respect local dialects and expressions
      
      Return JSON with:
      {
        "translated_title": "title in ${langInfo.name}",
        "translated_description": "description in ${langInfo.name}",
        "cultural_notes": "any cultural adaptations made"
      }
      `;

      const translation = await EnhancedGeminiService.generateTranslation(
        translationPrompt
      );

      // Cache translation for future use
      await supabase.from("article_translations").upsert([
        {
          article_id: article.id,
          language_code: targetLanguage,
          translated_title: translation.translated_title,
          translated_description: translation.translated_description,
          cultural_notes: translation.cultural_notes,
        },
      ]);

      return translation;
    } catch (error) {
      console.error("Translation error:", error);
      return null;
    }
  }

  // Get trending African topics
  static async getTrendingAfricanTopics() {
    try {
      const { data: trendingData, error } = await supabase
        .from("trending_topics_african")
        .select("*")
        .order("trend_score", { ascending: false })
        .limit(10);

      if (error) throw error;

      // If no cached data, generate from recent articles
      if (!trendingData || trendingData.length === 0) {
        return await this.generateTrendingTopics();
      }

      return trendingData.map((topic) => ({
        ...topic,
        african_context: true,
        related_countries: topic.affected_countries || [],
        cultural_significance: topic.cultural_significance || "medium",
      }));
    } catch (error) {
      console.error("Error getting trending African topics:", error);
      return [];
    }
  }

  // Generate personalized African feed
  static async personalizeAfricanFeed(articles, userPrefs) {
    try {
      const personalizationPrompt = `
      Based on these user preferences, reorder the articles for maximum relevance:
      
      User Preferences:
      - Preferred countries: ${
        userPrefs.preferred_countries?.join(", ") || "all African countries"
      }
      - Preferred categories: ${
        userPrefs.preferred_categories?.join(", ") || "general news"
      }
      - Preferred languages: ${
        userPrefs.preferred_languages?.join(", ") || "English"
      }
      - Reading level: ${userPrefs.reading_level || "intermediate"}
      - Data-conscious: ${userPrefs.data_conscious || false}
      
      Articles to rank:
      ${articles
        .slice(0, 10)
        .map(
          (a) =>
            `ID: ${a.id}, Title: ${a.title}, Countries: ${a.country_focus?.join(
              ","
            )}, Category: ${a.category}`
        )
        .join("\n")}
      
      Return an array of article IDs in order of relevance for this African user.
      `;

      const personalizedOrder = await EnhancedGeminiService.personalizeContent(
        personalizationPrompt
      );

      if (personalizedOrder && Array.isArray(personalizedOrder)) {
        const reorderedArticles = personalizedOrder
          .map((id) => articles.find((article) => article.id === id))
          .filter(Boolean);

        // Add remaining articles that weren't ranked
        const remainingArticles = articles.filter(
          (article) => !personalizedOrder.includes(article.id)
        );

        return [...reorderedArticles, ...remainingArticles];
      }

      return articles;
    } catch (error) {
      console.warn("Personalization failed, using default order:", error);
      return articles;
    }
  }

  // Bias indicator for African context
  static getBiasIndicator(biasRating) {
    const indicators = {
      left: {
        color: "#3B82F6",
        label: "Left-leaning",
        description: "Generally progressive viewpoint",
      },
      "center-left": {
        color: "#06B6D4",
        label: "Center-left",
        description: "Moderately progressive",
      },
      center: {
        color: "#10B981",
        label: "Center",
        description: "Balanced reporting",
      },
      "center-right": {
        color: "#F59E0B",
        label: "Center-right",
        description: "Moderately conservative",
      },
      right: {
        color: "#EF4444",
        label: "Right-leaning",
        description: "Generally conservative viewpoint",
      },
    };

    return indicators[biasRating] || indicators["center"];
  }

  // Check if content is local to user
  static isLocalContent(article, userCountry) {
    if (!userCountry || !article.country_focus) return false;
    return article.country_focus.includes(userCountry);
  }

  // Get data-efficient thumbnail
  static getDataEfficientThumbnail(originalUrl) {
    if (!originalUrl) return null;

    // Return a compressed version or placeholder
    if (originalUrl.includes("pexels.com")) {
      return originalUrl.replace(
        "auto=compress&cs=tinysrgb&w=800",
        "auto=compress&cs=tinysrgb&w=300"
      );
    }

    return originalUrl;
  }

  // Calculate African context relevance score
  static calculateAfricanContextScore(articles) {
    if (!articles.length) return 0;

    const scores = articles.map((article) => {
      let score = 0;

      // Local content gets higher score
      if (article.is_local) score += 3;

      // African sources get bonus
      if (article.source && this.isAfricanSource(article.source)) score += 2;

      // Recent content gets bonus
      const hoursOld =
        (Date.now() - new Date(article.published_at)) / (1000 * 60 * 60);
      if (hoursOld < 24) score += 2;
      else if (hoursOld < 168) score += 1;

      // High credibility gets bonus
      if (article.credibility_score >= 8) score += 2;
      else if (article.credibility_score >= 7) score += 1;

      return Math.min(score, 10); // Cap at 10
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  // Check if source is African
  static isAfricanSource(sourceName) {
    const africanSources = ENHANCED_AFRICAN_SOURCES.map((s) =>
      s.name.toLowerCase()
    );
    return africanSources.includes(sourceName.toLowerCase());
  }

  // Generate trending topics from recent articles
  static async generateTrendingTopics() {
    try {
      const { data: recentArticles } = await supabase
        .from("posts")
        .select("title, description, category, country_focus, engagement_score")
        .gte(
          "published_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        )
        .order("engagement_score", { ascending: false })
        .limit(50);

      if (!recentArticles?.length) return [];

      const topicsPrompt = `
      Analyze these recent African news articles and identify the top trending topics:
      
      Articles:
      ${recentArticles
        .map(
          (a) => `${a.title} - ${a.description} [${a.country_focus?.join(",")}]`
        )
        .join("\n")}
      
      Return JSON array of top 5 trending topics:
      [{
        "topic": "topic name",
        "description": "brief description",
        "trend_score": 0-10,
        "affected_countries": ["country1", "country2"],
        "category": "politics|business|technology|etc",
        "cultural_significance": "low|medium|high"
      }]
      `;

      return await EnhancedGeminiService.generateTrendingTopics(topicsPrompt);
    } catch (error) {
      console.error("Error generating trending topics:", error);
      return [];
    }
  }

  // Get African language preferences for user
  static async getLanguagePreferences(userId) {
    try {
      const { data: prefs } = await supabase
        .from("user_language_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      return (
        prefs || {
          primary_language: "en",
          secondary_languages: [],
          translation_enabled: true,
          dialect_preference: null,
        }
      );
    } catch (error) {
      console.error("Error getting language preferences:", error);
      return {
        primary_language: "en",
        secondary_languages: [],
        translation_enabled: false,
      };
    }
  }

  // Update user reading behavior for African content
  static async updateAfricanReadingBehavior(userId, articleId, behavior) {
    try {
      const behaviorData = {
        user_id: userId,
        article_id: articleId,
        interaction_type: behavior.type, // 'read', 'share', 'translate', 'bookmark'
        reading_duration: behavior.duration || null,
        language_used: behavior.language || "en",
        data_mode: behavior.dataMode || "normal", // 'efficient' for data-conscious users
        device_type: behavior.deviceType || "mobile",
        african_context_engaged: behavior.engagedWithAfricanContext || false,
      };

      await supabase.from("african_reading_behavior").insert([behaviorData]);

      // Update user's African news preferences
      await this.updateAfricanNewsPreferences(userId, behaviorData);
    } catch (error) {
      console.error("Error updating African reading behavior:", error);
    }
  }

  // Update user preferences based on reading behavior
  static async updateAfricanNewsPreferences(userId, behaviorData) {
    try {
      const { data: currentPrefs } = await supabase
        .from("user_preferences")
        .select("african_news_preferences")
        .eq("id", userId)
        .single();

      const africanPrefs = currentPrefs?.african_news_preferences || {};

      // Update based on behavior
      if (behaviorData.language_used !== "en") {
        africanPrefs.prefers_local_language = true;
        africanPrefs.preferred_languages =
          africanPrefs.preferred_languages || [];
        if (
          !africanPrefs.preferred_languages.includes(behaviorData.language_used)
        ) {
          africanPrefs.preferred_languages.push(behaviorData.language_used);
        }
      }

      if (behaviorData.data_mode === "efficient") {
        africanPrefs.data_conscious = true;
      }

      if (behaviorData.african_context_engaged) {
        africanPrefs.prefers_african_context = true;
      }

      await supabase
        .from("user_preferences")
        .update({ african_news_preferences: africanPrefs })
        .eq("id", userId);
    } catch (error) {
      console.error("Error updating African news preferences:", error);
    }
  }
}
