import { GeminiService } from '../lib/gemini';
import { supabase } from '../lib/supabase';

export class PersonalizationService {
  static async generatePersonalizedFeed(userId, options = {}) {
    try {
      const {
        limit = 20,
        categories = [],
        countries = [],
        includeAI = true,
        diversityLevel = 'medium',
        timeframe = '24h'
      } = options;

      // Get user preferences and reading history
      const userProfile = await this.getUserProfile(userId);
      const readingHistory = await this.getReadingHistory(userId, timeframe);
      const preferences = await this.getUserPreferences(userId);

      // Get base articles
      let articles = await this.getBaseArticles({
        limit: limit * 2, // Get more to filter from
        categories: categories.length ? categories : userProfile.preferredCategories,
        countries: countries.length ? countries : userProfile.preferredCountries
      });

      // Apply AI personalization
      if (includeAI) {
        articles = await this.applyAIPersonalization(articles, userProfile, readingHistory);
      }

      // Apply diversity filters
      articles = this.applyDiversityFilter(articles, diversityLevel);

      // Score and rank articles
      articles = await this.scoreArticles(articles, userProfile, preferences);

      // Apply final filters and limit
      return {
        articles: articles.slice(0, limit),
        metadata: {
          totalProcessed: articles.length,
          personalizationApplied: includeAI,
          diversityLevel,
          userProfile: {
            readingStreak: userProfile.readingStreak,
            topCategories: userProfile.preferredCategories,
            engagementScore: userProfile.engagementScore
          }
        }
      };

    } catch (error) {
      console.error('Personalized feed generation error:', error);
      throw new Error('Failed to generate personalized feed');
    }
  }

  static async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Calculate derived metrics
      const readingHistory = await this.getReadingHistory(userId, '30d');
      const preferences = await this.getUserPreferences(userId);

