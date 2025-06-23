import { supabase } from "../lib/supabase";
import { DatabaseService } from "./databaseService";

// Achievement definitions with African context
const AFRICAN_ACHIEVEMENTS = [
  // Reading Achievements
  {
    id: "ubuntu_reader",
    name: "Ubuntu Reader",
    description: "Read 50 articles about community and social issues",
    type: "reading",
    target: 50,
    points: 500,
    badge_icon: "🤝",
    category: "community",
    cultural_significance: "high",
  },
  {
    id: "continental_explorer",
    name: "Continental Explorer",
    description: "Read news from 20 different African countries",
    type: "diversity",
    target: 20,
    points: 750,
    badge_icon: "🌍",
    category: "exploration",
    cultural_significance: "high",
  },
  {
    id: "multilingual_scholar",
    name: "Multilingual Scholar",
    description: "Read articles in 5 different African languages",
    type: "languages",
    target: 5,
    points: 600,
    badge_icon: "🗣️",
    category: "language",
    cultural_significance: "high",
  },
  {
    id: "local_champion",
    name: "Local Champion",
    description: "Read 100 local news stories from your region",
    type: "local_reading",
    target: 100,
    points: 400,
    badge_icon: "🏠",
    category: "local",
    cultural_significance: "medium",
  },

  // Citizen Journalism Achievements
  {
    id: "truth_seeker",
    name: "Truth Seeker",
    description: "Submit 10 verified citizen reports",
    type: "reporting",
    target: 10,
    points: 1000,
    badge_icon: "🔍",
    category: "journalism",
    cultural_significance: "high",
  },
  {
    id: "community_voice",
    name: "Community Voice",
    description: "First citizen report published",
    type: "first_report",
    target: 1,
    points: 100,
    badge_icon: "📢",
    category: "journalism",
    cultural_significance: "medium",
  },
  {
    id: "fact_checker",
    name: "Fact Checker",
    description: "Help verify 25 community reports",
    type: "verification",
    target: 25,
    points: 500,
    badge_icon: "✅",
    category: "verification",
    cultural_significance: "high",
  },

  // Engagement Achievements
  {
    id: "daily_devotee",
    name: "Daily Devotee",
    description: "Read news for 30 consecutive days",
    type: "streak",
    target: 30,
    points: 300,
    badge_icon: "🔥",
    category: "engagement",
    cultural_significance: "low",
  },
  {
    id: "knowledge_sharer",
    name: "Knowledge Sharer",
    description: "Share 50 articles with friends",
    type: "sharing",
    target: 50,
    points: 250,
    badge_icon: "📤",
    category: "social",
    cultural_significance: "medium",
  },
  {
    id: "quiz_master",
    name: "Quiz Master",
    description: "Score 90%+ on 20 news quizzes",
    type: "quiz",
    target: 20,
    points: 400,
    badge_icon: "🧠",
    category: "knowledge",
    cultural_significance: "low",
  },

  // Special Cultural Achievements
  {
    id: "griot_storyteller",
    name: "Griot Storyteller",
    description: "Share 10 stories about African culture and traditions",
    type: "cultural_sharing",
    target: 10,
    points: 800,
    badge_icon: "🎭",
    category: "culture",
    cultural_significance: "high",
  },
  {
    id: "unity_builder",
    name: "Unity Builder",
    description: "Engage positively in 50 community discussions",
    type: "community_engagement",
    target: 50,
    points: 600,
    badge_icon: "🤲",
    category: "community",
    cultural_significance: "high",
  },
];

// Challenge definitions
const WEEKLY_CHALLENGES = [
  {
    id: "africa_week",
    name: "Africa Unity Week",
    description: "Read news from 7 different African countries this week",
    duration: 7, // days
    target: 7,
    reward_points: 200,
    reward_badge: "🌍",
    start_date: null, // Set dynamically
    category: "diversity",
  },
  {
    id: "local_focus",
    name: "Know Your Community",
    description: "Read 10 local news stories this week",
    duration: 7,
    target: 10,
    reward_points: 150,
    reward_badge: "🏘️",
    start_date: null,
    category: "local",
  },
  {
    id: "fact_check_week",
    name: "Truth Guardian Week",
    description: "Verify 5 citizen reports this week",
    duration: 7,
    target: 5,
    reward_points: 300,
    reward_badge: "🛡️",
    start_date: null,
    category: "verification",
  },
  {
    id: "multilingual_week",
    name: "Language Explorer Week",
    description: "Read articles in 3 different languages this week",
    duration: 7,
    target: 3,
    reward_points: 250,
    reward_badge: "🗣️",
    start_date: null,
    category: "language",
  },
];

