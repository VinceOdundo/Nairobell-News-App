import { supabase } from "../lib/supabase";
import { EnhancedGeminiService } from "./enhancedGeminiService";
import { DatabaseService } from "./databaseService";
import { GamificationService } from "./gamificationService";

// Discussion categories with African context
const DISCUSSION_CATEGORIES = [
  {
    id: "ubuntu_philosophy",
    name: "Ubuntu & Community Values",
    description:
      "Discussions about African values, Ubuntu philosophy, and community building",
    cultural_significance: "high",
    moderation_level: "high",
  },
  {
    id: "pan_africanism",
    name: "Pan-Africanism & Unity",
    description:
      "Continental integration, African unity, and cross-border collaboration",
    cultural_significance: "high",
    moderation_level: "medium",
  },
  {
    id: "governance_democracy",
    name: "Governance & Democracy",
    description: "Democratic processes, governance, and civic participation",
    cultural_significance: "high",
    moderation_level: "high",
  },
  {
    id: "economic_development",
    name: "Economic Development",
    description:
      "Business, entrepreneurship, and economic growth across Africa",
    cultural_significance: "medium",
    moderation_level: "medium",
  },
  {
    id: "technology_innovation",
    name: "Technology & Innovation",
    description:
      "Tech solutions, digital transformation, and innovation in Africa",
    cultural_significance: "medium",
    moderation_level: "low",
  },
  {
    id: "youth_empowerment",
    name: "Youth Empowerment",
    description: "Opportunities, challenges, and solutions for African youth",
    cultural_significance: "high",
    moderation_level: "medium",
  },
  {
    id: "cultural_heritage",
    name: "Cultural Heritage",
    description:
      "Preserving and celebrating African cultures, languages, and traditions",
    cultural_significance: "high",
    moderation_level: "medium",
  },
  {
    id: "environmental_sustainability",
    name: "Environment & Sustainability",
    description: "Climate change, conservation, and sustainable development",
    cultural_significance: "medium",
    moderation_level: "low",
  },
  {
    id: "education_skills",
    name: "Education & Skills",
    description:
      "Learning opportunities, skill development, and educational reform",
    cultural_significance: "high",
    moderation_level: "medium",
  },
  {
    id: "health_wellness",
    name: "Health & Wellness",
    description:
      "Public health, healthcare access, and wellness in African communities",
    cultural_significance: "medium",
    moderation_level: "high",
  },
];

// Content moderation rules
const MODERATION_RULES = {
  HATE_SPEECH: {
    severity: "high",
    action: "immediate_removal",
    points_penalty: -100,
  },
  MISINFORMATION: {
    severity: "high",
    action: "flag_for_review",
    points_penalty: -50,
  },
  SPAM: {
    severity: "medium",
    action: "shadow_ban",
    points_penalty: -25,
  },
  CULTURAL_INSENSITIVITY: {
    severity: "medium",
    action: "warning",
    points_penalty: -10,
  },
  TRIBAL_DISCRIMINATION: {
    severity: "high",
    action: "immediate_removal",
    points_penalty: -75,
  },
  POLITICAL_EXTREMISM: {
    severity: "high",
    action: "flag_for_review",
    points_penalty: -50,
  },
};

