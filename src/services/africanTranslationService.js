import { EnhancedGeminiService } from "./enhancedGeminiService";
import { OfflineService } from "./offlineService";
import { supabase } from "../lib/supabase";

// Comprehensive African languages with cultural context
const AFRICAN_LANGUAGES = {
  // East Africa
  sw: {
    name: "Kiswahili",
    englishName: "Swahili",
    countries: ["kenya", "tanzania", "uganda", "rwanda", "burundi", "drc"],
    speakers: 200000000,
    script: "latin",
    cultural_context:
      "Lingua franca of East Africa, emphasizes Ubuntu philosophy",
    common_greetings: ["Habari", "Mambo", "Hujambo"],
    formal_register: true,
    news_terminology: {
      breaking_news: "Habari za haraka",
      politics: "Siasa",
      economy: "Uchumi",
      health: "Afya",
      education: "Elimu",
    },
  },
  am: {
    name: "አማርኛ",
    englishName: "Amharic",
    countries: ["ethiopia"],
    speakers: 57000000,
    script: "ethiopic",
    cultural_context: "Official language of Ethiopia, rich literary tradition",
    common_greetings: ["ሰላም", "እንደምን ነህ"],
    formal_register: true,
    news_terminology: {
      breaking_news: "አዲስ ዜና",
      politics: "ፖለቲካ",
      economy: "ኢኮኖሚ",
      health: "ጤና",
      education: "ትምህርት",
    },
  },
  om: {
    name: "Afaan Oromoo",
    englishName: "Oromo",
    countries: ["ethiopia"],
    speakers: 40000000,
    script: "latin",
    cultural_context: "Largest ethnic group in Ethiopia, strong oral tradition",
    common_greetings: ["Akkam", "Nagaatti"],
    formal_register: true,
  },
  ti: {
    name: "ትግርኛ",
    englishName: "Tigrinya",
    countries: ["ethiopia", "eritrea"],
    speakers: 9000000,
    script: "ethiopic",
    cultural_context: "Northern Ethiopia and Eritrea, highlands culture",
    common_greetings: ["ሰላም", "ከመይ ኣለኻ"],
    formal_register: true,
  },

  // West Africa
  yo: {
    name: "Yorùbá",
    englishName: "Yoruba",
    countries: ["nigeria", "benin", "togo"],
    speakers: 50000000,
    script: "latin",
    cultural_context:
      "Rich cultural heritage, traditional kingdoms, artistic traditions",
    common_greetings: ["Ẹ káàárọ̀", "Báwo ni", "Ẹ kú àálẹ́"],
    formal_register: true,
    tonal: true,
    news_terminology: {
      breaking_news: "Ìròyìn tuntun",
      politics: "Ìṣèlú",
      economy: "Eto-ọrọ̀",
      health: "Ìlera",
      education: "Ẹ̀kọ́",
    },
  },
  ha: {
    name: "هَرْشَن هَوْسَ",
    englishName: "Hausa",
    countries: ["nigeria", "niger", "chad", "ghana"],
    speakers: 70000000,
    script: "latin", // Also Arabic script (Ajami)
    cultural_context: "Trade language of West Africa, Islamic influence",
    common_greetings: ["Sannu", "Ina kwana", "Barka da safiya"],
    formal_register: true,
    news_terminology: {
      breaking_news: "Sabon labari",
      politics: "Siyasa",
      economy: "Tattalin arziki",
      health: "Lafiya",
      education: "Ilimi",
    },
  },
  ig: {
    name: "Igbo",
    englishName: "Igbo",
    countries: ["nigeria"],
    speakers: 27000000,
    script: "latin",
    cultural_context: "Southeastern Nigeria, republican social structure",
    common_greetings: ["Ndewo", "Kedụ", "Ụtụtụ ọma"],
    formal_register: true,
    tonal: true,
  },
  ff: {
    name: "Fulfulde",
    englishName: "Fulani/Fula",
    countries: [
      "senegal",
      "mali",
      "burkina-faso",
      "niger",
      "guinea",
      "cameroon",
      "nigeria",
    ],
    speakers: 25000000,
    script: "latin",
    cultural_context: "Pastoral nomadic culture, spread across Sahel",
    common_greetings: ["Assalamu alaikum", "Jam tan"],
    formal_register: true,
  },

  // Southern Africa
  zu: {
    name: "isiZulu",
    englishName: "Zulu",
    countries: ["south-africa", "zimbabwe"],
    speakers: 12000000,
    script: "latin",
    cultural_context: "Largest ethnic group in South Africa, strong traditions",
    common_greetings: ["Sawubona", "Unjani", "Ngiyakwemukela"],
    formal_register: true,
    news_terminology: {
      breaking_news: "Izindaba ezisha",
      politics: "Ezepolitiki",
      economy: "Umnotho",
      health: "Ezempilo",
      education: "Imfundo",
    },
  },
  xh: {
    name: "isiXhosa",
    englishName: "Xhosa",
    countries: ["south-africa"],
    speakers: 8000000,
    script: "latin",
    cultural_context:
      "Eastern Cape, clicking sounds, Nelson Mandela's language",
    common_greetings: ["Molo", "Unjani", "Ndiyakwamkela"],
    formal_register: true,
    click_sounds: true,
  },
  af: {
    name: "Afrikaans",
    englishName: "Afrikaans",
    countries: ["south-africa", "namibia"],
    speakers: 7000000,
    script: "latin",
    cultural_context: "Evolved from Dutch, rainbow nation language",
    common_greetings: ["Hallo", "Goeie môre", "Hoe gaan dit"],
    formal_register: true,
  },
  st: {
    name: "Sesotho",
    englishName: "Sotho",
    countries: ["south-africa", "lesotho"],
    speakers: 6000000,
    script: "latin",
    cultural_context: "Mountain kingdom of Lesotho, highlands culture",
    common_greetings: ["Dumela", "O phela joang"],
    formal_register: true,
  },

  // Francophone Africa
  wo: {
    name: "Wolof",
    englishName: "Wolof",
    countries: ["senegal", "gambia"],
    speakers: 5000000,
    script: "latin",
    cultural_context: "Senegal's lingua franca, Islamic culture",
    common_greetings: ["As-salâmu alaykum", "Nanga def"],
    formal_register: true,
  },
  bm: {
    name: "Bamanankan",
    englishName: "Bambara",
    countries: ["mali"],
    speakers: 6000000,
    script: "latin",
    cultural_context: "Trade language of Mali, Mande culture",
    common_greetings: ["I ni sɔgɔma", "I ka kene wa"],
    formal_register: true,
  },

  // North Africa (Arabic variants)
  "ar-eg": {
    name: "العربية المصرية",
    englishName: "Egyptian Arabic",
    countries: ["egypt"],
    speakers: 100000000,
    script: "arabic",
    cultural_context: "Cultural center of Arab world, media influence",
    common_greetings: ["السلام عليكم", "أهلا وسهلا"],
    formal_register: true,
    dialect: true,
  },
  "ar-ma": {
    name: "الدارجة المغربية",
    englishName: "Moroccan Arabic",
    countries: ["morocco"],
    speakers: 35000000,
    script: "arabic",
    cultural_context: "Berber and Arab influence, Maghreb culture",
    common_greetings: ["السلام عليكم", "أهلا"],
    formal_register: true,
    dialect: true,
  },
};

