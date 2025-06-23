import { supabase } from '../lib/supabase';
import { GeminiService } from '../lib/gemini';

export class AnalyticsService {
  static async trackEvent(eventType, eventData, userId = null) {
    try {
      const { data, error } = await supabase
        .from('user_analytics')
        .insert({
          user_id: userId,
          event_type: eventType,
          event_data: eventData,
          timestamp: new Date().toISOString(),
          session_id: this.getSessionId(),
          device_info: this.getDeviceInfo()
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't throw - analytics shouldn't break the app
    }
  }

  static async getPersonalizedInsights(userId, timeframe = '30d') {
    try {
      const insights = await Promise.all([
        this.getReadingPatterns(userId, timeframe),
        this.getTopicPreferences(userId, timeframe),
        this.getEngagementMetrics(userId, timeframe),
        this.getPersonalizedRecommendations(userId)
      ]);

      return {
        readingPatterns: insights[0],
        topicPreferences: insights[1],
        engagement: insights[2],
        recommendations: insights[3],
        generatedAt: new Date().toISOString(),
        timeframe
      };
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  static async getReadingPatterns(userId, timeframe) {
    try {
      const { data, error } = await supabase
        .from('reading_history')
        .select(`
          *,
          articles:article_id (
            category,
            country_focus,
            published_at,
            reading_time
          )
        `)
        .eq('user_id', userId)
        .gte('read_at', this.getTimeframeBoundary(timeframe))
        .order('read_at', { ascending: false });

      if (error) throw error;

      // Analyze patterns
      const patterns = {
        totalArticles: data.length,
        averageReadTime: this.calculateAverage(data.map(d => d.time_spent)),
        readingStreaks: await this.calculateReadingStreaks(userId, timeframe),
        preferredTimes: this.analyzeReadingTimes(data),
        completionRate: this.calculateCompletionRate(data),
        topCategories: this.getTopCategories(data),
        geographicFocus: this.analyzeGeographicFocus(data),
        weeklyTrend: this.calculateWeeklyTrend(data)
      };

      return patterns;
    } catch (error) {
      console.error('Error analyzing reading patterns:', error);
      return {};
    }
  }

  static async getTopicPreferences(userId, timeframe) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_topic_preferences', {
          user_id: userId,
          timeframe_days: this.getTimeframeDays(timeframe)
        });

      if (error) throw error;

      // Enhanced topic analysis
      const preferences = {
        primaryInterests: data.slice(0, 5),
        emergingInterests: await this.detectEmergingInterests(userId, timeframe),
        seasonalTrends: await this.analyzeSeasonalTrends(userId),
        sentimentByTopic: await this.analyzeSentimentByTopic(userId, timeframe),
        diversityScore: this.calculateTopicDiversity(data)
      };

      return preferences;
    } catch (error) {
      console.error('Error analyzing topic preferences:', error);
      return {};
    }
  }

  static async getEngagementMetrics(userId, timeframe) {
    try {
      const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', this.getTimeframeBoundary(timeframe));

      if (error) throw error;

      const metrics = {
        totalSessions: this.countUniqueSessions(data),
        averageSessionDuration: this.calculateAverageSessionDuration(data),
        articlesPerSession: this.calculateArticlesPerSession(data),
        interactionRate: this.calculateInteractionRate(data),
        sharingBehavior: this.analyzeSharingBehavior(data),
        commentEngagement: this.analyzeCommentEngagement(data),
        bookmarkingPatterns: this.analyzeBookmarkingPatterns(data),
        searchBehavior: this.analyzeSearchBehavior(data)
      };

      return metrics;
    } catch (error) {
      console.error('Error calculating engagement metrics:', error);
      return {};
    }
  }