export class CommunityDiscussionService {
  // Create a new discussion thread
  static async createDiscussion(discussionData, userId) {
    try {
      if (!userId) {
        throw new Error("Authentication required to create discussions");
      }

      // Validate required fields
      const requiredFields = ["title", "content", "category_id"];
      const missingFields = requiredFields.filter(
        (field) => !discussionData[field]
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Check rate limit
      if (
        !(await DatabaseService.checkRateLimit("create_discussion", userId))
      ) {
        throw new Error("Discussion creation rate limit exceeded");
      }

      // Get user verification level
      const userLevel = await this.getUserCommunityLevel(userId);

      // Sanitize and prepare discussion data
      const sanitizedDiscussion = {
        user_id: userId,
        title: DatabaseService.sanitizeInput(discussionData.title),
        content: DatabaseService.sanitizeInput(discussionData.content),
        category_id: discussionData.category_id,
        tags: discussionData.tags || [],
        language: discussionData.language || "en",
        country_focus: discussionData.country_focus || [],
        is_question: discussionData.is_question || false,
        visibility:
          userLevel.level === "trusted" ? "public" : "pending_approval",
        creator_level: userLevel.level,
      };

      // AI content moderation
      const moderationResult = await this.moderateContent(sanitizedDiscussion);

      if (moderationResult.flagged) {
        sanitizedDiscussion.status = "flagged";
        sanitizedDiscussion.moderation_flags = moderationResult.flags;
      } else if (userLevel.level === "trusted") {
        sanitizedDiscussion.status = "published";
      } else {
        sanitizedDiscussion.status = "pending_approval";
      }

      // Create discussion
      const { data: discussion, error } = await supabase
        .from("discussions")
        .insert([sanitizedDiscussion])
        .select(
          `
          *,
          profiles!inner(username, avatar_url, country, verification_level)
        `
        )
        .single();

      if (error) throw error;

      // Award points for creating discussion
      await GamificationService.awardPoints(userId, "discussion_created", {
        category: discussionData.category_id,
        quality_score: moderationResult.quality_score || 5,
      });

      // Update user community stats
      await this.updateUserCommunityStats(userId, "discussion_created");

      return {
        discussion,
        moderation_result: moderationResult,
        points_awarded: 25,
      };
    } catch (error) {
      await DatabaseService.logError(error, {
        function: "createDiscussion",
        userId,
        discussionData: { ...discussionData, content: "[REDACTED]" },
      });
      throw error;
    }
  }

  // Get discussions with filtering and sorting
  static async getDiscussions(options = {}) {
    const {
      category_id = null,
      country = null,
      language = null,
      sort_by = "recent", // 'recent', 'popular', 'trending', 'most_replies'
      limit = 20,
      offset = 0,
      status = "published",
      include_user_data = true,
    } = options;

    try {
      let query = supabase
        .from("discussions")
        .select(
          `
          id,
          title,
          content,
          category_id,
          tags,
          language,
          country_focus,
          is_question,
          created_at,
          updated_at,
          replies_count,
          likes_count,
          views_count,
          status,
          ${
            include_user_data
              ? "profiles!inner(username, avatar_url, country, verification_level),"
              : ""
          }
          discussion_categories!inner(name, description)
        `
        )
        .eq("status", status);

      // Apply filters
      if (category_id) {
        query = query.eq("category_id", category_id);
      }

      if (country) {
        query = query.contains("country_focus", [country]);
      }

      if (language) {
        query = query.eq("language", language);
      }

      // Apply sorting
      switch (sort_by) {
        case "popular":
          query = query.order("likes_count", { ascending: false });
          break;
        case "trending":
          // Custom trending algorithm considering recent activity
          query = query.order("trending_score", { ascending: false });
          break;
        case "most_replies":
          query = query.order("replies_count", { ascending: false });
          break;
        default: // 'recent'
          query = query.order("created_at", { ascending: false });
      }

      query = query.range(offset, offset + limit - 1);

      const { data: discussions, error } = await query;

      if (error) throw error;

      // Enhance discussions with additional data
      const enhancedDiscussions = await Promise.all(
        discussions.map(async (discussion) => {
          // Get recent replies preview
          const recentReplies = await this.getRecentReplies(discussion.id, 3);

          // Check if current user has interacted
          const userInteraction = await this.getUserInteraction(
            discussion.id,
            options.userId
          );

          return {
            ...discussion,
            recent_replies: recentReplies,
            user_interaction: userInteraction,
            time_since_created: this.getTimeSince(discussion.created_at),
            cultural_relevance: this.calculateCulturalRelevance(
              discussion,
              options.userCountry
            ),
          };
        })
      );

      return {
        discussions: enhancedDiscussions,
        total: discussions.length,
        hasMore: discussions.length === limit,
      };
    } catch (error) {
      console.error("Error getting discussions:", error);
      return { discussions: [], total: 0, hasMore: false };
    }
  }

  // Reply to a discussion
  static async replyToDiscussion(discussionId, replyData, userId) {
    try {
      if (!userId) {
        throw new Error("Authentication required to reply");
      }

      // Check rate limit
      if (!(await DatabaseService.checkRateLimit("create_reply", userId))) {
        throw new Error("Reply rate limit exceeded");
      }

      // Get user community level
      const userLevel = await this.getUserCommunityLevel(userId);

      // Sanitize reply data
      const sanitizedReply = {
        discussion_id: discussionId,
        user_id: userId,
        content: DatabaseService.sanitizeInput(replyData.content),
        parent_reply_id: replyData.parent_reply_id || null,
        language: replyData.language || "en",
        reply_type: replyData.reply_type || "comment", // 'comment', 'answer', 'clarification'
        creator_level: userLevel.level,
      };

      // AI content moderation
      const moderationResult = await this.moderateContent(sanitizedReply);

      if (moderationResult.flagged) {
        sanitizedReply.status = "flagged";
        sanitizedReply.moderation_flags = moderationResult.flags;
      } else if (userLevel.level === "trusted") {
        sanitizedReply.status = "published";
      } else {
        sanitizedReply.status = "pending_approval";
      }

      // Create reply
      const { data: reply, error } = await supabase
        .from("discussion_replies")
        .insert([sanitizedReply])
        .select(
          `
          *,
          profiles!inner(username, avatar_url, country, verification_level)
        `
        )
        .single();

      if (error) throw error;

      // Update discussion reply count
      await supabase
        .from("discussions")
        .update({
          replies_count: supabase.raw("replies_count + 1"),
          updated_at: new Date().toISOString(),
        })
        .eq("id", discussionId);

      // Award points for helpful reply
      await GamificationService.awardPoints(userId, "discussion_reply", {
        quality_score: moderationResult.quality_score || 5,
      });

      // Update user community stats
      await this.updateUserCommunityStats(userId, "reply_created");

      return {
        reply,
        moderation_result: moderationResult,
        points_awarded: 10,
      };
    } catch (error) {
      await DatabaseService.logError(error, {
        function: "replyToDiscussion",
        userId,
        discussionId,
        replyData: { ...replyData, content: "[REDACTED]" },
      });
      throw error;
    }
  }

  // Like/unlike a discussion or reply
  static async toggleLike(itemType, itemId, userId) {
    try {
      if (!userId) {
        throw new Error("Authentication required to like content");
      }

      const tableName =
        itemType === "discussion" ? "discussion_likes" : "reply_likes";
      const itemColumn =
        itemType === "discussion" ? "discussion_id" : "reply_id";

      // Check if already liked
      const { data: existingLike } = await supabase
        .from(tableName)
        .select("id")
        .eq(itemColumn, itemId)
        .eq("user_id", userId)
        .single();

      let isLiked = false;
      let likesChange = 0;

      if (existingLike) {
        // Unlike
        await supabase.from(tableName).delete().eq("id", existingLike.id);

        likesChange = -1;
      } else {
        // Like
        await supabase.from(tableName).insert([
          {
            [itemColumn]: itemId,
            user_id: userId,
          },
        ]);

        isLiked = true;
        likesChange = 1;

        // Award points for engagement
        await GamificationService.awardPoints(userId, "content_liked");
      }

      // Update likes count
      const updateTable =
        itemType === "discussion" ? "discussions" : "discussion_replies";
      await supabase
        .from(updateTable)
        .update({ likes_count: supabase.raw(`likes_count + ${likesChange}`) })
        .eq("id", itemId);

      return { isLiked, likesChange };
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  }

  // Moderate content using AI
  static async moderateContent(content) {
    try {
      const moderationPrompt = `
      As an AI moderator for African community discussions, analyze this content for:

      Content: "${content.content}"
      ${content.title ? `Title: "${content.title}"` : ""}

      Check for:
      1. Hate speech or discriminatory language
      2. Misinformation or false claims
      3. Spam or promotional content
      4. Cultural insensitivity or tribal discrimination
      5. Political extremism or inflammatory rhetoric
      6. Appropriateness for community discussion

      Consider African cultural context:
      - Respect for elders and authority
      - Tribal and ethnic sensitivities
      - Religious considerations
      - Ubuntu philosophy and community values
      - Colonial and post-colonial sensitivities

      Return JSON with:
      {
        "flagged": boolean,
        "flags": ["flag1", "flag2"],
        "severity": "low|medium|high",
        "quality_score": 1-10,
        "cultural_appropriateness": 1-10,
        "recommended_action": "approve|warn|review|remove",
        "improvement_suggestions": ["suggestion1", "suggestion2"]
      }
      `;

      const result = await EnhancedGeminiService.moderateAfricanContent(
        moderationPrompt
      );

      return {
        flagged: result.flagged || false,
        flags: result.flags || [],
        severity: result.severity || "low",
        quality_score: result.quality_score || 5,
        cultural_appropriateness: result.cultural_appropriateness || 5,
        recommended_action: result.recommended_action || "approve",
        improvement_suggestions: result.improvement_suggestions || [],
      };
    } catch (error) {
      console.error("Content moderation failed:", error);
      // Default to conservative moderation if AI fails
      return {
        flagged: false,
        flags: ["ai_moderation_failed"],
        severity: "low",
        quality_score: 5,
        recommended_action: "review",
      };
    }
  }

  // Get user's community level and reputation
  static async getUserCommunityLevel(userId) {
    try {
      const { data: stats } = await supabase
        .from("user_community_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!stats) {
        // New user
        return {
          level: "newcomer",
          reputation_score: 0,
          discussions_created: 0,
          replies_created: 0,
          helpful_replies: 0,
          community_contributions: 0,
        };
      }

      // Calculate level based on activity and reputation
      let level = "newcomer";
      const {
        reputation_score,
        discussions_created,
        helpful_replies,
        community_contributions,
      } = stats;

      if (
        reputation_score >= 1000 &&
        discussions_created >= 20 &&
        helpful_replies >= 50
      ) {
        level = "elder"; // Respected community member
      } else if (
        reputation_score >= 500 &&
        discussions_created >= 10 &&
        helpful_replies >= 25
      ) {
        level = "trusted"; // Trusted contributor
      } else if (
        reputation_score >= 200 &&
        (discussions_created >= 5 || helpful_replies >= 10)
      ) {
        level = "contributor"; // Regular contributor
      } else if (
        reputation_score >= 50 ||
        discussions_created >= 1 ||
        helpful_replies >= 3
      ) {
        level = "member"; // Established member
      }

      return {
        ...stats,
        level,
      };
    } catch (error) {
      console.error("Error getting user community level:", error);
      return { level: "newcomer", reputation_score: 0 };
    }
  }

  // Update user community statistics
  static async updateUserCommunityStats(userId, action) {
    try {
      const updates = {};
      let pointsChange = 0;

      switch (action) {
        case "discussion_created":
          updates.discussions_created = supabase.raw("discussions_created + 1");
          updates.community_contributions = supabase.raw(
            "community_contributions + 1"
          );
          pointsChange = 5;
          break;
        case "reply_created":
          updates.replies_created = supabase.raw("replies_created + 1");
          updates.community_contributions = supabase.raw(
            "community_contributions + 1"
          );
          pointsChange = 2;
          break;
        case "helpful_reply":
          updates.helpful_replies = supabase.raw("helpful_replies + 1");
          pointsChange = 10;
          break;
        case "content_reported":
          pointsChange = -5;
          break;
      }

      updates.reputation_score = supabase.raw(
        `reputation_score + ${pointsChange}`
      );
      updates.last_activity = new Date().toISOString();

      await supabase.from("user_community_stats").upsert([
        {
          user_id: userId,
          ...updates,
        },
      ]);
    } catch (error) {
      console.error("Error updating community stats:", error);
    }
  }

  // Get recent replies for a discussion
  static async getRecentReplies(discussionId, limit = 5) {
    try {
      const { data: replies } = await supabase
        .from("discussion_replies")
        .select(
          `
          id,
          content,
          created_at,
          likes_count,
          reply_type,
          profiles!inner(username, avatar_url, verification_level)
        `
        )
        .eq("discussion_id", discussionId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit);

      return replies || [];
    } catch (error) {
      console.error("Error getting recent replies:", error);
      return [];
    }
  }

  // Get user interaction with discussion
  static async getUserInteraction(discussionId, userId) {
    if (!userId) return null;

    try {
      const [likeResult, replyResult] = await Promise.all([
        supabase
          .from("discussion_likes")
          .select("id")
          .eq("discussion_id", discussionId)
          .eq("user_id", userId)
          .single(),
        supabase
          .from("discussion_replies")
          .select("id")
          .eq("discussion_id", discussionId)
          .eq("user_id", userId)
          .limit(1),
      ]);

      return {
        has_liked: !!likeResult.data,
        has_replied: !!replyResult.data?.length,
        is_following: false, // Would need a separate follows table
      };
    } catch (error) {
      console.error("Error getting user interaction:", error);
      return null;
    }
  }

  // Calculate cultural relevance score
  static calculateCulturalRelevance(discussion, userCountry) {
    let score = 0;

    // Base score
    score += 1;

    // Country relevance
    if (userCountry && discussion.country_focus?.includes(userCountry)) {
      score += 3;
    }

    // Category cultural significance
    const category = DISCUSSION_CATEGORIES.find(
      (c) => c.id === discussion.category_id
    );
    if (category?.cultural_significance === "high") {
      score += 2;
    } else if (category?.cultural_significance === "medium") {
      score += 1;
    }

    // Recent activity
    const hoursOld =
      (Date.now() - new Date(discussion.created_at)) / (1000 * 60 * 60);
    if (hoursOld < 24) score += 1;

    // Community engagement
    if (discussion.replies_count > 10) score += 1;
    if (discussion.likes_count > 20) score += 1;

    return Math.min(score, 10);
  }

  // Get time since creation in human-readable format
  static getTimeSince(timestamp) {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now - created;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  }

  // Report inappropriate content
  static async reportContent(itemType, itemId, reason, userId) {
    try {
      if (!userId) {
        throw new Error("Authentication required to report content");
      }

      const reportData = {
        reporter_id: userId,
        item_type: itemType, // 'discussion' or 'reply'
        item_id: itemId,
        reason: reason,
        status: "pending",
        reported_at: new Date().toISOString(),
      };

      await supabase.from("content_reports").insert([reportData]);

      // Update user community stats
      await this.updateUserCommunityStats(userId, "content_reported");

      return { success: true, message: "Content reported for review" };
    } catch (error) {
      console.error("Error reporting content:", error);
      throw error;
    }
  }

  // Get discussion categories
  static getDiscussionCategories() {
    return DISCUSSION_CATEGORIES.map((category) => ({
      ...category,
      icon: this.getCategoryIcon(category.id),
    }));
  }

  // Get category icon
  static getCategoryIcon(categoryId) {
    const icons = {
      ubuntu_philosophy: "🤝",
      pan_africanism: "🌍",
      governance_democracy: "🏛️",
      economic_development: "💼",
      technology_innovation: "💡",
      youth_empowerment: "🌟",
      cultural_heritage: "🎭",
      environmental_sustainability: "🌱",
      education_skills: "📚",
      health_wellness: "🏥",
    };
    return icons[categoryId] || "💬";
  }

  // Get community dashboard data
  static async getCommunityDashboard(userId) {
    try {
      const [userStats, recentDiscussions, trendingTopics, userLevel] =
        await Promise.all([
          this.getUserCommunityStats(userId),
          this.getDiscussions({ limit: 5, userId }),
          this.getTrendingDiscussionTopics(),
          this.getUserCommunityLevel(userId),
        ]);

      return {
        user_stats: userStats,
        user_level: userLevel,
        recent_discussions: recentDiscussions,
        trending_topics: trendingTopics,
        categories: this.getDiscussionCategories(),
      };
    } catch (error) {
      console.error("Error getting community dashboard:", error);
      return {
        user_stats: null,
        user_level: { level: "newcomer" },
        recent_discussions: { discussions: [] },
        trending_topics: [],
        categories: this.getDiscussionCategories(),
      };
    }
  }

  // Get user community statistics
  static async getUserCommunityStats(userId) {
    try {
      const { data: stats } = await supabase
        .from("user_community_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      return (
        stats || {
          discussions_created: 0,
          replies_created: 0,
          helpful_replies: 0,
          reputation_score: 0,
          community_contributions: 0,
        }
      );
    } catch (error) {
      console.error("Error getting user community stats:", error);
      return {
        discussions_created: 0,
        replies_created: 0,
        helpful_replies: 0,
        reputation_score: 0,
        community_contributions: 0,
      };
    }
  }

  // Get trending discussion topics
  static async getTrendingDiscussionTopics() {
    try {
      const { data: discussions } = await supabase
        .from("discussions")
        .select("tags, category_id, created_at, replies_count, likes_count")
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        )
        .eq("status", "published");

      if (!discussions?.length) return [];

      // Analyze trending topics from tags and categories
      const topicCounts = {};
      discussions.forEach((discussion) => {
        // Count category mentions
        if (discussion.category_id) {
          topicCounts[discussion.category_id] =
            (topicCounts[discussion.category_id] || 0) + 1;
        }

        // Count tag mentions
        discussion.tags?.forEach((tag) => {
          topicCounts[tag] = (topicCounts[tag] || 0) + 1;
        });
      });

      return Object.entries(topicCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([topic, count]) => ({
          topic,
          count,
          trending_score: Math.min(count * 2, 10),
        }));
    } catch (error) {
      console.error("Error getting trending discussion topics:", error);
      return [];
    }
  }
}