// Translation quality levels
const TRANSLATION_QUALITY = {
  BASIC: "basic", // Simple word-for-word translation
  STANDARD: "standard", // Grammatically correct translation
  ENHANCED: "enhanced", // Cultural context and localization
  PREMIUM: "premium", // Native-level with cultural nuances
};

export class AfricanTranslationService {
  // Translate content to African language with cultural context
  static async translateContent(content, targetLanguage, options = {}) {
    const {
      quality = TRANSLATION_QUALITY.STANDARD,
      sourceLanguage = "en",
      preserveFormatting = true,
      culturalAdaptation = true,
      newsContext = true,
      cacheOffline = true,
    } = options;

    try {
      // Check if target language is supported
      const langInfo = AFRICAN_LANGUAGES[targetLanguage];
      if (!langInfo) {
        throw new Error(`Unsupported African language: ${targetLanguage}`);
      }

      // Check for cached translation offline first
      if (cacheOffline && content.id) {
        const cachedTranslation = await OfflineService.getCachedTranslation(
          content.id,
          targetLanguage
        );
        if (cachedTranslation) {
          return {
            ...cachedTranslation,
            source: "cache",
            quality: "cached",
          };
        }
      }

      // Build culturally-aware translation prompt
      const translationPrompt = this.buildTranslationPrompt(
        content,
        langInfo,
        sourceLanguage,
        quality,
        culturalAdaptation,
        newsContext
      );

      // Perform AI translation
      const translation =
        await EnhancedGeminiService.translateWithAfricanContext(
          translationPrompt
        );

      // Post-process translation
      const processedTranslation = await this.postProcessTranslation(
        translation,
        langInfo,
        preserveFormatting
      );

      // Cache translation for offline use
      if (cacheOffline && content.id) {
        await OfflineService.cacheTranslation(
          content.id,
          targetLanguage,
          processedTranslation
        );
      }

      // Store in database for future use
      await this.saveTranslationToDatabase(
        content,
        targetLanguage,
        processedTranslation,
        quality
      );

      return {
        ...processedTranslation,
        target_language: targetLanguage,
        source_language: sourceLanguage,
        quality: quality,
        cultural_notes: translation.cultural_notes,
        translation_confidence: translation.confidence_score || 0.8,
        language_info: langInfo,
      };
    } catch (error) {
      console.error("Translation error:", error);
      return {
        error: error.message,
        fallback_translation: await this.getFallbackTranslation(
          content,
          targetLanguage
        ),
      };
    }
  }

