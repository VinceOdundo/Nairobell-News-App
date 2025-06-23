import { supabase } from "../lib/supabase";
import { DatabaseService } from "./databaseService";

// Notification types with African context
const NOTIFICATION_TYPES = {
  // News notifications
  BREAKING_NEWS: {
    id: "breaking_news",
    name: "Breaking News",
    description: "Urgent news updates from your region",
    priority: "high",
    default_enabled: true,
    sound_enabled: true,
    vibration_enabled: true,
  },
  LOCAL_NEWS: {
    id: "local_news",
    name: "Local News",
    description: "News from your local area and country",
    priority: "medium",
    default_enabled: true,
    sound_enabled: false,
    vibration_enabled: true,
  },
  PERSONALIZED_FEED: {
    id: "personalized_feed",
    name: "Personalized Updates",
    description: "News matching your interests",
    priority: "medium",
    default_enabled: true,
    sound_enabled: false,
    vibration_enabled: false,
  },

  // Community notifications
  DISCUSSION_REPLY: {
    id: "discussion_reply",
    name: "Discussion Replies",
    description: "Replies to your discussions",
    priority: "medium",
    default_enabled: true,
    sound_enabled: true,
    vibration_enabled: true,
  },
  COMMUNITY_MENTION: {
    id: "community_mention",
    name: "Community Mentions",
    description: "When someone mentions you in discussions",
    priority: "medium",
    default_enabled: true,
    sound_enabled: true,
    vibration_enabled: true,
  },
  TRENDING_DISCUSSION: {
    id: "trending_discussion",
    name: "Trending Discussions",
    description: "Popular discussions in your community",
    priority: "low",
    default_enabled: false,
    sound_enabled: false,
    vibration_enabled: false,
  },

  // Citizen journalism notifications
  REPORT_STATUS: {
    id: "report_status",
    name: "Report Status Updates",
    description: "Updates on your citizen reports",
    priority: "medium",
    default_enabled: true,
    sound_enabled: true,
    vibration_enabled: true,
  },
  COMMUNITY_REPORT: {
    id: "community_report",
    name: "Community Reports",
    description: "New reports from your area",
    priority: "medium",
    default_enabled: true,
    sound_enabled: false,
    vibration_enabled: true,
  },
  VERIFICATION_REQUEST: {
    id: "verification_request",
    name: "Verification Requests",
    description: "Help verify community reports",
    priority: "low",
    default_enabled: false,
    sound_enabled: false,
    vibration_enabled: false,
  },

  // Gamification notifications
  ACHIEVEMENT_EARNED: {
    id: "achievement_earned",
    name: "Achievement Earned",
    description: "New badges and achievements",
    priority: "low",
    default_enabled: true,
    sound_enabled: true,
    vibration_enabled: true,
  },
  LEVEL_UP: {
    id: "level_up",
    name: "Level Up",
    description: "Level progression updates",
    priority: "low",
    default_enabled: true,
    sound_enabled: true,
    vibration_enabled: true,
  },
  CHALLENGE_AVAILABLE: {
    id: "challenge_available",
    name: "New Challenges",
    description: "Weekly challenges and quests",
    priority: "low",
    default_enabled: true,
    sound_enabled: false,
    vibration_enabled: false,
  },
  STREAK_REMINDER: {
    id: "streak_reminder",
    name: "Streak Reminders",
    description: "Daily reading streak reminders",
    priority: "low",
    default_enabled: true,
    sound_enabled: false,
    vibration_enabled: false,
  },

  // System notifications
  SYSTEM_UPDATE: {
    id: "system_update",
    name: "System Updates",
    description: "App updates and announcements",
    priority: "low",
    default_enabled: true,
    sound_enabled: false,
    vibration_enabled: false,
  },
  SECURITY_ALERT: {
    id: "security_alert",
    name: "Security Alerts",
    description: "Account security notifications",
    priority: "high",
    default_enabled: true,
    sound_enabled: true,
    vibration_enabled: true,
  },
};

// Delivery methods
const DELIVERY_METHODS = {
  PUSH: "push_notification",
  IN_APP: "in_app",
  EMAIL: "email",
  SMS: "sms",
};

// Notification scheduling options
const SCHEDULE_OPTIONS = {
  IMMEDIATE: "immediate",
  DELAYED: "delayed",
  SCHEDULED: "scheduled",
  DIGEST: "digest",
};

