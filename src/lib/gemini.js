import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Models for different use cases
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const proModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// African context prompt template
const AFRICAN_CONTEXT_PROMPT = `
You are an AI assistant specialized in African news and culture. 
Always consider the African context, including:
- Cultural sensitivities and nuances
- Economic realities (data costs, mobile-first usage)
- Multilingual communication needs
- Local political and social contexts
- Pan-African perspectives

Respond in a way that's accessible to African audiences while being informative and engaging.
`;

export class GeminiService {
  static async generateSummary(article, type = "short", language = "en") {
    try {
      let prompt = `${AFRICAN_CONTEXT_PROMPT}\n\n`;

      switch (type) {
        case "short":
          prompt += `Create a concise 2-3 sentence summary of this news article in ${language}:`;
          break;
        case "detailed":
          prompt += `Create a comprehensive but accessible summary of this news article in ${language}, highlighting key points and implications for African readers:`;
          break;
        case "eli5":
          prompt += `Explain this news article in very simple terms that anyone can understand, in ${language}. Use analogies and examples relevant to African contexts:`;
          break;
        case "impact":
          prompt += `Analyze how this news might directly impact ordinary people in Africa. Be specific about economic, social, or political effects in ${language}:`;
          break;
        default:
          prompt += `Summarize this article in ${language}:`;
      }

      prompt += `\n\nArticle Title: ${article.title}\nArticle Content: ${article.content || article.description}`;

      const result = await textModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini summary generation error:", error);
      throw new Error("Failed to generate summary");
    }
  }

  static async translateToLocalLanguage(text, targetLanguage) {
    try {
      const prompt = `${AFRICAN_CONTEXT_PROMPT}\n\nTranslate the following text to ${targetLanguage}, maintaining cultural context and using appropriate local expressions:\n\n${text}`;

      const result = await textModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini translation error:", error);
      throw new Error("Failed to translate text");
    }
  }

  static async generateAudioScript(article, language = "en") {
    try {
      const prompt = `${AFRICAN_CONTEXT_PROMPT}\n\nCreate a natural-sounding audio news script in ${language} for this article. Make it conversational and engaging for radio-style delivery:\n\nTitle: ${article.title}\nContent: ${article.content || article.description}`;

      const result = await textModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini audio script generation error:", error);
      throw new Error("Failed to generate audio script");
    }
  }

  static async moderateContent(text) {
    try {
      const prompt = `Analyze this text for potentially harmful content, misinformation, or hate speech. Consider African cultural contexts and sensitivities. Return a JSON response with: {
        "isAppropriate": boolean,
        "issues": ["list", "of", "issues"],
        "suggestions": "suggested improvements",
        "confidenceScore": 0-1
      }\n\nText to analyze: ${text}`;

      const result = await textModel.generateContent(prompt);
      const response = await result.response;

      try {
        return JSON.parse(response.text());
      } catch {
        return {
          isAppropriate: true,
          issues: [],
          suggestions: "",
          confidenceScore: 0.5,
        };
      }
    } catch (error) {
      console.error("Gemini content moderation error:", error);
      return {
        isAppropriate: true,
        issues: [],
        suggestions: "",
        confidenceScore: 0,
      };
    }
  }
  static async generatePersonalizedFeed(userPreferences, availableArticles) {
    try {
      const prompt = `${AFRICAN_CONTEXT_PROMPT}\n\nBased on these user preferences and reading history, rank the following articles by relevance (1-10 scale). Consider African context and user's specific interests.\n\nUser Preferences: ${JSON.stringify(userPreferences)}\n\nArticles: ${JSON.stringify(availableArticles.slice(0, 20))}\n\nReturn a JSON array of article IDs ranked by relevance score.`;

      const result = await proModel.generateContent(prompt);
      const response = await result.response;

      try {
        return JSON.parse(response.text());
      } catch {
        // Fallback to random order if parsing fails
        return availableArticles.map((article) => article.id);
      }
    } catch (error) {
      console.error("Gemini personalization error:", error);

      // Check if it's a quota error and provide helpful feedback
      if (error.message && error.message.includes("quota")) {
        console.warn(
          "Gemini API quota exceeded, falling back to default feed ordering"
        );
      }

      // Fallback to smart ordering based on user preferences without AI
      return this.fallbackPersonalization(userPreferences, availableArticles);
    }
  }

  // Fallback personalization without AI
  static fallbackPersonalization(userPreferences, availableArticles) {
    try {
      // Simple scoring based on user preferences
      const scoredArticles = availableArticles.map((article) => {
        let score = 0;

        // Country preference
        if (
          userPreferences.country &&
          article.country_focus?.includes(userPreferences.country)
        ) {
          score += 3;
        }

        // Language preference
        if (
          userPreferences.preferred_language &&
          article.language === userPreferences.preferred_language
        ) {
          score += 2;
        }

        // Category preferences
        if (userPreferences.interests?.includes(article.category)) {
          score += 2;
        }

        // Recent articles get higher score
        const hoursOld =
          (Date.now() - new Date(article.published_at).getTime()) /
          (1000 * 60 * 60);
        if (hoursOld < 24) score += 1;

        return { ...article, score };
      });

      // Sort by score and return IDs
      return scoredArticles
        .sort((a, b) => b.score - a.score)
        .map((article) => article.id);
    } catch (error) {
      console.error("Fallback personalization error:", error);
      return availableArticles.map((article) => article.id);
    }
  }

  static async generateTrendingTopics(articles) {
    try {
      const prompt = `${AFRICAN_CONTEXT_PROMPT}\n\nAnalyze these recent articles and identify trending topics relevant to African audiences. Return a JSON array of trending topics with their relevance scores.\n\nArticles: ${JSON.stringify(articles.slice(0, 50))}\n\nReturn format: [{"topic": "topic name", "score": 0-1, "category": "category", "description": "brief description"}]`;

      const result = await textModel.generateContent(prompt);
      const response = await result.response;

      try {
        return JSON.parse(response.text());
      } catch {
        return [];
      }
    } catch (error) {
      console.error("Gemini trending topics error:", error);
      return [];
    }
  }

  static async factCheck(claim) {
    try {
      const prompt = `${AFRICAN_CONTEXT_PROMPT}\n\nAnalyze this claim for factual accuracy, considering African contexts and reliable sources. Return a JSON response with: {
        "likelihood": 0-1,
        "reasoning": "explanation",
        "sources": ["suggested", "sources"],
        "africanContext": "specific African context considerations"
      }\n\nClaim: ${claim}`;

      const result = await proModel.generateContent(prompt);
      const response = await result.response;

      try {
        return JSON.parse(response.text());
      } catch {
        return {
          likelihood: 0.5,
          reasoning: "Unable to verify at this time",
          sources: [],
          africanContext: "",
        };
      }
    } catch (error) {
      console.error("Gemini fact check error:", error);
      return {
        likelihood: 0.5,
        reasoning: "Unable to verify at this time",
        sources: [],
        africanContext: "",
      };
    }
  }
}