  // Build culturally-aware translation prompt
  static buildTranslationPrompt(
    content,
    langInfo,
    sourceLanguage,
    quality,
    culturalAdaptation,
    newsContext
  ) {
    const basePrompt = `
    You are an expert translator specializing in African languages and cultures. 
    Translate the following ${sourceLanguage} content to ${
      langInfo.englishName
    } (${langInfo.name}).

    Language Context:
    - Target Language: ${langInfo.englishName} (${langInfo.name})
    - Countries: ${langInfo.countries.join(", ")}
    - Speakers: ${langInfo.speakers.toLocaleString()}
    - Script: ${langInfo.script}
    - Cultural Context: ${langInfo.cultural_context}
    ${
      langInfo.tonal
        ? "- This is a tonal language - pay attention to tone markers"
        : ""
    }
    ${langInfo.click_sounds ? "- This language includes click sounds" : ""}
    ${
      langInfo.formal_register
        ? "- Use formal register appropriate for news content"
        : ""
    }
    `;

    let qualityInstructions = "";
    switch (quality) {
      case TRANSLATION_QUALITY.BASIC:
        qualityInstructions =
          "Provide a simple, direct translation focusing on accuracy.";
        break;
      case TRANSLATION_QUALITY.STANDARD:
        qualityInstructions =
          "Provide grammatically correct translation with proper sentence structure.";
        break;
      case TRANSLATION_QUALITY.ENHANCED:
        qualityInstructions =
          "Provide culturally appropriate translation with local context and expressions.";
        break;
      case TRANSLATION_QUALITY.PREMIUM:
        qualityInstructions =
          "Provide native-level translation with cultural nuances, local expressions, and perfect fluency.";
        break;
    }

    const culturalInstructions = culturalAdaptation
      ? `
    Cultural Adaptation Guidelines:
    - Use culturally appropriate expressions and idioms
    - Adapt concepts that may not exist in the target culture
    - Use local examples and references where appropriate
    - Respect cultural sensitivities and values
    - Use appropriate greetings and honorifics: ${langInfo.common_greetings?.join(
      ", "
    )}
    `
      : "";

    const newsInstructions =
      newsContext && langInfo.news_terminology
        ? `
    News Terminology:
    - Breaking News: ${
      langInfo.news_terminology.breaking_news || "breaking news"
    }
    - Politics: ${langInfo.news_terminology.politics || "politics"}
    - Economy: ${langInfo.news_terminology.economy || "economy"}
    - Health: ${langInfo.news_terminology.health || "health"}
    - Education: ${langInfo.news_terminology.education || "education"}
    Use these terms appropriately in news contexts.
    `
        : "";

    const contentToTranslate = `
    Content to translate:
    Title: ${content.title || ""}
    ${content.description ? `Description: ${content.description}` : ""}
    ${content.content ? `Content: ${content.content}` : ""}
    `;

    const outputFormat = `
    Return JSON with:
    {
      "translated_title": "translated title",
      "translated_description": "translated description",
      "translated_content": "translated full content (if provided)",
      "cultural_notes": "any cultural adaptations made",
      "confidence_score": 0.0-1.0,
      "dialect_notes": "any dialect-specific considerations",
      "pronunciation_guide": "for difficult terms (if helpful)"
    }
    `;

    return (
      basePrompt +
      qualityInstructions +
      culturalInstructions +
      newsInstructions +
      contentToTranslate +
      outputFormat
    );
  }

