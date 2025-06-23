import { supabase } from "../lib/supabase";
import { DatabaseService } from "./databaseService";

// Offline storage configuration
const OFFLINE_CONFIG = {
  MAX_ARTICLES_STORED: 100,
  CACHE_DURATION_HOURS: 24,
  IMAGES_CACHE_SIZE_MB: 50,
  AUDIO_CACHE_SIZE_MB: 30,
  TRANSLATIONS_CACHE_SIZE_MB: 20,
  PRIORITY_CATEGORIES: ["security", "health", "governance", "emergency"],
  DATA_SAVER_IMAGE_QUALITY: 0.6,
  DATA_SAVER_THUMBNAIL_SIZE: 150, // pixels
};

// IndexedDB configuration for offline storage
const DB_NAME = "NairobellNewsOffline";
const DB_VERSION = 1;
const STORES = {
  ARTICLES: "articles",
  IMAGES: "images",
  AUDIO: "audio",
  TRANSLATIONS: "translations",
  USER_PREFERENCES: "userPreferences",
  READING_QUEUE: "readingQueue",
};

export class OfflineService {
  static db = null;

  // Initialize offline database
  static async initializeDatabase() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Articles store
        if (!db.objectStoreNames.contains(STORES.ARTICLES)) {
          const articlesStore = db.createObjectStore(STORES.ARTICLES, {
            keyPath: "id",
          });
          articlesStore.createIndex("category", "category", { unique: false });
          articlesStore.createIndex("country", "country_focus", {
            unique: false,
          });
          articlesStore.createIndex("cached_at", "cached_at", {
            unique: false,
          });
          articlesStore.createIndex("priority", "priority", { unique: false });
        }

        // Images store
        if (!db.objectStoreNames.contains(STORES.IMAGES)) {
          const imagesStore = db.createObjectStore(STORES.IMAGES, {
            keyPath: "url",
          });
          imagesStore.createIndex("cached_at", "cached_at", { unique: false });
          imagesStore.createIndex("size", "size", { unique: false });
        }

        // Audio store
        if (!db.objectStoreNames.contains(STORES.AUDIO)) {
          const audioStore = db.createObjectStore(STORES.AUDIO, {
            keyPath: "id",
          });
          audioStore.createIndex("article_id", "article_id", { unique: false });
          audioStore.createIndex("language", "language", { unique: false });
        }

        // Translations store
        if (!db.objectStoreNames.contains(STORES.TRANSLATIONS)) {
          const translationsStore = db.createObjectStore(STORES.TRANSLATIONS, {
            keyPath: "id",
          });
          translationsStore.createIndex("article_id", "article_id", {
            unique: false,
          });
          translationsStore.createIndex("language", "target_language", {
            unique: false,
          });
        }