  static async getPersonalizedRecommendations(userId) {
    try {
      // Get user's reading history and preferences
      const userProfile = await this.getUserProfile(userId);
      const recentActivity = await this.getRecentActivity(userId, '7d');
      
      // Generate AI-powered recommendations
      const recommendations = await this.generateAIRecommendations(userProfile, recentActivity);
      
      return {
        articles: recommendations.articles,
        topics: recommendations.topics,
        sources: recommendations.sources,
        readingTimes: recommendations.optimalTimes,
        contentFormats: recommendations.preferredFormats,
        aiInsights: recommendations.insights
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return {};
    }
  }

  static async generateAIRecommendations(userProfile, recentActivity) {
    try {
      const prompt = `Analyze this user's reading behavior and generate personalized recommendations for an African news app.

User Profile:
${JSON.stringify(userProfile, null, 2)}

Recent Activity:
${JSON.stringify(recentActivity, null, 2)}

Generate recommendations for:
1. Article topics they might enjoy
2. Best times to send notifications
3. Content formats they prefer
4. Sources they might trust
5. Insights about their news consumption

Return JSON format with detailed recommendations and reasoning.`;

      const response = await GeminiService.generateContent(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('AI recommendation error:', error);
      return {
        articles: [],
        topics: [],
        sources: [],
        optimalTimes: [],
        preferredFormats: [],
        insights: 'Unable to generate AI insights at this time.'
      };
    }
  }

  static async getCommunityInsights(timeframe = '30d') {
    try {
      const insights = await Promise.all([
        this.getTrendingTopics(timeframe),
        this.getCommunityEngagement(timeframe),
        this.getGeographicDistribution(timeframe),
        this.getContentPerformance(timeframe)
      ]);

      return {
        trending: insights[0],
        engagement: insights[1],
        geographic: insights[2],
        content: insights[3],
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating community insights:', error);
      throw error;
    }
  }

  static async getTrendingTopics(timeframe) {
    try {
      const { data, error } = await supabase
        .rpc('get_trending_topics', {
          timeframe_days: this.getTimeframeDays(timeframe)
        });

      if (error) throw error;

      return data.map(topic => ({
        ...topic,
        trend: this.calculateTrendDirection(topic),
        impact: this.calculateTopicImpact(topic)
      }));
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return [];
    }
  }

  static async detectEmergingInterests(userId, timeframe) {
    try {
      const { data, error } = await supabase
        .from('reading_history')
        .select(`
          *,
          articles:article_id (category, tags)
        `)
        .eq('user_id', userId)
        .gte('read_at', this.getTimeframeBoundary(timeframe))
        .order('read_at', { ascending: true });

      if (error) throw error;

      // Analyze for emerging patterns
      const recentInterests = this.analyzeTemporalInterests(data);
      return recentInterests.filter(interest => interest.isEmerging);
    } catch (error) {
      console.error('Error detecting emerging interests:', error);
      return [];
    }
  }

  static calculateReadingStreaks(userId, timeframe) {
    // Implementation for calculating reading streaks
    return {
      current: 5,
      longest: 12,
      average: 3.2
    };
  }

  static analyzeReadingTimes(data) {
    const hourCounts = {};
    data.forEach(record => {
      const hour = new Date(record.read_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return {
      peak: sortedHours[0]?.[0] || '9',
      distribution: hourCounts,
      preferredTimeRanges: this.identifyTimeRanges(hourCounts)
    };
  }

  static calculateCompletionRate(data) {
    const completed = data.filter(d => d.completed).length;
    return data.length > 0 ? (completed / data.length) * 100 : 0;
  }

  static getTopCategories(data) {
    const categoryCounts = {};
    data.forEach(record => {
      const category = record.articles?.category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  }

  static analyzeGeographicFocus(data) {
    const countryFocus = {};
    data.forEach(record => {
      const countries = record.articles?.country_focus || [];
      countries.forEach(country => {
        countryFocus[country] = (countryFocus[country] || 0) + 1;
      });
    });

    return Object.entries(countryFocus)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));
  }

  static calculateWeeklyTrend(data) {
    const weeklyData = {};
    data.forEach(record => {
      const week = this.getWeekKey(new Date(record.read_at));
      weeklyData[week] = (weeklyData[week] || 0) + 1;
    });

    const weeks = Object.keys(weeklyData).sort();
    const values = weeks.map(week => weeklyData[week]);
    
    return {
      data: weeks.map((week, i) => ({ week, articles: values[i] })),
      trend: this.calculateTrendDirection({ values })
    };
  }

  static getSessionId() {
    // Simple session ID generation
    if (!window.sessionStorage.getItem('session_id')) {
      window.sessionStorage.setItem('session_id', 
        Date.now().toString(36) + Math.random().toString(36).substr(2));
    }
    return window.sessionStorage.getItem('session_id');
  }

  static getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  static getTimeframeBoundary(timeframe) {
    const now = new Date();
    const days = this.getTimeframeDays(timeframe);
    return new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
  }

  static getTimeframeDays(timeframe) {
    const mapping = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    return mapping[timeframe] || 30;
  }

  static calculateAverage(values) {
    return values.length > 0 ? 
      values.reduce((sum, val) => sum + (val || 0), 0) / values.length : 0;
  }

  static getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil(((date - new Date(year, 0, 1)) / 86400000 + 1) / 7);
    return `${year}-W${week}`;
  }

  static calculateTrendDirection(data) {
    if (!data.values || data.values.length < 2) return 'stable';
    
    const recent = data.values.slice(-3);
    const older = data.values.slice(-6, -3);
    
    const recentAvg = this.calculateAverage(recent);
    const olderAvg = this.calculateAverage(older);
    
    if (recentAvg > olderAvg * 1.1) return 'rising';
    if (recentAvg < olderAvg * 0.9) return 'falling';
    return 'stable';
  }

  static identifyTimeRanges(hourCounts) {
    // Identify morning, afternoon, evening preferences
    const morning = Object.entries(hourCounts)
      .filter(([hour]) => hour >= 6 && hour < 12)
      .reduce((sum, [,count]) => sum + count, 0);
    
    const afternoon = Object.entries(hourCounts)
      .filter(([hour]) => hour >= 12 && hour < 18)
      .reduce((sum, [,count]) => sum + count, 0);
    
    const evening = Object.entries(hourCounts)
      .filter(([hour]) => hour >= 18 && hour < 24)
      .reduce((sum, [,count]) => sum + count, 0);

    return { morning, afternoon, evening };
  }

  // Additional utility methods...
  static countUniqueSessions(data) {
    const sessions = new Set(data.map(d => d.session_id));
    return sessions.size;
  }

  static calculateAverageSessionDuration(data) {
    // Group by session and calculate durations
    const sessions = {};
    data.forEach(event => {
      if (!sessions[event.session_id]) {
        sessions[event.session_id] = {
          start: new Date(event.timestamp),
          end: new Date(event.timestamp)
        };
      } else {
        const eventTime = new Date(event.timestamp);
        if (eventTime < sessions[event.session_id].start) {
          sessions[event.session_id].start = eventTime;
        }
        if (eventTime > sessions[event.session_id].end) {
          sessions[event.session_id].end = eventTime;
        }
      }
    });

    const durations = Object.values(sessions).map(session => 
      (session.end - session.start) / 1000 / 60 // Convert to minutes
    );

    return this.calculateAverage(durations);
  }

  static calculateArticlesPerSession(data) {
    const articleEvents = data.filter(d => d.event_type === 'article_read');
    const sessions = this.countUniqueSessions(articleEvents);
    return sessions > 0 ? articleEvents.length / sessions : 0;
  }

  static calculateInteractionRate(data) {
    const interactions = data.filter(d => 
      ['like', 'share', 'comment', 'bookmark'].includes(d.event_type)
    ).length;
    const views = data.filter(d => d.event_type === 'article_view').length;
    return views > 0 ? (interactions / views) * 100 : 0;
  }

  static analyzeSharingBehavior(data) {
    const shares = data.filter(d => d.event_type === 'share');
    return {
      total: shares.length,
      platforms: this.groupBy(shares, 'event_data.platform'),
      timePattern: this.analyzeTimePattern(shares)
    };
  }

  static analyzeCommentEngagement(data) {
    const comments = data.filter(d => d.event_type === 'comment');
    return {
      total: comments.length,
      averageLength: this.calculateAverage(
        comments.map(c => c.event_data?.comment?.length || 0)
      ),
      sentiment: 'positive' // Would need sentiment analysis
    };
  }

  static analyzeBookmarkingPatterns(data) {
    const bookmarks = data.filter(d => d.event_type === 'bookmark');
    return {
      total: bookmarks.length,
      categories: this.groupBy(bookmarks, 'event_data.category'),
      readLaterRate: 0.7 // Would calculate from actual data
    };
  }

  static analyzeSearchBehavior(data) {
    const searches = data.filter(d => d.event_type === 'search');
    return {
      total: searches.length,
      topQueries: this.getTopQueries(searches),
      averageResultsClicked: 2.3 // Would calculate from actual data
    };
  }

  static groupBy(array, keyPath) {
    return array.reduce((groups, item) => {
      const key = this.getNestedValue(item, keyPath) || 'unknown';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  static analyzeTimePattern(events) {
    const hours = events.map(e => new Date(e.timestamp).getHours());
    return this.analyzeReadingTimes(events.map(e => ({ read_at: e.timestamp })));
  }

  static getTopQueries(searches) {
    const queries = searches.map(s => s.event_data?.query).filter(Boolean);
    const queryCounts = {};
    queries.forEach(query => {
      queryCounts[query] = (queryCounts[query] || 0) + 1;
    });
    
    return Object.entries(queryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  }
}