  // Post-process translation for quality and formatting
  static async postProcessTranslation(
    translation,
    langInfo,
    preserveFormatting
  ) {
    try {
      let processed = { ...translation };

      // Handle right-to-left scripts
      if (langInfo.script === "arabic") {
        processed = this.applyRTLFormatting(processed);
      }

      // Handle Ethiopic script
      if (langInfo.script === "ethiopic") {
        processed = this.applyEthiopicFormatting(processed);
      }

      // Handle tonal languages
      if (langInfo.tonal) {
        processed = this.applyTonalMarking(processed, langInfo);
      }

      // Preserve formatting if requested
      if (preserveFormatting) {
        processed = this.preserveContentFormatting(processed);
      }

      return processed;
    } catch (error) {
      console.error("Post-processing error:", error);
      return translation;
    }
  }

  // Apply RTL formatting for Arabic scripts
  static applyRTLFormatting(translation) {
    return {
      ...translation,
      text_direction: "rtl",
      formatted_title: `<span dir="rtl">${translation.translated_title}</span>`,
      formatted_description: `<span dir="rtl">${translation.translated_description}</span>`,
      formatted_content: translation.translated_content
        ? `<div dir="rtl">${translation.translated_content}</div>`
        : null,
    };
  }

  // Apply Ethiopic script formatting
  static applyEthiopicFormatting(translation) {
    return {
      ...translation,
      script: "ethiopic",
      font_family: "Noto Sans Ethiopic, serif",
      text_direction: "ltr",
    };
  }

  // Apply tonal marking for tonal languages
  static applyTonalMarking(translation, langInfo) {
    // This would include proper tone marking for languages like Yoruba
    if (langInfo.englishName === "Yoruba") {
      // Add proper tone marks if missing
      // This is a simplified example - real implementation would be more sophisticated
      return {
        ...translation,
        tonal_marked: true,
        pronunciation_notes:
          translation.pronunciation_guide ||
          "Please check tone marks for accurate pronunciation",
      };
    }
    return translation;
  }

  // Preserve content formatting
  static preserveContentFormatting(translation) {
    // Preserve paragraph breaks, lists, etc.
    if (translation.translated_content) {
      translation.translated_content = translation.translated_content
        .replace(/\n\n/g, "<br><br>")
        .replace(/\n/g, "<br>");
    }
    return translation;
  }

  // Get available African languages for user
  static getAvailableLanguages(userCountry = null) {
    const languages = Object.entries(AFRICAN_LANGUAGES).map(([code, info]) => ({
      code,
      name: info.name,
      englishName: info.englishName,
      countries: info.countries,
      speakers: info.speakers,
      script: info.script,
      isLocal: userCountry ? info.countries.includes(userCountry) : false,
      hasNewsTerminology: !!info.news_terminology,
      complexity: this.getLanguageComplexity(info),
    }));

    // Sort by relevance to user, then by speaker count
    return languages.sort((a, b) => {
      if (a.isLocal && !b.isLocal) return -1;
      if (!a.isLocal && b.isLocal) return 1;
      return b.speakers - a.speakers;
    });
  }