// Leaderboard categories
const LEADERBOARD_CATEGORIES = [
  {
    id: "overall_points",
    name: "Overall Champions",
    description: "Top users by total points",
    metric: "total_points",
    timeframe: "all_time",
  },
  {
    id: "monthly_readers",
    name: "Monthly Readers",
    description: "Most articles read this month",
    metric: "articles_read",
    timeframe: "monthly",
  },
  {
    id: "citizen_journalists",
    name: "Citizen Journalists",
    description: "Top community reporters",
    metric: "verified_reports",
    timeframe: "all_time",
  },
  {
    id: "fact_checkers",
    name: "Fact Checkers",
    description: "Top community verifiers",
    metric: "verifications_completed",
    timeframe: "all_time",
  },
  {
    id: "local_champions",
    name: "Local Champions",
    description: "Top local news readers by region",
    metric: "local_articles_read",
    timeframe: "monthly",
    regional: true,
  },
];

export class GamificationService {
  // Get user's gamification profile
  static async getUserGamificationProfile(userId) {
    try {
      const { data: profile, error } = await supabase
        .from("user_gamification")
        .select(
          `
          *,
          profiles!inner(username, avatar_url, country, location)
        `
        )
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      // If no gamification profile exists, create one
      if (!profile) {
        return await this.createGamificationProfile(userId);
      }

      // Get recent achievements
      const recentAchievements = await this.getRecentAchievements(userId, 5);

      // Get active challenges
      const activeChallenges = await this.getActiveChallenges(userId);

      // Calculate level and progress
      const levelInfo = this.calculateLevel(profile.total_points);

      return {
        ...profile,
        level_info: levelInfo,
        recent_achievements: recentAchievements,
        active_challenges: activeChallenges,
        next_achievement: await this.getNextAchievement(userId),
      };
    } catch (error) {
      console.error("Error getting gamification profile:", error);
      return null;
    }
  }

  // Create initial gamification profile
  static async createGamificationProfile(userId) {
    try {
      const initialProfile = {
        user_id: userId,
        total_points: 0,
        level: 1,
        reading_streak: 0,
        longest_streak: 0,
        articles_read: 0,
        local_articles_read: 0,
        reports_submitted: 0,
        verified_reports: 0,
        verifications_completed: 0,
        quizzes_completed: 0,
        quiz_accuracy: 0.0,
        countries_explored: [],
        languages_used: ["en"],
        achievements_earned: [],
        last_activity: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("user_gamification")
        .insert([initialProfile])
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        level_info: this.calculateLevel(0),
        recent_achievements: [],
        active_challenges: await this.getActiveChallenges(userId),
        next_achievement: await this.getNextAchievement(userId),
      };
    } catch (error) {
      console.error("Error creating gamification profile:", error);
      return null;
    }
  }

  // Award points for various activities
  static async awardPoints(userId, activity, metadata = {}) {
    try {
      const pointsMap = {
        article_read: 2,
        local_article_read: 3,
        article_shared: 5,
        quiz_completed: 10,
        quiz_perfect_score: 25,
        citizen_report_submitted: 50,
        citizen_report_verified: 100,
        report_verification_completed: 15,
        daily_streak: 10,
        weekly_streak: 50,
        comment_posted: 3,
        helpful_comment: 10,
        translation_used: 5,
        offline_reading: 1,
      };

      const points = pointsMap[activity] || 0;
      if (points === 0) return;

      // Get current profile
      const profile = await this.getUserGamificationProfile(userId);
      if (!profile) return;

      // Calculate new totals
      const newPoints = profile.total_points + points;
      const newLevel = this.calculateLevel(newPoints);

      // Update specific metrics based on activity
      const updates = { total_points: newPoints };

      switch (activity) {
        case "article_read":
          updates.articles_read = profile.articles_read + 1;
          await this.updateReadingStreak(userId);
          break;
        case "local_article_read":
          updates.local_articles_read = profile.local_articles_read + 1;
          updates.articles_read = profile.articles_read + 1;
          await this.updateReadingStreak(userId);
          break;
        case "citizen_report_submitted":
          updates.reports_submitted = profile.reports_submitted + 1;
          break;
        case "citizen_report_verified":
          updates.verified_reports = profile.verified_reports + 1;
          break;
        case "report_verification_completed":
          updates.verifications_completed = profile.verifications_completed + 1;
          break;
        case "quiz_completed":
          updates.quizzes_completed = profile.quizzes_completed + 1;
          if (metadata.score) {
            const totalAccuracy =
              (profile.quiz_accuracy * profile.quizzes_completed +
                metadata.score) /
              (profile.quizzes_completed + 1);
            updates.quiz_accuracy = totalAccuracy;
          }
          break;
      }

      // Add country to explored list if provided
      if (
        metadata.country &&
        !profile.countries_explored.includes(metadata.country)
      ) {
        updates.countries_explored = [
          ...profile.countries_explored,
          metadata.country,
        ];
      }

      // Add language to used list if provided
      if (
        metadata.language &&
        !profile.languages_used.includes(metadata.language)
      ) {
        updates.languages_used = [...profile.languages_used, metadata.language];
      }

      // Update profile
      await supabase
        .from("user_gamification")
        .update(updates)
        .eq("user_id", userId);

      // Check for new achievements
      await this.checkForNewAchievements(userId, activity, metadata);

      // Check for level up
      if (newLevel.level > profile.level) {
        await this.handleLevelUp(userId, newLevel.level, profile.level);
      }

      return {
        points_awarded: points,
        new_total: newPoints,
        level_up: newLevel.level > profile.level,
      };
    } catch (error) {
      console.error("Error awarding points:", error);
      return null;
    }
  }