export class NotificationService {
  // Send notification to user
  static async sendNotification(userId, notificationType, data, options = {}) {
    try {
      const {
        priority = "medium",
        scheduledFor = null,
        deliveryMethods = [DELIVERY_METHODS.PUSH, DELIVERY_METHODS.IN_APP],
        customTitle = null,
        customMessage = null,
        actionUrl = null,
        metadata = {},
      } = options;

      // Check user notification preferences
      const userPrefs = await this.getUserNotificationPreferences(userId);
      const typeConfig = NOTIFICATION_TYPES[notificationType];

      if (!typeConfig || !userPrefs[notificationType]?.enabled) {
        return { success: false, reason: "notifications_disabled" };
      }

      // Check rate limiting
      if (
        !(await DatabaseService.checkRateLimit("notification_send", userId))
      ) {
        return { success: false, reason: "rate_limited" };
      }

      // Generate notification content
      const notificationContent = await this.generateNotificationContent(
        notificationType,
        data,
        userPrefs.language || "en",
        customTitle,
        customMessage
      );

      // Create notification record
      const notificationData = {
        user_id: userId,
        type: notificationType,
        title: notificationContent.title,
        message: notificationContent.message,
        priority: priority,
        delivery_methods: deliveryMethods,
        action_url: actionUrl,
        metadata: { ...metadata, ...data },
        scheduled_for: scheduledFor || new Date().toISOString(),
        status: scheduledFor ? "scheduled" : "pending",
        cultural_context: notificationContent.cultural_context,
      };

      const { data: notification, error } = await supabase
        .from("notifications")
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;

      // Send immediately if not scheduled
      if (!scheduledFor) {
        await this.deliverNotification(notification, userPrefs);
      }

      return {
        success: true,
        notification_id: notification.id,
        delivery_methods: deliveryMethods,
      };
    } catch (error) {
      await DatabaseService.logError(error, {
        function: "sendNotification",
        userId,
        notificationType,
        data,
      });
      return { success: false, error: error.message };
    }
  }

  // Generate culturally appropriate notification content
  static async generateNotificationContent(
    type,
    data,
    language = "en",
    customTitle = null,
    customMessage = null
  ) {
    try {
      if (customTitle && customMessage) {
        return {
          title: customTitle,
          message: customMessage,
          cultural_context: "custom",
        };
      }

      const templates = this.getNotificationTemplates(language);
      const template = templates[type];

      if (!template) {
        return {
          title: "Nairobell News Update",
          message: "You have a new update",
          cultural_context: "default",
        };
      }

      // Replace placeholders with data
      let title = template.title;
      let message = template.message;

      Object.entries(data).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        title = title.replace(new RegExp(placeholder, "g"), value);
        message = message.replace(new RegExp(placeholder, "g"), value);
      });

      // Add time-based greetings for African context
      const greeting = this.getTimeBasedGreeting(language);
      if (template.includeGreeting) {
        title = `${greeting} ${title}`;
      }