        // User preferences store
        if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
          db.createObjectStore(STORES.USER_PREFERENCES, { keyPath: "key" });
        }

        // Reading queue store
        if (!db.objectStoreNames.contains(STORES.READING_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.READING_QUEUE, {
            keyPath: "id",
          });
          queueStore.createIndex("added_at", "added_at", { unique: false });
          queueStore.createIndex("priority", "priority", { unique: false });
        }
      };
    });
  }

  // Cache articles for offline reading
  static async cacheArticlesForOffline(articles, userPreferences = {}) {
    try {
      await this.initializeDatabase();
      const transaction = this.db.transaction(
        [STORES.ARTICLES, STORES.IMAGES],
        "readwrite"
      );
      const articlesStore = transaction.objectStore(STORES.ARTICLES);
      const imagesStore = transaction.objectStore(STORES.IMAGES);

      const cached = [];
      const now = new Date().toISOString();

      for (const article of articles) {
        try {
          // Determine priority based on user preferences and content
          const priority = this.calculateArticlePriority(
            article,
            userPreferences
          );

          // Prepare article for offline storage
          const offlineArticle = {
            ...article,
            cached_at: now,
            priority: priority,
            offline_content: await this.prepareOfflineContent(
              article,
              userPreferences.dataSaver
            ),
            reading_time_estimate: this.calculateReadingTime(article.content),
            data_size: this.estimateDataSize(article),
          };

          // Remove large fields if in data saver mode
          if (userPreferences.dataSaver) {
            delete offlineArticle.content; // Keep only summary
            delete offlineArticle.thumbnail; // Will cache compressed version separately
          }

          await articlesStore.put(offlineArticle);

          // Cache thumbnail if not in data saver mode
          if (article.thumbnail && !userPreferences.dataSaver) {
            await this.cacheImage(
              article.thumbnail,
              imagesStore,
              userPreferences.dataSaver
            );
          }

          cached.push(article.id);
        } catch (error) {
          console.error(`Error caching article ${article.id}:`, error);
        }
      }

      // Clean up old cached articles
      await this.cleanupOldCache();

      return {
        cached_count: cached.length,
        total_size: await this.getCacheSize(),
        cached_articles: cached,
      };
    } catch (error) {
      console.error("Error caching articles for offline:", error);
      return { cached_count: 0, total_size: 0, cached_articles: [] };
    }
  }

  // Calculate article priority for offline caching
  static calculateArticlePriority(article, userPreferences) {
    let priority = 0;

    // Base priority from engagement score
    priority += (article.engagement_score || 0) * 0.1;

    // High priority for urgent categories
    if (OFFLINE_CONFIG.PRIORITY_CATEGORIES.includes(article.category)) {
      priority += 5;
    }

    // Local content gets higher priority
    if (article.country_focus?.includes(userPreferences.country)) {
      priority += 3;
    }

    // User's preferred categories
    if (userPreferences.preferred_categories?.includes(article.category)) {
      priority += 2;
    }

    // Recent articles get priority
    const hoursOld =
      (Date.now() - new Date(article.published_at)) / (1000 * 60 * 60);
    if (hoursOld < 6) priority += 2;
    else if (hoursOld < 24) priority += 1;

    // Trending articles
    if (article.is_trending) priority += 2;

    return Math.min(priority, 10); // Cap at 10
  }

  // Prepare content for offline storage
  static async prepareOfflineContent(article, dataSaver = false) {
    const offlineContent = {
      title: article.title,
      description: article.description,
      summary: article.description, // Will be enhanced with AI summary
    };

    // In data saver mode, use only summary
    if (dataSaver) {
      return offlineContent;
    }

    // Full content for normal mode
    offlineContent.full_content = article.content;

    // Generate offline-optimized summary if content is long
    if (article.content && article.content.length > 1000) {
      try {
        // This would use the AI service to create a shorter summary
        offlineContent.short_summary = this.extractFirstParagraph(
          article.content
        );
      } catch (error) {
        console.warn("Error generating offline summary:", error);
      }
    }

    return offlineContent;
  }

  // Cache image with compression for data efficiency
  static async cacheImage(imageUrl, imagesStore, dataSaver = false) {
    try {
      // Check if already cached
      const existing = await imagesStore.get(imageUrl);
      if (existing) return existing;

      // Fetch and optionally compress image
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to fetch image");

      let imageBlob = await response.blob();

      // Compress image if in data saver mode
      if (dataSaver) {
        imageBlob = await this.compressImage(imageBlob);
      }

      const cachedImage = {
        url: imageUrl,
        blob: imageBlob,
        size: imageBlob.size,
        cached_at: new Date().toISOString(),
        compressed: dataSaver,
      };

      await imagesStore.put(cachedImage);
      return cachedImage;
    } catch (error) {
      console.error("Error caching image:", error);
      return null;
    }
  }

  // Compress image for data efficiency
  static async compressImage(imageBlob) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const maxSize = OFFLINE_CONFIG.DATA_SAVER_THUMBNAIL_SIZE;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          resolve,
          "image/jpeg",
          OFFLINE_CONFIG.DATA_SAVER_IMAGE_QUALITY
        );
      };

      img.src = URL.createObjectURL(imageBlob);
    });
  }

  // Get cached articles for offline reading
  static async getCachedArticles(filters = {}) {
    try {
      await this.initializeDatabase();
      const transaction = this.db.transaction([STORES.ARTICLES], "readonly");
      const store = transaction.objectStore(STORES.ARTICLES);

      let articles = [];

      if (filters.category) {
        const index = store.index("category");
        articles = await this.getAllFromIndex(index, filters.category);
      } else {
        articles = await this.getAllFromStore(store);
      }

      // Sort by priority and cache date
      articles.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return new Date(b.cached_at) - new Date(a.cached_at);
      });

      // Apply limit
      if (filters.limit) {
        articles = articles.slice(0, filters.limit);
      }

      return {
        articles,
        total_cached: articles.length,
        cache_info: await this.getCacheInfo(),
      };
    } catch (error) {
      console.error("Error getting cached articles:", error);
      return { articles: [], total_cached: 0, cache_info: null };
    }
  }

  // Add article to reading queue
  static async addToReadingQueue(articleId, priority = "medium") {
    try {
      await this.initializeDatabase();
      const transaction = this.db.transaction(
        [STORES.READING_QUEUE],
        "readwrite"
      );
      const store = transaction.objectStore(STORES.READING_QUEUE);

      const queueItem = {
        id: `queue_${articleId}_${Date.now()}`,
        article_id: articleId,
        added_at: new Date().toISOString(),
        priority: priority,
        read: false,
      };

      await store.put(queueItem);
      return queueItem;
    } catch (error) {
      console.error("Error adding to reading queue:", error);
      return null;
    }
  }

  // Get reading queue
  static async getReadingQueue() {
    try {
      await this.initializeDatabase();
      const transaction = this.db.transaction(
        [STORES.READING_QUEUE, STORES.ARTICLES],
        "readonly"
      );
      const queueStore = transaction.objectStore(STORES.READING_QUEUE);
      const articlesStore = transaction.objectStore(STORES.ARTICLES);

      const queueItems = await this.getAllFromStore(queueStore);
      const articlesWithQueue = [];

      for (const item of queueItems.filter((i) => !i.read)) {
        const article = await articlesStore.get(item.article_id);
        if (article) {
          articlesWithQueue.push({
            ...article,
            queue_info: {
              id: item.id,
              added_at: item.added_at,
              priority: item.priority,
            },
          });
        }
      }

      // Sort by priority then by date added
      articlesWithQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.queue_info.priority] || 2;
        const bPriority = priorityOrder[b.queue_info.priority] || 2;

        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        return (
          new Date(a.queue_info.added_at) - new Date(b.queue_info.added_at)
        );
      });

      return articlesWithQueue;
    } catch (error) {
      console.error("Error getting reading queue:", error);
      return [];
    }
  }

  // Mark article as read in queue
  static async markQueueItemAsRead(queueItemId) {
    try {
      await this.initializeDatabase();
      const transaction = this.db.transaction(
        [STORES.READING_QUEUE],
        "readwrite"
      );
      const store = transaction.objectStore(STORES.READING_QUEUE);

      const item = await store.get(queueItemId);
      if (item) {
        item.read = true;
        item.read_at = new Date().toISOString();
        await store.put(item);
      }

      return true;
    } catch (error) {
      console.error("Error marking queue item as read:", error);
      return false;
    }
  }

  // Cache audio for offline listening
  static async cacheAudioForArticle(articleId, audioBlob, language = "en") {
    try {
      await this.initializeDatabase();
      const transaction = this.db.transaction([STORES.AUDIO], "readwrite");
      const store = transaction.objectStore(STORES.AUDIO);

      const audioData = {
        id: `audio_${articleId}_${language}`,
        article_id: articleId,
        language: language,
        blob: audioBlob,
        size: audioBlob.size,
        cached_at: new Date().toISOString(),
      };

      await store.put(audioData);
      return audioData;
    } catch (error) {
      console.error("Error caching audio:", error);
      return null;
    }
  }

  // Get cached audio for article
  static async getCachedAudio(articleId, language = "en") {
    try {
      await this.initializeDatabase();
      const transaction = this.db.transaction([STORES.AUDIO], "readonly");
      const store = transaction.objectStore(STORES.AUDIO);

      const audioId = `audio_${articleId}_${language}`;
      const audioData = await store.get(audioId);

      return audioData || null;
    } catch (error) {
      console.error("Error getting cached audio:", error);
      return null;
    }
  }

  // Cache translation for offline use
  static async cacheTranslation(articleId, targetLanguage, translatedContent) {
    try {
      await this.initializeDatabase();
      const transaction = this.db.transaction(
        [STORES.TRANSLATIONS],
        "readwrite"
      );
      const store = transaction.objectStore(STORES.TRANSLATIONS);

      const translationData = {
        id: `translation_${articleId}_${targetLanguage}`,
        article_id: articleId,
        target_language: targetLanguage,
        translated_title: translatedContent.title,
        translated_description: translatedContent.description,
        translated_content: translatedContent.content,
        cached_at: new Date().toISOString(),
      };

      await store.put(translationData);
      return translationData;
    } catch (error) {
      console.error("Error caching translation:", error);
      return null;
    }
  }

  // Get cached translation
  static async getCachedTranslation(articleId, targetLanguage) {
    try {
      await this.initializeDatabase();
      const transaction = this.db.transaction(
        [STORES.TRANSLATIONS],
        "readonly"
      );
      const store = transaction.objectStore(STORES.TRANSLATIONS);

      const translationId = `translation_${articleId}_${targetLanguage}`;
      const translation = await store.get(translationId);

      return translation || null;
    } catch (error) {
      console.error("Error getting cached translation:", error);
      return null;
    }
  }

  // Get cache information
  static async getCacheInfo() {
    try {
      await this.initializeDatabase();

      const sizes = await Promise.all([
        this.getStoreSize(STORES.ARTICLES),
        this.getStoreSize(STORES.IMAGES),
        this.getStoreSize(STORES.AUDIO),
        this.getStoreSize(STORES.TRANSLATIONS),
      ]);

      const [articlesSize, imagesSize, audioSize, translationsSize] = sizes;
      const totalSize =
        articlesSize + imagesSize + audioSize + translationsSize;

      return {
        total_size_mb: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
        articles_size_mb:
          Math.round((articlesSize / (1024 * 1024)) * 100) / 100,
        images_size_mb: Math.round((imagesSize / (1024 * 1024)) * 100) / 100,
        audio_size_mb: Math.round((audioSize / (1024 * 1024)) * 100) / 100,
        translations_size_mb:
          Math.round((translationsSize / (1024 * 1024)) * 100) / 100,
        articles_count: await this.getStoreCount(STORES.ARTICLES),
        images_count: await this.getStoreCount(STORES.IMAGES),
        audio_count: await this.getStoreCount(STORES.AUDIO),
        translations_count: await this.getStoreCount(STORES.TRANSLATIONS),
      };
    } catch (error) {
      console.error("Error getting cache info:", error);
      return null;
    }
  }

  // Clean up old cached content
  static async cleanupOldCache() {
    try {
      await this.initializeDatabase();
      const cutoffDate = new Date(
        Date.now() - OFFLINE_CONFIG.CACHE_DURATION_HOURS * 60 * 60 * 1000
      );

      // Clean up old articles
      await this.cleanupStoreByDate(STORES.ARTICLES, cutoffDate);
      await this.cleanupStoreByDate(STORES.IMAGES, cutoffDate);
      await this.cleanupStoreByDate(STORES.AUDIO, cutoffDate);
      await this.cleanupStoreByDate(STORES.TRANSLATIONS, cutoffDate);

      // Ensure we don't exceed max articles limit
      await this.enforceArticleLimit();

      return true;
    } catch (error) {
      console.error("Error cleaning up cache:", error);
      return false;
    }
  }

  // Cleanup store by date
  static async cleanupStoreByDate(storeName, cutoffDate) {    const transaction = this.db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const index = store.index("cached_at");

    const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
    let cursor = await index.openCursor(range);

    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
  }

  // Enforce article limit
  static async enforceArticleLimit() {
    const transaction = this.db.transaction([STORES.ARTICLES], "readwrite");
    const store = transaction.objectStore(STORES.ARTICLES);
    const index = store.index("cached_at");

    const articles = await this.getAllFromStore(store);

    if (articles.length > OFFLINE_CONFIG.MAX_ARTICLES_STORED) {
      // Sort by priority and date, keep the best ones
      articles.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return new Date(b.cached_at) - new Date(a.cached_at);
      });

      // Delete excess articles
      const toDelete = articles.slice(OFFLINE_CONFIG.MAX_ARTICLES_STORED);
      for (const article of toDelete) {
        await store.delete(article.id);
      }
    }
  }

  // Utility methods
  static async getAllFromStore(store) {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getAllFromIndex(index, key) {
    return new Promise((resolve, reject) => {
      const request = index.getAll(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getStoreSize(storeName) {
    const transaction = this.db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const items = await this.getAllFromStore(store);

    return items.reduce((total, item) => {
      let size = 0;
      if (item.blob) size += item.blob.size;
      if (item.size) size += item.size;
      if (item.data_size) size += item.data_size;
      return total + size;
    }, 0);
  }

  static async getStoreCount(storeName) {
    const transaction = this.db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static calculateReadingTime(content) {
    if (!content) return 0;
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  static estimateDataSize(article) {
    let size = 0;
    if (article.title) size += article.title.length * 2; // UTF-16
    if (article.description) size += article.description.length * 2;
    if (article.content) size += article.content.length * 2;
    return size;
  }

  static extractFirstParagraph(content) {
    const paragraphs = content.split("\n").filter((p) => p.trim().length > 0);
    return paragraphs[0] || content.substring(0, 200) + "...";
  }

  // Sync offline changes when back online
  static async syncOfflineChanges(userId) {
    try {
      if (!navigator.onLine) return false;

      // Get offline reading activities
      const offlineActivities = await this.getOfflineReadingActivities();

      // Sync reading history
      for (const activity of offlineActivities) {
        try {
          await supabase.from("reading_history").insert([
            {
              user_id: userId,
              post_id: activity.article_id,
              interaction_type: activity.type,
              read_duration: activity.duration,
              read_percentage: activity.percentage,
              created_at: activity.timestamp,
              offline_read: true,
            },
          ]);
        } catch (error) {
          console.error("Error syncing offline activity:", error);
        }
      }

      // Clear synced activities
      await this.clearOfflineActivities();

      return true;
    } catch (error) {
      console.error("Error syncing offline changes:", error);
      return false;
    }
  }

  // Store offline reading activity
  static async storeOfflineActivity(articleId, activity) {
    try {
      const activities = JSON.parse(
        localStorage.getItem("offline_activities") || "[]"
      );
      activities.push({
        article_id: articleId,
        type: activity.type,
        duration: activity.duration,
        percentage: activity.percentage,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("offline_activities", JSON.stringify(activities));
    } catch (error) {
      console.error("Error storing offline activity:", error);
    }
  }

  static async getOfflineReadingActivities() {
    try {
      return JSON.parse(localStorage.getItem("offline_activities") || "[]");
    } catch (error) {
      console.error("Error getting offline activities:", error);
      return [];
    }
  }

  static async clearOfflineActivities() {
    try {
      localStorage.removeItem("offline_activities");
    } catch (error) {
      console.error("Error clearing offline activities:", error);
    }
  }

  // Check if device is in data saver mode
  static isDataSaverMode() {
    // Check user preferences or device settings
    const userDataSaver = localStorage.getItem("data_saver_mode") === "true";

    // Check network connection type if available
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    const isSlowConnection =
      connection &&
      (connection.effectiveType === "slow-2g" ||
        connection.effectiveType === "2g");

    return userDataSaver || isSlowConnection;
  }

  // Set data saver preference
  static setDataSaverMode(enabled) {
    localStorage.setItem("data_saver_mode", enabled.toString());
  }
}