  // Get language complexity level
  static getLanguageComplexity(langInfo) {
    let complexity = 1;

    if (langInfo.tonal) complexity += 1;
    if (langInfo.click_sounds) complexity += 1;
    if (langInfo.script !== "latin") complexity += 1;
    if (langInfo.dialect) complexity += 0.5;

    return Math.min(complexity, 5);
  }

  // Translate news summary for quick consumption
  static async translateNewsSummary(articles, targetLanguage, maxLength = 500) {
    try {
      const langInfo = AFRICAN_LANGUAGES[targetLanguage];
      if (!langInfo) throw new Error("Unsupported language");

      // Create a summary of top articles
      const summary = articles
        .slice(0, 5)
        .map(
          (article) =>
            `• ${article.title}: ${article.description?.substring(0, 100)}...`
        )
        .join("\n");

      const summaryPrompt = `
      Create a concise news summary in ${
        langInfo.englishName
      } for these top stories:
      
      ${summary}
      
      Guidelines:
      - Maximum ${maxLength} characters
      - Use ${langInfo.englishName} news terminology
      - Make it suitable for audio reading
      - Focus on most important information
      - Use cultural context appropriate for ${langInfo.countries.join(", ")}
      
      Return JSON with:
      {
        "summary": "translated summary",
        "audio_friendly": "version optimized for text-to-speech",
        "key_points": ["point1", "point2", "point3"]
      }
      `;

      const translation =
        await EnhancedGeminiService.translateWithAfricanContext(summaryPrompt);

      return {
        ...translation,
        target_language: targetLanguage,
        language_info: langInfo,
        character_count: translation.summary?.length || 0,
      };
    } catch (error) {
      console.error("Error translating news summary:", error);
      return null;
    }
  }

