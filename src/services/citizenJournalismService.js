import { supabase } from "../lib/supabase";
import { EnhancedGeminiService } from "./enhancedGeminiService";
import { DatabaseService } from "./databaseService";

// Verification thresholds and scoring
const VERIFICATION_CONFIG = {
  AI_CONFIDENCE_THRESHOLD: 0.7,
  COMMUNITY_VERIFICATION_THRESHOLD: 3,
  AUTO_PUBLISH_SCORE: 8.0,
  SUSPICIOUS_CONTENT_FLAGS: [
    "unverified claims",
    "inflammatory language",
    "potential misinformation",
    "missing source attribution",
  ],
};

// Report categories relevant to African context
const AFRICAN_REPORT_CATEGORIES = [
  {
    id: "governance",
    name: "Governance & Politics",
    subcategories: ["elections", "policy", "corruption", "public-services"],
  },
  {
    id: "economy",
    name: "Economy & Business",
    subcategories: [
      "jobs",
      "small-business",
      "agriculture",
      "trade",
      "mobile-money",
    ],
  },
  {
    id: "infrastructure",
    name: "Infrastructure",
    subcategories: ["roads", "electricity", "water", "internet", "transport"],
  },
  {
    id: "security",
    name: "Security & Safety",
    subcategories: ["crime", "conflict", "disaster", "emergency"],
  },
  {
    id: "health",
    name: "Health & Wellness",
    subcategories: [
      "healthcare",
      "disease-outbreak",
      "maternal-health",
      "mental-health",
    ],
  },
  {
    id: "education",
    name: "Education",
    subcategories: ["schools", "universities", "literacy", "skills-training"],
  },
  {
    id: "environment",
    name: "Environment & Climate",
    subcategories: [
      "pollution",
      "conservation",
      "climate-change",
      "natural-resources",
    ],
  },
  {
    id: "culture",
    name: "Culture & Society",
    subcategories: ["festivals", "traditions", "arts", "language", "religion"],
  },
  {
    id: "technology",
    name: "Technology & Innovation",
    subcategories: ["digital-inclusion", "fintech", "startups", "innovation"],
  },
  {
    id: "sports",
    name: "Sports & Recreation",
    subcategories: ["local-teams", "youth-sports", "tournaments", "facilities"],
  },
];