      return {
        title,
        message,
        cultural_context: template.cultural_context || "african",
      };
    } catch (error) {
      console.error("Error generating notification content:", error);
      return {
        title: "Nairobell News",
        message: "You have a new notification",
        cultural_context: "default",
      };
    }
  }

  // Get notification templates with African cultural context
  static getNotificationTemplates(language = "en") {
    const templates = {
      // English templates with African context
      en: {
        breaking_news: {
          title: "🚨 Breaking: {{title}}",
          message: "Urgent news from {{location}}. Stay informed.",
          includeGreeting: false,
          cultural_context: "urgent",
        },
        local_news: {
          title: "📍 Local Update: {{title}}",
          message: "News from your community: {{description}}",
          includeGreeting: true,
          cultural_context: "community",
        },
        discussion_reply: {
          title: "💬 {{username}} replied to your discussion",
          message: '"{{preview}}" - Join the conversation',
          includeGreeting: false,
          cultural_context: "social",
        },
        achievement_earned: {
          title: "🎉 Achievement Unlocked!",
          message: 'You earned "{{achievement_name}}" - {{points}} points!',
          includeGreeting: true,
          cultural_context: "celebration",
        },
        report_status: {
          title: "📰 Your report has been {{status}}",
          message: '"{{title}}" - Thank you for keeping our community informed',
          includeGreeting: false,
          cultural_context: "civic",
        },
        community_mention: {
          title: "👋 {{username}} mentioned you",
          message: 'In discussion: "{{discussion_title}}"',
          includeGreeting: false,
          cultural_context: "social",
        },
      },

      // Swahili templates
      sw: {
        breaking_news: {
          title: "🚨 Habari za Haraka: {{title}}",
          message: "Habari muhimu kutoka {{location}}. Fuata habari.",
          includeGreeting: false,
          cultural_context: "urgent",
        },
        local_news: {
          title: "📍 Habari za Mtaa: {{title}}",
          message: "Habari kutoka jumuiya yako: {{description}}",
          includeGreeting: true,
          cultural_context: "community",
        },
        achievement_earned: {
          title: "🎉 Umepata Tuzo!",
          message: 'Umepata "{{achievement_name}}" - alama {{points}}!',
          includeGreeting: true,
          cultural_context: "celebration",
        },
      },

      // Yoruba templates
      yo: {
        breaking_news: {
          title: "🚨 Ìròyìn Kíkankíkan: {{title}}",
          message: "Ìròyìn pàtàkì láti {{location}}. Tẹ̀ lé ìròyìn náà.",
          includeGreeting: false,
          cultural_context: "urgent",
        },
        local_news: {
          title: "📍 Ìròyìn Agbègbè: {{title}}",
          message: "Ìròyìn láti àgbègbè rẹ: {{description}}",
          includeGreeting: true,
          cultural_context: "community",
        },
      },

      // Hausa templates
      ha: {
        breaking_news: {
          title: "🚨 Sabon Labari: {{title}}",
          message: "Muhimmin labari daga {{location}}. Ku biyo.",
          includeGreeting: false,
          cultural_context: "urgent",
        },
        local_news: {
          title: "📍 Labarun Gida: {{title}}",
          message: "Labari daga al'ummarku: {{description}}",
          includeGreeting: true,
          cultural_context: "community",
        },
      },
    };

    return templates[language] || templates.en;
  }

  // Get time-based greeting in different languages
  static getTimeBasedGreeting(language = "en") {
    const hour = new Date().getHours();
    const greetings = {
      en: {
        morning: "Good morning!",
        afternoon: "Good afternoon!",
        evening: "Good evening!",
      },
      sw: {
        morning: "Habari za asubuhi!",
        afternoon: "Habari za mchana!",
        evening: "Habari za jioni!",
      },
      yo: {
        morning: "Ẹ káàárọ̀!",
        afternoon: "Ẹ káásàn!",
        evening: "Ẹ kú àálẹ́!",
      },
      ha: {
        morning: "Barka da safiya!",
        afternoon: "Barka da rana!",
        evening: "Barka da yamma!",
      },
    };

    const langGreetings = greetings[language] || greetings.en;

    if (hour < 12) return langGreetings.morning;
    if (hour < 17) return langGreetings.afternoon;
    return langGreetings.evening;
  }

  // Deliver notification through various channels
  static async deliverNotification(notification, userPrefs) {
    try {
      const deliveryResults = [];

      for (const method of notification.delivery_methods) {
        try {
          let result = null;

          switch (method) {
            case DELIVERY_METHODS.PUSH:
              result = await this.sendPushNotification(notification, userPrefs);
              break;
            case DELIVERY_METHODS.IN_APP:
              result = await this.sendInAppNotification(notification);
              break;
            case DELIVERY_METHODS.EMAIL:
              result = await this.sendEmailNotification(
                notification,
                userPrefs
              );
              break;
            case DELIVERY_METHODS.SMS:
              result = await this.sendSMSNotification(notification, userPrefs);
              break;
          }

          deliveryResults.push({
            method,
            success: result?.success || false,
            message_id: result?.message_id,
          });
        } catch (error) {
          console.error(`Error delivering notification via ${method}:`, error);
          deliveryResults.push({
            method,
            success: false,
            error: error.message,
          });
        }
      }

      // Update notification status
      const overallSuccess = deliveryResults.some((r) => r.success);
      await supabase
        .from("notifications")
        .update({
          status: overallSuccess ? "delivered" : "failed",
          delivered_at: new Date().toISOString(),
          delivery_results: deliveryResults,
        })
        .eq("id", notification.id);

      return { success: overallSuccess, deliveryResults };
    } catch (error) {
      console.error("Error delivering notification:", error);
      return { success: false, error: error.message };
    }
  }

  // Send push notification
  static async sendPushNotification(notification, userPrefs) {
    try {
      // Check if user has enabled push notifications
      if (!userPrefs.push_enabled) {
        return { success: false, reason: "push_disabled" };
      }

      // Get user's push token
      const { data: pushToken } = await supabase
        .from("user_push_tokens")
        .select("token, platform")
        .eq("user_id", notification.user_id)
        .eq("is_active", true)
        .single();

      if (!pushToken) {
        return { success: false, reason: "no_push_token" };
      }

      // Configure notification based on type and user preferences
      const typeConfig = NOTIFICATION_TYPES[notification.type];
      const pushPayload = {
        title: notification.title,
        body: notification.message,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        data: {
          notification_id: notification.id,
          type: notification.type,
          action_url: notification.action_url,
          metadata: notification.metadata,
        },
        requireInteraction: notification.priority === "high",
        silent:
          !typeConfig?.sound_enabled ||
          !userPrefs[notification.type]?.sound_enabled,
      };

      // Add vibration pattern for mobile
      if (
        typeConfig?.vibration_enabled &&
        userPrefs[notification.type]?.vibration_enabled
      ) {
        pushPayload.vibrate =
          notification.priority === "high" ? [200, 100, 200] : [100];
      }

      // In a real implementation, this would use a push service like FCM
      // For now, we'll simulate the push notification
      console.log("Push notification sent:", pushPayload);

      return {
        success: true,
        message_id: `push_${Date.now()}`,
        platform: pushToken.platform,
      };
    } catch (error) {
      console.error("Push notification error:", error);
      return { success: false, error: error.message };
    }
  }

  // Send in-app notification
  static async sendInAppNotification(notification) {
    try {
      // Mark as delivered for in-app (it's already in the database)
      return { success: true, message_id: `inapp_${notification.id}` };
    } catch (error) {
      console.error("In-app notification error:", error);
      return { success: false, error: error.message };
    }
  }

  // Send email notification (for important updates)
  static async sendEmailNotification(notification, userPrefs) {
    try {
      if (!userPrefs.email_enabled) {
        return { success: false, reason: "email_disabled" };
      }

      // Get user email
      const { data: user } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", notification.user_id)
        .single();

      if (!user?.email) {
        return { success: false, reason: "no_email" };
      }

      // In a real implementation, this would use an email service
      console.log("Email notification sent to:", user.email);

      return {
        success: true,
        message_id: `email_${Date.now()}`,
        recipient: user.email,
      };
    } catch (error) {
      console.error("Email notification error:", error);
      return { success: false, error: error.message };
    }
  }

  // Send SMS notification (for critical updates in areas with limited internet)
  static async sendSMSNotification(notification, userPrefs) {
    try {
      if (!userPrefs.sms_enabled) {
        return { success: false, reason: "sms_disabled" };
      }

      // Get user phone number
      const { data: user } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", notification.user_id)
        .single();

      if (!user?.phone) {
        return { success: false, reason: "no_phone" };
      }

      // Create SMS-friendly message (shorter)
      const smsMessage = `${
        notification.title
      }: ${notification.message.substring(0, 100)}...`;

      // In a real implementation, this would use an SMS service
      console.log("SMS notification sent to:", user.phone);

      return {
        success: true,
        message_id: `sms_${Date.now()}`,
        recipient: user.phone,
      };
    } catch (error) {
      console.error("SMS notification error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get user notification preferences
  static async getUserNotificationPreferences(userId) {
    try {
      const { data: prefs } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (prefs) {
        return prefs.preferences;
      }

      // Create default preferences
      const defaultPrefs = this.createDefaultNotificationPreferences();
      await this.updateUserNotificationPreferences(userId, defaultPrefs);

      return defaultPrefs;
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      return this.createDefaultNotificationPreferences();
    }
  }

  // Create default notification preferences
  static createDefaultNotificationPreferences() {
    const prefs = {
      push_enabled: true,
      email_enabled: true,
      sms_enabled: false,
      language: "en",
      quiet_hours: {
        enabled: true,
        start: "22:00",
        end: "07:00",
      },
      digest_frequency: "daily", // 'immediate', 'hourly', 'daily', 'weekly'
    };

    // Add preferences for each notification type
    Object.entries(NOTIFICATION_TYPES).forEach(([typeId, typeConfig]) => {
      prefs[typeId] = {
        enabled: typeConfig.default_enabled,
        sound_enabled: typeConfig.sound_enabled,
        vibration_enabled: typeConfig.vibration_enabled,
        delivery_methods: [DELIVERY_METHODS.PUSH, DELIVERY_METHODS.IN_APP],
      };
    });

    return prefs;
  }

  // Update user notification preferences
  static async updateUserNotificationPreferences(userId, preferences) {
    try {
      await supabase.from("user_notification_preferences").upsert([
        {
          user_id: userId,
          preferences: preferences,
          updated_at: new Date().toISOString(),
        },
      ]);

      return { success: true };
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      return { success: false, error: error.message };
    }
  }

  // Get user's notifications
  static async getUserNotifications(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      unread_only = false,
      type_filter = null,
    } = options;

    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId);

      if (unread_only) {
        query = query.eq("read", false);
      }

      if (type_filter) {
        query = query.eq("type", type_filter);
      }

      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: notifications, error } = await query;

      if (error) throw error;

      return {
        notifications: notifications || [],
        total: notifications?.length || 0,
        hasMore: notifications?.length === limit,
      };
    } catch (error) {
      console.error("Error getting user notifications:", error);
      return { notifications: [], total: 0, hasMore: false };
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId, userId) {
    try {
      await supabase
        .from("notifications")
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId)
        .eq("user_id", userId);

      return { success: true };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message };
    }
  }

  // Mark all notifications as read
  static async markAllNotificationsAsRead(userId) {
    try {
      await supabase
        .from("notifications")
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("read", false);

      return { success: true };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: error.message };
    }
  }

  // Get notification statistics
  static async getNotificationStats(userId) {
    try {
      const { data: stats } = await supabase
        .from("notifications")
        .select("type, read, created_at")
        .eq("user_id", userId);

      if (!stats?.length) return null;

      const total = stats.length;
      const unread = stats.filter((n) => !n.read).length;
      const thisWeek = stats.filter(
        (n) =>
          new Date(n.created_at) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;

      const typeBreakdown = {};
      stats.forEach((n) => {
        typeBreakdown[n.type] = (typeBreakdown[n.type] || 0) + 1;
      });

      return {
        total_notifications: total,
        unread_count: unread,
        notifications_this_week: thisWeek,
        read_rate:
          total > 0 ? (((total - unread) / total) * 100).toFixed(1) : 0,
        type_breakdown: typeBreakdown,
      };
    } catch (error) {
      console.error("Error getting notification stats:", error);
      return null;
    }
  }

  // Schedule digest notifications
  static async scheduleDigestNotifications() {
    try {
      // This would run periodically to send digest notifications
      // Get users who have digest enabled
      const { data: users } = await supabase
        .from("user_notification_preferences")
        .select("user_id, preferences")
        .neq("preferences->digest_frequency", "immediate");

      for (const user of users || []) {
        const digestFreq = user.preferences.digest_frequency;
        const shouldSendDigest = await this.shouldSendDigest(
          user.user_id,
          digestFreq
        );

        if (shouldSendDigest) {
          await this.sendDigestNotification(user.user_id, digestFreq);
        }
      }
    } catch (error) {
      console.error("Error scheduling digest notifications:", error);
    }
  }

  // Check if digest should be sent
  static async shouldSendDigest(userId, frequency) {
    try {
      const { data: lastDigest } = await supabase
        .from("notification_digests")
        .select("sent_at")
        .eq("user_id", userId)
        .eq("frequency", frequency)
        .order("sent_at", { ascending: false })
        .limit(1)
        .single();

      const now = new Date();
      const lastSent = lastDigest ? new Date(lastDigest.sent_at) : new Date(0);

      switch (frequency) {
        case "hourly":
          return now - lastSent >= 60 * 60 * 1000;
        case "daily":
          return now - lastSent >= 24 * 60 * 60 * 1000;
        case "weekly":
          return now - lastSent >= 7 * 24 * 60 * 60 * 1000;
        default:
          return false;
      }
    } catch (error) {
      console.error("Error checking digest schedule:", error);
      return false;
    }
  }

  // Send digest notification
  static async sendDigestNotification(userId, frequency) {
    try {
      // Get unread notifications for digest
      const { data: unreadNotifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!unreadNotifications?.length) return;

      const digestContent = this.createDigestContent(
        unreadNotifications,
        frequency
      );

      await this.sendNotification(userId, "digest", digestContent, {
        priority: "low",
        deliveryMethods: [DELIVERY_METHODS.IN_APP, DELIVERY_METHODS.EMAIL],
      });

      // Record digest sent
      await supabase.from("notification_digests").insert([
        {
          user_id: userId,
          frequency: frequency,
          notification_count: unreadNotifications.length,
          sent_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error sending digest notification:", error);
    }
  }

  // Create digest content
  static createDigestContent(notifications, frequency) {
    const count = notifications.length;
    const types = [...new Set(notifications.map((n) => n.type))];

    return {
      title: `Your ${frequency} news digest`,
      summary: `${count} updates including ${types.slice(0, 3).join(", ")}`,
      notifications: notifications.slice(0, 5),
      total_count: count,
    };
  }

  // Get available notification types
  static getNotificationTypes() {
    return Object.entries(NOTIFICATION_TYPES).map(([id, config]) => ({
      id,
      ...config,
    }));
  }
}