  // Batch translate multiple articles efficiently
  static async batchTranslateArticles(
    articles,
    targetLanguage,
    priority = "medium"
  ) {
    try {
      const results = [];
      const batchSize = priority === "high" ? 3 : 5; // Smaller batches for higher quality

      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);

        const batchPromises = batch.map((article) =>
          this.translateContent(article, targetLanguage, {
            quality:
              priority === "high"
                ? TRANSLATION_QUALITY.ENHANCED
                : TRANSLATION_QUALITY.STANDARD,
            cacheOffline: true,
          })
        );

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result, index) => {
          const article = batch[index];
          if (result.status === "fulfilled") {
            results.push({
              article_id: article.id,
              translation: result.value,
              success: true,
            });
          } else {
            results.push({
              article_id: article.id,
              error: result.reason.message,
              success: false,
            });
          }
        });

        // Small delay to avoid overwhelming the AI service
        if (i + batchSize < articles.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      return {
        total_articles: articles.length,
        successful_translations: results.filter((r) => r.success).length,
        failed_translations: results.filter((r) => !r.success).length,
        results: results,
      };
    } catch (error) {
      console.error("Batch translation error:", error);
      return {
        total_articles: articles.length,
        successful_translations: 0,
        failed_translations: articles.length,
        error: error.message,
      };
    }
  }

  // Save translation to database
  static async saveTranslationToDatabase(
    content,
    targetLanguage,
    translation,
    quality
  ) {
    try {
      await supabase.from("article_translations").upsert(
        [
          {
            article_id: content.id,
            language_code: targetLanguage,
            translated_title: translation.translated_title,
            translated_description: translation.translated_description,
            translated_content: translation.translated_content,
            quality_level: quality,
            cultural_notes: translation.cultural_notes,
            confidence_score: translation.confidence_score,
            created_at: new Date().toISOString(),
          },
        ],
        {
          onConflict: "article_id,language_code",
        }
      );
    } catch (error) {
      console.error("Error saving translation to database:", error);
    }
  }

  // Get cached translation from database
  static async getCachedTranslationFromDB(articleId, targetLanguage) {
    try {
      const { data, error } = await supabase
        .from("article_translations")
        .select("*")
        .eq("article_id", articleId)
        .eq("language_code", targetLanguage)
        .single();

      if (error) return null;

      return {
        translated_title: data.translated_title,
        translated_description: data.translated_description,
        translated_content: data.translated_content,
        cultural_notes: data.cultural_notes,
        confidence_score: data.confidence_score,
        quality: data.quality_level,
        cached_at: data.created_at,
        source: "database",
      };
    } catch (error) {
      console.error("Error getting cached translation:", error);
      return null;
    }
  }

  // Get fallback translation (simple/basic)
  static async getFallbackTranslation(content, targetLanguage) {
    try {
      // Use a simpler translation approach or return a basic translation
      const langInfo = AFRICAN_LANGUAGES[targetLanguage];
      if (!langInfo) return null;

      const basicPrompt = `
      Translate this title to ${langInfo.englishName}: "${content.title}"
      Keep it simple and direct. Return only the translated title.
      `;

      const fallback = await EnhancedGeminiService.generateSimpleTranslation(
        basicPrompt
      );

      return {
        translated_title: fallback,
        translated_description: content.description, // Keep original if translation fails
        quality: "fallback",
        note: "Simplified translation due to processing error",
      };
    } catch (error) {
      console.error("Fallback translation failed:", error);
      return {
        translated_title: content.title,
        translated_description: content.description,
        quality: "original",
        note: "Translation unavailable",
      };
    }
  }

  // Get user's preferred languages based on location and history
  static async getUserLanguagePreferences(userId) {
    try {
      const { data: user } = await supabase
        .from("profiles")
        .select("country, preferred_languages, location")
        .eq("id", userId)
        .single();

      if (!user) return ["en"];

      // Get local languages for user's country
      const localLanguages = Object.entries(AFRICAN_LANGUAGES)
        .filter(([, info]) => info.countries.includes(user.country))
        .map(([code]) => code);

      // Combine user preferences with local languages
      const preferredLanguages = [
        ...(user.preferred_languages || []),
        ...localLanguages,
      ];

      // Remove duplicates and add English as fallback
      return [...new Set([...preferredLanguages, "en"])];
    } catch (error) {
      console.error("Error getting user language preferences:", error);
      return ["en"];
    }
  }

  // Update user language preferences
  static async updateUserLanguagePreferences(userId, languages) {
    try {
      await supabase
        .from("profiles")
        .update({ preferred_languages: languages })
        .eq("id", userId);

      return true;
    } catch (error) {
      console.error("Error updating language preferences:", error);
      return false;
    }
  }

  // Get translation statistics
  static async getTranslationStats(userId = null) {
    try {
      let query = supabase
        .from("article_translations")
        .select("language_code, quality_level, confidence_score, created_at");

      if (userId) {
        // Get stats for user's translations
        query = query.eq("requested_by", userId);
      }

      const { data: translations } = await query;

      if (!translations?.length) return null;

      const stats = {
        total_translations: translations.length,
        languages_used: [...new Set(translations.map((t) => t.language_code))]
          .length,
        average_confidence:
          translations.reduce((sum, t) => sum + (t.confidence_score || 0), 0) /
          translations.length,
        quality_distribution: {},
        language_distribution: {},
        recent_activity: translations.filter(
          (t) =>
            new Date(t.created_at) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      };

      // Calculate quality distribution
      translations.forEach((t) => {
        stats.quality_distribution[t.quality_level] =
          (stats.quality_distribution[t.quality_level] || 0) + 1;
      });

      // Calculate language distribution
      translations.forEach((t) => {
        const langInfo = AFRICAN_LANGUAGES[t.language_code];
        const langName = langInfo?.englishName || t.language_code;
        stats.language_distribution[langName] =
          (stats.language_distribution[langName] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error("Error getting translation stats:", error);
      return null;
    }
  }
}