export class CitizenJournalismService {
  // Submit a local news report with AI verification
  static async submitLocalReport(reportData, userId) {
    try {
      if (!userId) {
        throw new Error("Authentication required for citizen reporting");
      }

      // Validate required fields
      const requiredFields = [
        "title",
        "content",
        "location",
        "category",
        "subcategory",
      ];
      const missingFields = requiredFields.filter(
        (field) => !reportData[field]
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Check user reporting rate limit
      if (!(await DatabaseService.checkRateLimit("citizen_report", userId))) {
        throw new Error(
          "Reporting rate limit exceeded. Please wait before submitting another report."
        );
      }

      // Get user's verification level
      const userVerificationLevel = await this.getUserVerificationLevel(userId);

      // Sanitize and prepare report data
      const sanitizedReport = {
        user_id: userId,
        title: DatabaseService.sanitizeInput(reportData.title),
        content: DatabaseService.sanitizeInput(reportData.content),
        location: DatabaseService.sanitizeInput(reportData.location),
        coordinates: reportData.coordinates || null,
        category: reportData.category,
        subcategory: reportData.subcategory,
        urgency_level: reportData.urgency_level || "medium",
        language: reportData.language || "en",
        media_urls: reportData.media_urls || [],
        tags: reportData.tags || [],
        source_type: "citizen_journalist",
        reporter_verification_level: userVerificationLevel,
      };

      // AI-powered verification and enhancement
      const aiVerification = await this.performAIVerification(sanitizedReport);

      // Combine user verification level with AI assessment
      const finalVerificationScore = this.calculateFinalVerificationScore(
        userVerificationLevel,
        aiVerification.confidence_score
      );

      // Determine publication status
      const status = this.determinePublicationStatus(
        finalVerificationScore,
        aiVerification
      );

      // Create the report record
      const reportRecord = {
        ...sanitizedReport,
        verification_score: finalVerificationScore,
        ai_assessment: aiVerification,
        status: status,
        published_at: status === "published" ? new Date().toISOString() : null,
        requires_review: status === "pending_review",
        auto_flagged: aiVerification.flagged_issues?.length > 0,
      };

      // Insert into database
      const { data: newReport, error } = await supabase
        .from("citizen_reports")
        .insert([reportRecord])
        .select()
        .single();

      if (error) throw error;

      // Award points to user based on verification score
      await this.awardReportingPoints(userId, finalVerificationScore, status);

      // If auto-published, also create a news post
      if (
        status === "published" &&
        finalVerificationScore >= VERIFICATION_CONFIG.AUTO_PUBLISH_SCORE
      ) {
        await this.createNewsPostFromReport(newReport);
      }

      // Send notifications if urgent
      if (
        reportData.urgency_level === "high" &&
        finalVerificationScore >= 7.0
      ) {
        await this.sendUrgentReportNotifications(newReport);
      }

      return {
        report: newReport,
        verification_score: finalVerificationScore,
        status: status,
        ai_assessment: aiVerification,
        points_awarded: this.calculatePointsAwarded(
          finalVerificationScore,
          status
        ),
      };
    } catch (error) {
      await DatabaseService.logError(error, {
        function: "submitLocalReport",
        userId,
        reportData: { ...reportData, content: "[REDACTED]" },
      });
      throw error;
    }
  }

  // AI verification with African context
  static async performAIVerification(reportData) {
    try {
      const verificationPrompt = `
      As an AI fact-checker specialized in African news and citizen journalism, analyze this local report:

      Title: ${reportData.title}
      Content: ${reportData.content}
      Location: ${reportData.location}
      Category: ${reportData.category}/${reportData.subcategory}
      Urgency: ${reportData.urgency_level}
      Language: ${reportData.language}

      Evaluate based on:
      1. Factual consistency and plausibility
      2. Local context accuracy for African communities
      3. Potential for misinformation or bias
      4. Completeness of information
      5. Writing quality and clarity
      6. Cultural sensitivity and appropriateness
      7. Urgency level appropriateness

      Return JSON with:
      {
        "confidence_score": 0-10,
        "factual_assessment": "detailed analysis",
        "local_context_accuracy": 0-10,
        "potential_issues": ["issue1", "issue2"],
        "flagged_issues": ["serious_issue1"],
        "suggested_improvements": ["improvement1", "improvement2"],
        "cultural_sensitivity_score": 0-10,
        "completeness_score": 0-10,
        "credibility_indicators": {
          "has_specific_details": boolean,
          "includes_location_context": boolean,
          "shows_local_knowledge": boolean,
          "appropriate_language": boolean
        },
        "recommendation": "publish|review|reject",
        "african_context_relevance": 0-10
      }
      `;

      return await EnhancedGeminiService.performAfricanFactCheck(
        verificationPrompt
      );
    } catch (error) {
      console.error("AI verification failed:", error);
      // Return default safe assessment if AI fails
      return {
        confidence_score: 5.0,
        factual_assessment: "AI verification unavailable",
        recommendation: "review",
        flagged_issues: ["ai_verification_failed"],
      };
    }
  }

  // Get user's verification level based on history
  static async getUserVerificationLevel(userId) {
    try {
      const { data: userStats } = await supabase
        .from("citizen_reporter_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!userStats) {
        // New reporter
        return {
          level: "novice",
          score: 5.0,
          total_reports: 0,
          verified_reports: 0,
          rejection_rate: 0,
        };
      }

      // Calculate verification level
      const accuracy_rate =
        userStats.verified_reports / Math.max(userStats.total_reports, 1);
      const rejection_rate =
        userStats.rejected_reports / Math.max(userStats.total_reports, 1);

      let level = "novice";
      let baseScore = 5.0;

      if (
        userStats.total_reports >= 50 &&
        accuracy_rate >= 0.8 &&
        rejection_rate < 0.1
      ) {
        level = "expert";
        baseScore = 9.0;
      } else if (
        userStats.total_reports >= 20 &&
        accuracy_rate >= 0.7 &&
        rejection_rate < 0.2
      ) {
        level = "experienced";
        baseScore = 7.5;
      } else if (
        userStats.total_reports >= 5 &&
        accuracy_rate >= 0.6 &&
        rejection_rate < 0.3
      ) {
        level = "intermediate";
        baseScore = 6.5;
      }

      return {
        level,
        score: baseScore,
        total_reports: userStats.total_reports,
        verified_reports: userStats.verified_reports,
        rejection_rate: rejection_rate,
      };
    } catch (error) {
      console.error("Error getting user verification level:", error);
      return {
        level: "novice",
        score: 5.0,
        total_reports: 0,
        verified_reports: 0,
        rejection_rate: 0,
      };
    }
  }

  // Calculate final verification score
  static calculateFinalVerificationScore(userLevel, aiConfidence) {
    // Weight: 40% user reputation, 60% AI assessment
    const userWeight = 0.4;
    const aiWeight = 0.6;

    const finalScore = userLevel.score * userWeight + aiConfidence * aiWeight;

    // Apply bonuses for experienced users
    let bonus = 0;
    if (userLevel.level === "expert") bonus = 0.5;
    else if (userLevel.level === "experienced") bonus = 0.3;
    else if (userLevel.level === "intermediate") bonus = 0.1;

    return Math.min(finalScore + bonus, 10.0);
  }

  // Determine publication status
  static determinePublicationStatus(verificationScore, aiAssessment) {
    if (aiAssessment.flagged_issues?.length > 0) {
      return "flagged";
    }

    if (verificationScore >= VERIFICATION_CONFIG.AUTO_PUBLISH_SCORE) {
      return "published";
    } else if (verificationScore >= 6.0) {
      return "pending_review";
    } else {
      return "draft";
    }
  }

  // Award points to reporters
  static async awardReportingPoints(userId, verificationScore, status) {
    let points = 0;

    // Base points for submission
    points += 10;

    // Verification bonus
    if (verificationScore >= 8.0) points += 50;
    else if (verificationScore >= 7.0) points += 30;
    else if (verificationScore >= 6.0) points += 20;

    // Publication bonus
    if (status === "published") points += 25;

    // Update user points
    await supabase
      .from("profiles")
      .update({
        points: supabase.raw(`points + ${points}`),
        last_active: new Date().toISOString(),
      })
      .eq("id", userId);

    return points;
  }

  // Create news post from verified citizen report
  static async createNewsPostFromReport(report) {
    try {
      const newsPost = {
        id: `citizen-${report.id}`,
        title: report.title,
        content: report.content,
        description: this.generateDescription(report.content),
        url: null, // Internal content
        thumbnail: report.media_urls?.[0] || null,
        source: "Citizen Reporter",
        category: report.category,
        subcategory: report.subcategory,
        country_focus: [this.extractCountryFromLocation(report.location)],
        language: report.language,
        published_at: new Date().toISOString(),
        is_trending: report.urgency_level === "high",
        engagement_score: Math.min(report.verification_score, 10),
        credibility_score: report.verification_score,
        tags: [...(report.tags || []), "citizen-journalism", "local-news"],
        source_type: "citizen_report",
        original_report_id: report.id,
        location: report.location,
        coordinates: report.coordinates,
      };

      await supabase.from("posts").insert([newsPost]);

      return newsPost;
    } catch (error) {
      console.error("Error creating news post from report:", error);
    }
  }

  // Get local reports for a specific area
  static async getLocalReports(options = {}) {
    const {
      location = null,
      radius = 50, // km
      coordinates = null,
      category = null,
      limit = 20,
      offset = 0,
      status = "published",
    } = options;

    try {
      let query = supabase
        .from("citizen_reports")
        .select(
          `
          id,
          title,
          content,
          location,
          coordinates,
          category,
          subcategory,
          urgency_level,
          language,
          verification_score,
          status,
          published_at,
          media_urls,
          tags,
          user_id,
          profiles!inner(username, avatar_url, verification_level)
        `
        )
        .eq("status", status);

      if (category) {
        query = query.eq("category", category);
      }

      // Location-based filtering
      if (coordinates) {
        // In a real implementation, you'd use PostGIS for geo queries
        // For now, we'll filter by location string
      } else if (location) {
        query = query.ilike("location", `%${location}%`);
      }

      query = query
        .order("published_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: reports, error } = await query;

      if (error) throw error;

      return {
        reports: reports || [],
        total: reports?.length || 0,
        hasMore: reports?.length === limit,
      };
    } catch (error) {
      console.error("Error getting local reports:", error);
      return { reports: [], total: 0, hasMore: false };
    }
  }

  // Vote on citizen reports (community verification)
  static async voteOnReport(reportId, userId, vote, feedback = null) {
    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("report_votes")
        .select("id")
        .eq("report_id", reportId)
        .eq("user_id", userId)
        .single();

      if (existingVote) {
        throw new Error("You have already voted on this report");
      }

      // Insert vote
      await supabase.from("report_votes").insert([
        {
          report_id: reportId,
          user_id: userId,
          vote: vote, // 'helpful', 'not_helpful', 'spam', 'inaccurate'
          feedback: feedback,
        },
      ]);

      // Update report's community score
      await this.updateCommunityVerificationScore(reportId);

      return { success: true };
    } catch (error) {
      console.error("Error voting on report:", error);
      throw error;
    }
  }

  // Update community verification score
  static async updateCommunityVerificationScore(reportId) {
    try {
      const { data: votes } = await supabase
        .from("report_votes")
        .select("vote")
        .eq("report_id", reportId);

      if (!votes?.length) return;

      const helpfulVotes = votes.filter((v) => v.vote === "helpful").length;
      const totalVotes = votes.length;
      const negativeVotes = votes.filter((v) =>
        ["spam", "inaccurate"].includes(v.vote)
      ).length;

      let communityScore = (helpfulVotes / totalVotes) * 10;

      // Penalize for negative votes
      if (negativeVotes >= 3) {
        communityScore = Math.max(communityScore - 2, 0);
      }

      await supabase
        .from("citizen_reports")
        .update({
          community_verification_score: communityScore,
          total_votes: totalVotes,
        })
        .eq("id", reportId);
    } catch (error) {
      console.error("Error updating community verification score:", error);
    }
  }

  // Get citizen journalism dashboard data
  static async getCitizenJournalismDashboard(userId) {
    try {
      // User's reporting stats
      const { data: userReports } = await supabase
        .from("citizen_reports")
        .select("id, status, verification_score, published_at")
        .eq("user_id", userId);

      // Recent local reports in user's area
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("location, country")
        .eq("id", userId)
        .single();

      const localReports = await this.getLocalReports({
        location: userProfile?.location,
        limit: 10,
      });

      // Trending local topics
      const trendingTopics = await this.getTrendingLocalTopics(
        userProfile?.location
      );

      // Verification level progress
      const verificationLevel = await this.getUserVerificationLevel(userId);

      return {
        user_stats: {
          total_reports: userReports?.length || 0,
          published_reports:
            userReports?.filter((r) => r.status === "published").length || 0,
          average_score: userReports?.length
            ? userReports.reduce((sum, r) => sum + r.verification_score, 0) /
              userReports.length
            : 0,
          verification_level: verificationLevel,
        },
        local_reports: localReports,
        trending_topics: trendingTopics,
        report_categories: AFRICAN_REPORT_CATEGORIES,
      };
    } catch (error) {
      console.error("Error getting citizen journalism dashboard:", error);
      return {
        user_stats: {
          total_reports: 0,
          published_reports: 0,
          average_score: 0,
        },
        local_reports: { reports: [], total: 0 },
        trending_topics: [],
        report_categories: AFRICAN_REPORT_CATEGORIES,
      };
    }
  }

  // Helper methods
  static generateDescription(content) {
    const firstSentence = content.split(".")[0];
    return firstSentence.length > 150
      ? firstSentence.substring(0, 147) + "..."
      : firstSentence + ".";
  }

  static extractCountryFromLocation(location) {
    // Simple extraction - in real implementation, use geocoding service
    const commonCountries = {
      kenya: ["nairobi", "mombasa", "kisumu", "nakuru"],
      nigeria: ["lagos", "abuja", "kano", "ibadan", "port harcourt"],
      "south-africa": ["johannesburg", "cape town", "durban", "pretoria"],
      ghana: ["accra", "kumasi", "tamale", "takoradi"],
      uganda: ["kampala", "gulu", "mbarara", "jinja"],
      tanzania: ["dar es salaam", "dodoma", "mwanza", "arusha"],
    };

    const locationLower = location.toLowerCase();
    for (const [country, cities] of Object.entries(commonCountries)) {
      if (cities.some((city) => locationLower.includes(city))) {
        return country;
      }
    }

    return "unknown";
  }

  static calculatePointsAwarded(verificationScore, status) {
    let points = 10; // Base points

    if (verificationScore >= 8.0) points += 50;
    else if (verificationScore >= 7.0) points += 30;
    else if (verificationScore >= 6.0) points += 20;

    if (status === "published") points += 25;

    return points;
  }

  // Send notifications for urgent reports
  static async sendUrgentReportNotifications(report) {
    try {
      // In a real implementation, this would send push notifications
      // to users in the affected area
      console.log(
        `Urgent report notification: ${report.title} in ${report.location}`
      );

      // Could integrate with push notification service
      // await PushNotificationService.sendToLocation(report.location, {
      //   title: 'Urgent Local Report',
      //   body: report.title,
      //   data: { reportId: report.id, type: 'urgent_report' }
      // })
    } catch (error) {
      console.error("Error sending urgent report notifications:", error);
    }
  }

  // Get trending local topics
  static async getTrendingLocalTopics(location) {
    try {
      if (!location) return [];

      const { data: recentReports } = await supabase
        .from("citizen_reports")
        .select("title, category, subcategory, tags")
        .ilike("location", `%${location}%`)
        .gte(
          "published_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        )
        .eq("status", "published");

      if (!recentReports?.length) return [];

      // Analyze for trending topics
      const categoryCount = {};
      recentReports.forEach((report) => {
        const key = `${report.category}/${report.subcategory}`;
        categoryCount[key] = (categoryCount[key] || 0) + 1;
      });

      return Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({
          category,
          count,
          trending_score: Math.min(count * 2, 10),
        }));
    } catch (error) {
      console.error("Error getting trending local topics:", error);
      return [];
    }
  }
}