  // Update reading streak
  static async updateReadingStreak(userId) {
    try {
      const { data: profile } = await supabase
        .from("user_gamification")
        .select("reading_streak, longest_streak, last_activity")
        .eq("user_id", userId)
        .single();

      if (!profile) return;

      const today = new Date().toDateString();
      const lastActivity = new Date(profile.last_activity).toDateString();
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toDateString();

      let newStreak = profile.reading_streak;

      if (lastActivity === today) {
        // Already read today, no change to streak
        return;
      } else if (lastActivity === yesterday) {
        // Consecutive day
        newStreak += 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      const updates = {
        reading_streak: newStreak,
        longest_streak: Math.max(newStreak, profile.longest_streak),
        last_activity: new Date().toISOString(),
      };

      await supabase
        .from("user_gamification")
        .update(updates)
        .eq("user_id", userId);

      // Award streak bonuses
      if (newStreak === 7) {
        await this.awardPoints(userId, "weekly_streak");
      } else if (newStreak > 1) {
        await this.awardPoints(userId, "daily_streak");
      }
    } catch (error) {
      console.error("Error updating reading streak:", error);
    }
  }

  // Check for new achievements
  static async checkForNewAchievements(userId, activity, metadata = {}) {
    try {
      const profile = await this.getUserGamificationProfile(userId);
      if (!profile) return;

      const earnedAchievements = profile.achievements_earned || [];
      const newAchievements = [];

      for (const achievement of AFRICAN_ACHIEVEMENTS) {
        // Skip if already earned
        if (earnedAchievements.includes(achievement.id)) continue;

        let isEarned = false;

        switch (achievement.type) {
          case "reading":
            isEarned = profile.articles_read >= achievement.target;
            break;
          case "local_reading":
            isEarned = profile.local_articles_read >= achievement.target;
            break;
          case "diversity":
            isEarned = profile.countries_explored.length >= achievement.target;
            break;
          case "languages":
            isEarned = profile.languages_used.length >= achievement.target;
            break;
          case "reporting":
            isEarned = profile.verified_reports >= achievement.target;
            break;
          case "first_report":
            isEarned =
              activity === "citizen_report_submitted" &&
              profile.reports_submitted >= 1;
            break;
          case "verification":
            isEarned = profile.verifications_completed >= achievement.target;
            break;
          case "streak":
            isEarned = profile.longest_streak >= achievement.target;
            break;
          case "quiz":
            isEarned =
              profile.quizzes_completed >= achievement.target &&
              profile.quiz_accuracy >= 0.9;
            break;
        }

        if (isEarned) {
          newAchievements.push(achievement);
        }
      }

      // Award new achievements
      if (newAchievements.length > 0) {
        const updatedAchievements = [
          ...earnedAchievements,
          ...newAchievements.map((a) => a.id),
        ];
        const bonusPoints = newAchievements.reduce(
          (sum, a) => sum + a.points,
          0
        );

        await supabase
          .from("user_gamification")
          .update({
            achievements_earned: updatedAchievements,
            total_points: profile.total_points + bonusPoints,
          })
          .eq("user_id", userId);

        // Log achievement earned
        for (const achievement of newAchievements) {
          await supabase.from("achievement_logs").insert([
            {
              user_id: userId,
              achievement_id: achievement.id,
              points_awarded: achievement.points,
              earned_at: new Date().toISOString(),
            },
          ]);
        }

        return newAchievements;
      }

      return [];
    } catch (error) {
      console.error("Error checking achievements:", error);
      return [];
    }
  }

  // Calculate level from points
  static calculateLevel(points) {
    // Level formula: Each level requires 100 more points than the previous
    // Level 1: 0-99, Level 2: 100-299, Level 3: 300-599, etc.
    let level = 1;
    let pointsRequired = 100;
    let totalRequired = 0;

    while (points >= totalRequired + pointsRequired) {
      totalRequired += pointsRequired;
      level++;
      pointsRequired += 50; // Increasing difficulty
    }

    const pointsInCurrentLevel = points - totalRequired;
    const progressToNext = pointsInCurrentLevel / pointsRequired;

    return {
      level,
      points_in_level: pointsInCurrentLevel,
      points_to_next: pointsRequired - pointsInCurrentLevel,
      progress_percentage: Math.round(progressToNext * 100),
      total_required_for_level: pointsRequired,
    };
  }

  // Get leaderboard
  static async getLeaderboard(
    category = "overall_points",
    limit = 50,
    userCountry = null
  ) {
    try {
      const categoryConfig = LEADERBOARD_CATEGORIES.find(
        (c) => c.id === category
      );
      if (!categoryConfig) throw new Error("Invalid leaderboard category");

      let query = supabase.from("user_gamification").select(`
          user_id,
          ${categoryConfig.metric},
          profiles!inner(username, avatar_url, country, location)
        `);

      // Apply time filters
      if (categoryConfig.timeframe === "monthly") {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        // For monthly metrics, we'd need separate tracking tables
        // For now, we'll use the all-time data
      }

      // Apply regional filter
      if (categoryConfig.regional && userCountry) {
        query = query.eq("profiles.country", userCountry);
      }

      query = query
        .order(categoryConfig.metric, { ascending: false })
        .limit(limit);

      const { data: leaderboard, error } = await query;

      if (error) throw error;

      return {
        category: categoryConfig,
        rankings:
          leaderboard?.map((entry, index) => ({
            rank: index + 1,
            user_id: entry.user_id,
            username: entry.profiles.username,
            avatar_url: entry.profiles.avatar_url,
            country: entry.profiles.country,
            score: entry[categoryConfig.metric],
            level: this.calculateLevel(entry.total_points || 0).level,
          })) || [],
      };
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return { category: null, rankings: [] };
    }
  }

  // Get active challenges for user
  static async getActiveChallenges(userId) {
    try {
      const { data: userChallenges } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active");

      // Get this week's challenges
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const activeChallenges = WEEKLY_CHALLENGES.map((challenge) => {
        const userChallenge = userChallenges?.find(
          (uc) => uc.challenge_id === challenge.id
        );

        return {
          ...challenge,
          start_date: weekStart.toISOString(),
          end_date: new Date(
            weekStart.getTime() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          progress: userChallenge?.progress || 0,
          completed: userChallenge?.completed || false,
          user_challenge_id: userChallenge?.id,
        };
      });

      return activeChallenges;
    } catch (error) {
      console.error("Error getting active challenges:", error);
      return [];
    }
  }

  // Update challenge progress
  static async updateChallengeProgress(userId, challengeId, increment = 1) {
    try {
      const { data: userChallenge } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("user_id", userId)
        .eq("challenge_id", challengeId)
        .single();

      const challenge = WEEKLY_CHALLENGES.find((c) => c.id === challengeId);
      if (!challenge) return;

      let progress = increment;
      let challengeRecord = null;

      if (userChallenge) {
        progress = userChallenge.progress + increment;
        challengeRecord = await supabase
          .from("user_challenges")
          .update({ progress })
          .eq("id", userChallenge.id)
          .select()
          .single();
      } else {
        challengeRecord = await supabase
          .from("user_challenges")
          .insert([
            {
              user_id: userId,
              challenge_id: challengeId,
              progress,
              status: "active",
              week_start: new Date().toISOString(),
            },
          ])
          .select()
          .single();
      }

      // Check if challenge completed
      if (progress >= challenge.target && !userChallenge?.completed) {
        await this.completeChallengeReward(userId, challenge);
      }

      return challengeRecord;
    } catch (error) {
      console.error("Error updating challenge progress:", error);
    }
  }

  // Complete challenge and award rewards
  static async completeChallengeReward(userId, challenge) {
    try {
      // Mark challenge as completed
      await supabase
        .from("user_challenges")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("challenge_id", challenge.id);

      // Award points
      await supabase
        .from("user_gamification")
        .update({
          total_points: supabase.raw(
            `total_points + ${challenge.reward_points}`
          ),
        })
        .eq("user_id", userId);

      // Log completion
      await supabase.from("challenge_completions").insert([
        {
          user_id: userId,
          challenge_id: challenge.id,
          points_awarded: challenge.reward_points,
          completed_at: new Date().toISOString(),
        },
      ]);

      return true;
    } catch (error) {
      console.error("Error completing challenge reward:", error);
      return false;
    }
  }

  // Get recent achievements
  static async getRecentAchievements(userId, limit = 5) {
    try {
      const { data: achievementLogs } = await supabase
        .from("achievement_logs")
        .select("*")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false })
        .limit(limit);

      return (
        achievementLogs?.map((log) => {
          const achievement = AFRICAN_ACHIEVEMENTS.find(
            (a) => a.id === log.achievement_id
          );
          return {
            ...achievement,
            earned_at: log.earned_at,
            points_awarded: log.points_awarded,
          };
        }) || []
      );
    } catch (error) {
      console.error("Error getting recent achievements:", error);
      return [];
    }
  }