      return {
        ...data,
        preferredCategories: this.extractTopCategories(readingHistory),
        preferredCountries: this.extractTopCountries(readingHistory),
        readingStreak: await this.calculateReadingStreak(userId),
        engagementScore: this.calculateEngagementScore(readingHistory),
        readingVelocity: this.calculateReadingVelocity(readingHistory),
        diversityIndex: this.calculateDiversityIndex(readingHistory),
        timePreferences: this.analyzeTimePreferences(readingHistory),
        contentComplexity: preferences.preferred_complexity || 'medium'
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return this.getDefaultProfile();
    }
  }

  static async getReadingHistory(userId, timeframe) {
    try {
      const timeframeDays = this.parseTimeframe(timeframe);
      const { data, error } = await supabase
        .from('reading_history')
        .select(`
          *,
          articles:article_id (
            id,
            title,
            category,
            country_focus,
            published_at,
            reading_time,
            engagement_score,
            tags
          )
        `)
        .eq('user_id', userId)
        .gte('read_at', this.getTimeframeBoundary(timeframeDays))
        .order('read_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting reading history:', error);
      return [];
    }
  }

  static async getUserPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || this.getDefaultPreferences();
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  static async applyAIPersonalization(articles, userProfile, readingHistory) {
    try {
      // Create personalization prompt
      const prompt = this.createPersonalizationPrompt(userProfile, readingHistory, articles);
      
      // Get AI recommendations
      const aiResponse = await GeminiService.generateContent(prompt);
      const recommendations = JSON.parse(aiResponse);

      // Apply AI scoring and filtering
      return articles.map(article => ({
        ...article,
        personalityScore: this.calculatePersonalityScore(article, recommendations),
        aiReasons: recommendations.articleReasons?.[article.id] || [],
        aiTags: recommendations.personalizedTags?.[article.id] || []
      }));

    } catch (error) {
      console.error('AI personalization error:', error);
      // Fallback to rule-based personalization
      return this.applyRuleBasedPersonalization(articles, userProfile, readingHistory);
    }
  }

  static createPersonalizationPrompt(userProfile, readingHistory, articles) {
    const recentCategories = this.extractTopCategories(readingHistory, 10);
    const readingPatterns = this.analyzeReadingPatterns(readingHistory);

    return `
Analyze this user's reading behavior and personalize article recommendations for an African news app.

USER PROFILE:
- Reading Streak: ${userProfile.readingStreak} days
- Engagement Score: ${userProfile.engagementScore}/10
- Preferred Complexity: ${userProfile.contentComplexity}
- Time Preferences: ${JSON.stringify(userProfile.timePreferences)}
- Recent Categories: ${recentCategories.join(', ')}
- Countries of Interest: ${userProfile.preferredCountries?.join(', ') || 'Various'}

READING PATTERNS:
${JSON.stringify(readingPatterns, null, 2)}

ARTICLES TO PERSONALIZE:
${articles.slice(0, 10).map(a => `ID: ${a.id}, Title: ${a.title}, Category: ${a.category}, Countries: ${a.country_focus?.join(',')}`).join('\n')}

Provide personalization recommendations in this JSON format:
{
  "articleScores": {
    "article_id": {
      "relevanceScore": 0-10,
      "reasoningScore": 0-10,
      "timelinessScore": 0-10,
      "diversityBonus": 0-2
    }
  },
  "articleReasons": {
    "article_id": ["reason1", "reason2"]
  },
  "personalizedTags": {
    "article_id": ["tag1", "tag2"]
  },
  "recommendedOrder": ["article_id1", "article_id2", ...],
  "insights": "Brief explanation of personalization strategy"
}

Consider African context, cultural relevance, and the user's engagement patterns.
`;
  }

  static applyRuleBasedPersonalization(articles, userProfile, readingHistory) {
    const categoryWeights = this.calculateCategoryWeights(readingHistory);
    const countryWeights = this.calculateCountryWeights(readingHistory);
    const timeFactors = this.calculateTimeFactors(userProfile.timePreferences);

    return articles.map(article => {
      const categoryScore = categoryWeights[article.category] || 0.5;
      const countryScore = article.country_focus?.reduce((sum, country) => 
        sum + (countryWeights[country] || 0.3), 0) || 0.3;
      const timeScore = this.calculateTimeRelevance(article.published_at, timeFactors);
      const diversityBonus = this.calculateDiversityBonus(article, readingHistory);

      return {
        ...article,
        personalityScore: (categoryScore * 0.4 + countryScore * 0.3 + timeScore * 0.2 + diversityBonus * 0.1) * 10,
        aiReasons: this.generateRuleBasedReasons(article, userProfile),
        aiTags: this.generatePersonalizedTags(article, userProfile)
      };
    });
  }

  static applyDiversityFilter(articles, diversityLevel) {
    const diversitySettings = {
      low: { categoryLimit: 2, sourceLimit: 1, timeSpread: 0.5 },
      medium: { categoryLimit: 4, sourceLimit: 3, timeSpread: 0.7 },
      high: { categoryLimit: 6, sourceLimit: 5, timeSpread: 0.9 }
    };

    const settings = diversitySettings[diversityLevel] || diversitySettings.medium;
    
    // Group articles by category and source
    const categoryGroups = this.groupBy(articles, 'category');
    const sourceGroups = this.groupBy(articles, 'source');

    // Apply diversity limits
    const diversified = [];
    const categoryCounts = {};
    const sourceCounts = {};

    for (const article of articles) {
      const categoryCount = categoryCounts[article.category] || 0;
      const sourceCount = sourceCounts[article.source] || 0;

      if (categoryCount < settings.categoryLimit && sourceCount < settings.sourceLimit) {
        diversified.push(article);
        categoryCounts[article.category] = categoryCount + 1;
        sourceCounts[article.source] = sourceCount + 1;
      }
    }

    return diversified;
  }

  static async scoreArticles(articles, userProfile, preferences) {
    return articles
      .map(article => ({
        ...article,
        finalScore: this.calculateFinalScore(article, userProfile, preferences)
      }))
      .sort((a, b) => b.finalScore - a.finalScore);
  }

  static calculateFinalScore(article, userProfile, preferences) {
    const personalityWeight = 0.4;
    const engagementWeight = 0.2;
    const freshnessWeight = 0.2;
    const qualityWeight = 0.2;

    const personalityScore = article.personalityScore || 5;
    const engagementScore = article.engagement_score || 5;
    const freshnessScore = this.calculateFreshnessScore(article.published_at);
    const qualityScore = article.credibility_score || 7;

    return (
      personalityScore * personalityWeight +
      engagementScore * engagementWeight +
      freshnessScore * freshnessWeight +
      qualityScore * qualityWeight
    );
  }

  static calculateFreshnessScore(publishedAt) {
    const hoursAgo = (Date.now() - new Date(publishedAt)) / (1000 * 60 * 60);
    
    if (hoursAgo < 1) return 10;
    if (hoursAgo < 6) return 8;
    if (hoursAgo < 24) return 6;
    if (hoursAgo < 72) return 4;
    return 2;
  }

  static extractTopCategories(readingHistory, limit = 5) {
    const categoryCounts = {};
    readingHistory.forEach(item => {
      const category = item.articles?.category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([category]) => category);
  }

  static extractTopCountries(readingHistory, limit = 5) {
    const countryCounts = {};
    readingHistory.forEach(item => {
      const countries = item.articles?.country_focus || [];
      countries.forEach(country => {
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });
    });

    return Object.entries(countryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([country]) => country);
  }

  static async calculateReadingStreak(userId) {
    try {
      const { data, error } = await supabase
        .from('reading_history')
        .select('read_at')
        .eq('user_id', userId)
        .order('read_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const record of data || []) {
        const readDate = new Date(record.read_at);
        readDate.setHours(0, 0, 0, 0);

        if (readDate.getTime() === currentDate.getTime()) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (readDate.getTime() < currentDate.getTime()) {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating reading streak:', error);
      return 0;
    }
  }

  static calculateEngagementScore(readingHistory) {
    if (!readingHistory.length) return 5;

    const metrics = {
      completionRate: readingHistory.filter(h => h.completed).length / readingHistory.length,
      averageTimeSpent: readingHistory.reduce((sum, h) => sum + (h.time_spent || 0), 0) / readingHistory.length,
      interactionRate: readingHistory.filter(h => h.liked || h.shared || h.commented).length / readingHistory.length
    };

    return Math.min(10, (
      metrics.completionRate * 4 +
      Math.min(metrics.averageTimeSpent / 60, 5) +
      metrics.interactionRate * 3
    ));
  }

  static calculateReadingVelocity(readingHistory) {
    const last7Days = readingHistory.filter(h => 
      (Date.now() - new Date(h.read_at)) < 7 * 24 * 60 * 60 * 1000
    );

    return last7Days.length / 7; // Articles per day
  }

  static calculateDiversityIndex(readingHistory) {
    const categories = new Set(readingHistory.map(h => h.articles?.category).filter(Boolean));
    const sources = new Set(readingHistory.map(h => h.articles?.source).filter(Boolean));
    
    return Math.min(10, (categories.size * 1.5 + sources.size) / 2);
  }

  static analyzeTimePreferences(readingHistory) {
    const hourCounts = {};
    readingHistory.forEach(item => {
      const hour = new Date(item.read_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return {
      peakHours: sortedHours.map(([hour]) => parseInt(hour)),
      distribution: hourCounts,
      preferredPeriod: this.identifyPreferredPeriod(hourCounts)
    };
  }

  static identifyPreferredPeriod(hourCounts) {
    const morning = Object.entries(hourCounts)
      .filter(([hour]) => hour >= 6 && hour < 12)
      .reduce((sum, [,count]) => sum + count, 0);
    
    const afternoon = Object.entries(hourCounts)
      .filter(([hour]) => hour >= 12 && hour < 18)
      .reduce((sum, [,count]) => sum + count, 0);
    
    const evening = Object.entries(hourCounts)
      .filter(([hour]) => hour >= 18)
      .reduce((sum, [,count]) => sum + count, 0);

    if (morning >= afternoon && morning >= evening) return 'morning';
    if (afternoon >= evening) return 'afternoon';
    return 'evening';
  }

  // Utility methods
  static parseTimeframe(timeframe) {
    const mapping = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };
    return mapping[timeframe] || 1;
  }

  static getTimeframeBoundary(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }

  static getDefaultProfile() {
    return {
      preferredCategories: ['general', 'politics', 'business'],
      preferredCountries: ['kenya', 'nigeria', 'south-africa'],
      readingStreak: 0,
      engagementScore: 5,
      readingVelocity: 2,
      diversityIndex: 5,
      timePreferences: { peakHours: [9, 12, 18], preferredPeriod: 'morning' },
      contentComplexity: 'medium'
    };
  }

  static getDefaultPreferences() {
    return {
      preferred_complexity: 'medium',
      auto_translate: false,
      enable_audio: true,
      notification_frequency: 'daily',
      content_filters: []
    };
  }

  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  static calculateCategoryWeights(readingHistory) {
    const total = readingHistory.length || 1;
    const categoryCounts = {};
    
    readingHistory.forEach(item => {
      const category = item.articles?.category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    const weights = {};
    Object.entries(categoryCounts).forEach(([category, count]) => {
      weights[category] = count / total;
    });

    return weights;
  }

  static calculateCountryWeights(readingHistory) {
    const total = readingHistory.length || 1;
    const countryCounts = {};
    
    readingHistory.forEach(item => {
      const countries = item.articles?.country_focus || [];
      countries.forEach(country => {
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });
    });

    const weights = {};
    Object.entries(countryCounts).forEach(([country, count]) => {
      weights[country] = count / total;
    });

    return weights;
  }

  static calculateTimeFactors(timePreferences) {
    const currentHour = new Date().getHours();
    const peakHours = timePreferences.peakHours || [9, 12, 18];
    
    const distanceFromPeak = Math.min(...peakHours.map(peak => 
      Math.abs(currentHour - peak)
    ));

    return Math.max(0.3, 1 - (distanceFromPeak / 12));
  }

  static calculateTimeRelevance(publishedAt, timeFactor) {
    const hoursAgo = (Date.now() - new Date(publishedAt)) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0.1, 1 - (hoursAgo / 72)); // Decay over 3 days
    return freshnessScore * timeFactor;
  }

  static calculateDiversityBonus(article, readingHistory) {
    const recentCategories = readingHistory
      .slice(0, 10)
      .map(h => h.articles?.category)
      .filter(Boolean);

    const categoryAppearances = recentCategories.filter(cat => cat === article.category).length;
    return Math.max(0, (3 - categoryAppearances) / 3); // Bonus for categories not recently read
  }

  static generateRuleBasedReasons(article, userProfile) {
    const reasons = [];
    
    if (userProfile.preferredCategories?.includes(article.category)) {
      reasons.push(`You frequently read ${article.category} news`);
    }
    
    if (userProfile.preferredCountries?.some(country => 
      article.country_focus?.includes(country))) {
      reasons.push('Covers countries you follow');
    }
    
    if (article.is_trending) {
      reasons.push('Trending story');
    }
    
    if (article.engagement_score > 7) {
      reasons.push('Highly engaging content');
    }

    return reasons;
  }

  static generatePersonalizedTags(article, userProfile) {
    const tags = [];
    
    if (userProfile.engagementScore > 8) {
      tags.push('recommended-for-you');
    }
    
    if (userProfile.contentComplexity === 'high' && article.reading_time > 5) {
      tags.push('in-depth');
    }
    
    if (userProfile.contentComplexity === 'low' && article.reading_time <= 3) {
      tags.push('quick-read');
    }

    return tags;
  }

  static calculatePersonalityScore(article, recommendations) {
    const scores = recommendations.articleScores?.[article.id];
    if (!scores) return 5;

    return (
      (scores.relevanceScore || 5) * 0.4 +
      (scores.reasoningScore || 5) * 0.3 +
      (scores.timelinessScore || 5) * 0.2 +
      (scores.diversityBonus || 0) * 0.1
    );
  }

  // Advanced personalization features
  static async generateSmartNotifications(userId) {
    try {
      const userProfile = await this.getUserProfile(userId);
      const preferences = await this.getUserPreferences(userId);
      
      if (preferences.notification_frequency === 'none') return [];

      const personalizedFeed = await this.generatePersonalizedFeed(userId, {
        limit: 5,
        includeAI: true
      });

      const notifications = personalizedFeed.articles
        .filter(article => article.finalScore > 7.5)
        .slice(0, 3)
        .map(article => ({
          title: `📰 ${article.title}`,
          body: article.description,
          data: {
            articleId: article.id,
            category: article.category,
            personalityScore: article.personalityScore
          },
          schedule: this.calculateOptimalTime(userProfile.timePreferences)
        }));

      return notifications;
    } catch (error) {
      console.error('Smart notifications error:', error);
      return [];
    }
  }

  static calculateOptimalTime(timePreferences) {
    const now = new Date();
    const peakHours = timePreferences.peakHours || [9, 12, 18];
    
    // Find next peak hour
    const currentHour = now.getHours();
    const nextPeakHour = peakHours.find(hour => hour > currentHour) || peakHours[0];
    
    const scheduledTime = new Date(now);
    if (nextPeakHour > currentHour) {
      scheduledTime.setHours(nextPeakHour, 0, 0, 0);
    } else {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
      scheduledTime.setHours(nextPeakHour, 0, 0, 0);
    }
    
    return scheduledTime;
  }

  static async updateUserPreferences(userId, newPreferences) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...newPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
}