  // Get next achievable achievement
  static async getNextAchievement(userId) {
    try {
      const profile = await this.getUserGamificationProfile(userId);
      if (!profile) return null;

      const earnedAchievements = profile.achievements_earned || [];

      // Find closest unearned achievement
      let closestAchievement = null;
      let smallestGap = Infinity;

      for (const achievement of AFRICAN_ACHIEVEMENTS) {
        if (earnedAchievements.includes(achievement.id)) continue;

        let currentProgress = 0;
        let gap = 0;

        switch (achievement.type) {
          case "reading":
            currentProgress = profile.articles_read;
            gap = achievement.target - currentProgress;
            break;
          case "local_reading":
            currentProgress = profile.local_articles_read;
            gap = achievement.target - currentProgress;
            break;
          case "diversity":
            currentProgress = profile.countries_explored.length;
            gap = achievement.target - currentProgress;
            break;
          case "languages":
            currentProgress = profile.languages_used.length;
            gap = achievement.target - currentProgress;
            break;
          case "reporting":
            currentProgress = profile.verified_reports;
            gap = achievement.target - currentProgress;
            break;
          case "verification":
            currentProgress = profile.verifications_completed;
            gap = achievement.target - currentProgress;
            break;
          case "streak":
            currentProgress = profile.longest_streak;
            gap = achievement.target - currentProgress;
            break;
          case "quiz":
            currentProgress = profile.quizzes_completed;
            gap = achievement.target - currentProgress;
            break;
        }

        if (gap > 0 && gap < smallestGap) {
          smallestGap = gap;
          closestAchievement = {
            ...achievement,
            current_progress: currentProgress,
            remaining: gap,
            progress_percentage: Math.round(
              (currentProgress / achievement.target) * 100
            ),
          };
        }
      }

      return closestAchievement;
    } catch (error) {
      console.error("Error getting next achievement:", error);
      return null;
    }
  }

  // Handle level up
  static async handleLevelUp(userId, newLevel, oldLevel) {
    try {
      // Award level up bonus points
      const bonusPoints = newLevel * 50;

      await supabase
        .from("user_gamification")
        .update({
          level: newLevel,
          total_points: supabase.raw(`total_points + ${bonusPoints}`),
        })
        .eq("user_id", userId);

      // Log level up
      await supabase.from("level_up_logs").insert([
        {
          user_id: userId,
          old_level: oldLevel,
          new_level: newLevel,
          bonus_points: bonusPoints,
          leveled_up_at: new Date().toISOString(),
        },
      ]);

      return { bonus_points: bonusPoints };
    } catch (error) {
      console.error("Error handling level up:", error);
      return null;
    }
  }

  // Get gamification statistics
  static async getGamificationStats() {
    try {
      const { data: stats } = await supabase.from("user_gamification").select(`
          total_points,
          level,
          articles_read,
          countries_explored,
          achievements_earned
        `);

      if (!stats?.length) return null;

      return {
        total_users: stats.length,
        total_points_awarded: stats.reduce(
          (sum, user) => sum + user.total_points,
          0
        ),
        average_level:
          stats.reduce((sum, user) => sum + user.level, 0) / stats.length,
        total_articles_read: stats.reduce(
          (sum, user) => sum + user.articles_read,
          0
        ),
        unique_countries_explored: new Set(
          stats.flatMap((user) => user.countries_explored)
        ).size,
        total_achievements_earned: stats.reduce(
          (sum, user) => sum + (user.achievements_earned?.length || 0),
          0
        ),
      };
    } catch (error) {
      console.error("Error getting gamification stats:", error);
      return null;
    }
  }
}
