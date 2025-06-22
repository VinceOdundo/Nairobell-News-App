import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
const proModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

// Enhanced African context prompt with cultural sensitivity
const AFRICAN_CONTEXT_PROMPT = `
You are an AI assistant specialized in African news, culture, and context. You have deep knowledge of:
- 54 African countries and their unique cultures, politics, and economies
- Major African languages: Swahili, Amharic, Yoruba, Hausa, Zulu, Xhosa, Arabic, French, Portuguese
- Economic realities: mobile money, data costs, informal economy, youth demographics
- Cultural sensitivities: Ubuntu philosophy, communal values, respect for elders
- Political landscape: democracy, governance, continental integration (AU, ECOWAS, etc.)
- Development challenges: infrastructure, education, healthcare, climate change
- Success stories: tech hubs (Lagos, Nairobi, Cape Town), renewable energy, entrepreneurship

Always respond with:
1. Cultural sensitivity and awareness
2. Economic context relevant to African audiences
3. Multilingual communication consideration
4. Mobile-first, data-conscious approach
5. Pan-African perspective while respecting national differences
`

export class EnhancedGeminiService {
  
  // Analyze African context and relevance of news
  static async analyzeAfricanContext(article) {
    try {
      const prompt = `${AFRICAN_CONTEXT_PROMPT}

Analyze this news article for African context and relevance:
Title: ${article.title}
Content: ${article.content || article.description}

Return a JSON object with:
{
  "relevance_score": 0-10,
  "affected_countries": ["country1", "country2"],
  "economic_impact": "brief description",
  "social_impact": "brief description", 
  "cultural_significance": "brief description",
  "target_audience": ["demographics"],
  "local_connections": ["how it connects to local issues"]
}`

      const result = await textModel.generateContent(prompt)
      const response = await result.response.text()
      
      try {
        return JSON.parse(response)
      } catch {
        return {
          relevance_score: 5,
          affected_countries: [],
          economic_impact: "Unknown",
          social_impact: "Unknown",
          cultural_significance: "Unknown",
          target_audience: ["general"],
          local_connections: []
        }
      }
    } catch (error) {
      console.error('Error analyzing African context:', error)
      return null
    }
  }

  // Generate personalized impact analysis
  static async generatePersonalizedImpact(article, userProfile) {
    try {
      const prompt = `${AFRICAN_CONTEXT_PROMPT}

Based on this user profile and news article, explain how this news personally affects them:

User Profile:
- Country: ${userProfile.country}
- Region: ${userProfile.region || 'Unknown'}
- Age Range: ${userProfile.age_range || 'Unknown'}
- Interests: ${userProfile.preferred_categories?.join(', ') || 'General'}

Article:
${article.title}
${article.description}

Provide a personal impact analysis in 2-3 sentences, starting with "This could affect you because..." 
Be specific about economic, social, or practical impacts relevant to their location and interests.`

      const result = await textModel.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Error generating personalized impact:', error)
      return "This news may have broader implications for your region."
    }
  }

  // Enhanced summary with African context
  static async generateAfricanContextSummary(article, type = 'standard', language = 'en') {
    try {
      let summaryInstruction = ''
      
      switch (type) {
        case 'eli5':
          summaryInstruction = 'Explain this like I\'m 5 years old, using simple African examples and analogies'
          break
        case 'pidgin':
          summaryInstruction = 'Summarize in Nigerian Pidgin English in a conversational tone'
          break
        case 'impact':
          summaryInstruction = 'Focus on how this affects ordinary Africans - economically, socially, practically'
          break
        case 'audio':
          summaryInstruction = 'Create a natural-sounding radio news script for African audiences'
          break
        default:
          summaryInstruction = 'Provide a clear, concise summary relevant to African readers'
      }

      const prompt = `${AFRICAN_CONTEXT_PROMPT}

${summaryInstruction} in ${language}:

Title: ${article.title}
Content: ${article.content || article.description}

Keep it engaging, culturally relevant, and accessible to mobile users with limited data.`

      const result = await textModel.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Error generating African context summary:', error)
      throw error
    }
  }

  // Real-time translation with cultural context
  static async translateWithCulturalContext(text, fromLang, toLang) {
    try {
      const prompt = `${AFRICAN_CONTEXT_PROMPT}

Translate this text from ${fromLang} to ${toLang}, maintaining cultural context and using appropriate local expressions and idioms:

Text: ${text}

Ensure the translation:
1. Uses locally appropriate terms and expressions
2. Maintains cultural sensitivity
3. Adapts context for the target audience
4. Uses formal or informal tone as culturally appropriate`

      const result = await textModel.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Error translating with cultural context:', error)
      throw error
    }
  }

  // Advanced fact-checking with African sources
  static async performAfricanFactCheck(claim, userCountry) {
    try {
      const prompt = `${AFRICAN_CONTEXT_PROMPT}

Fact-check this claim with focus on African sources and context:
Claim: ${claim}
User Country: ${userCountry}

Analyze:
1. Factual accuracy based on reliable African and international sources
2. Local context and nuances for ${userCountry}
3. Potential misinformation patterns common in African media
4. Cultural factors that might affect interpretation

Return JSON:
{
  "accuracy_score": 0-10,
  "verdict": "true/false/partly-true/unverified",
  "explanation": "detailed explanation",
  "african_sources": ["list of relevant sources"],
  "local_context": "country-specific context",
  "red_flags": ["potential misinformation indicators"]
}`

      const result = await proModel.generateContent(prompt)
      const response = await result.response.text()
      
      try {
        return JSON.parse(response)
      } catch {
        return {
          accuracy_score: 5,
          verdict: "unverified",
          explanation: "Unable to verify this claim at the moment",
          african_sources: [],
          local_context: "",
          red_flags: []
        }
      }
    } catch (error) {
      console.error('Error performing African fact check:', error)
      return null
    }
  }

  // Generate discussion prompts for community engagement
  static async generateDiscussionPrompts(article) {
    try {
      const prompt = `${AFRICAN_CONTEXT_PROMPT}

Generate 3-4 thoughtful discussion prompts for this news article that would engage African audiences:

Article: ${article.title}
${article.description}

Create prompts that:
1. Encourage diverse perspectives across African countries
2. Are culturally sensitive and inclusive
3. Promote constructive dialogue
4. Connect to local experiences and contexts
5. Avoid divisive or inflammatory topics

Return as a JSON array of strings.`

      const result = await textModel.generateContent(prompt)
      const response = await result.response.text()
      
      try {
        return JSON.parse(response)
      } catch {
        return [
          "What do you think about this development?",
          "How might this affect your community?",
          "What similar experiences have you seen in your country?"
        ]
      }
    } catch (error) {
      console.error('Error generating discussion prompts:', error)
      return []
    }
  }

  // Moderate content with African cultural context
  static async moderateWithAfricanContext(content, userCountry) {
    try {
      const prompt = `${AFRICAN_CONTEXT_PROMPT}

Moderate this content for an African news platform, considering cultural sensitivities for ${userCountry}:

Content: ${content}

Check for:
1. Hate speech or discrimination
2. Cultural insensitivity
3. Misinformation
4. Inflammatory language
5. Content inappropriate for diverse African audiences

Return JSON:
{
  "is_appropriate": boolean,
  "confidence_score": 0-1,
  "issues": ["list of issues"],
  "suggestions": "how to improve if needed",
  "cultural_notes": "cultural context considerations"
}`

      const result = await textModel.generateContent(prompt)
      const response = await result.response.text()
      
      try {
        return JSON.parse(response)
      } catch {
        return {
          is_appropriate: true,
          confidence_score: 0.5,
          issues: [],
          suggestions: "",
          cultural_notes: ""
        }
      }
    } catch (error) {
      console.error('Error moderating with African context:', error)
      return null
    }
  }

  // Calculate trending score based on African engagement patterns
  static async calculateTrendingScore(article) {
    try {
      // Simulate trending calculation based on various factors
      const factors = {
        recency: this.calculateRecencyScore(article.published_at),
        relevance: article.african_context?.relevance_score || 5,
        engagement: Math.random() * 5, // Would be real engagement data
        source_credibility: article.source_credibility || 5,
        african_focus: this.calculateAfricanFocusScore(article)
      }
      
      const weightedScore = (
        factors.recency * 0.3 +
        factors.relevance * 0.25 +
        factors.engagement * 0.2 +
        factors.source_credibility * 0.15 +
        factors.african_focus * 0.1
      ) / 10
      
      return Math.min(Math.max(weightedScore, 0), 1)
    } catch (error) {
      console.error('Error calculating trending score:', error)
      return 0.5
    }
  }

  static calculateRecencyScore(publishedAt) {
    const now = new Date()
    const published = new Date(publishedAt)
    const hoursAgo = (now - published) / (1000 * 60 * 60)
    
    if (hoursAgo < 1) return 10
    if (hoursAgo < 6) return 8
    if (hoursAgo < 24) return 6
    if (hoursAgo < 48) return 4
    return 2
  }

  static calculateAfricanFocusScore(article) {
    const africanKeywords = [
      'africa', 'african', 'au', 'ecowas', 'sadc', 'continental',
      'ubuntu', 'harambee', 'ubuntu', 'brics'
    ]
    
    const content = `${article.title} ${article.description}`.toLowerCase()
    const matches = africanKeywords.filter(keyword => content.includes(keyword))
    
    return Math.min(matches.length * 2, 10)
  }

  // Generate tags with African context
  static async generateTags(article) {
    try {
      const prompt = `${AFRICAN_CONTEXT_PROMPT}

Generate 5-8 relevant tags for this article, including African-specific tags:

Article: ${article.title}
${article.description}

Include tags for:
- Geographic regions (countries, regions)
- Topics and themes
- African-specific contexts
- Relevant hashtags

Return as a JSON array of strings.`

      const result = await textModel.generateContent(prompt)
      const response = await result.response.text()
      
      try {
        return JSON.parse(response)
      } catch {
        return ['africa', 'news', article.category]
      }
    } catch (error) {
      console.error('Error generating tags:', error)
      return []
    }
  }

  // Assess credibility with African media literacy
  static async assessCredibility(article, source) {
    try {
      const baseScore = source.credibility_score || 5.0
      
      // Additional credibility factors for African context
      const factors = {
        sourceReputation: baseScore,
        contentQuality: this.assessContentQuality(article),
        africanRelevance: article.african_context?.relevance_score || 5,
        factualLanguage: this.assessFactualLanguage(article.content || article.description)
      }
      
      const weightedScore = (
        factors.sourceReputation * 0.4 +
        factors.contentQuality * 0.3 +
        factors.africanRelevance * 0.2 +
        factors.factualLanguage * 0.1
      )
      
      return Math.min(Math.max(weightedScore, 0), 10)
    } catch (error) {
      console.error('Error assessing credibility:', error)
      return 5.0
    }
  }

  static assessContentQuality(article) {
    const content = article.content || article.description || ''
    
    // Basic quality indicators
    if (content.length < 100) return 3
    if (content.includes('BREAKING') && content.length < 200) return 4
    if (content.split(' ').length > 100) return 7
    
    return 5
  }

  static assessFactualLanguage(content) {
    const factualIndicators = ['according to', 'reports', 'confirmed', 'stated', 'announced']
    const speculativeIndicators = ['allegedly', 'rumored', 'might', 'could', 'possibly']
    
    const factualMatches = factualIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length
    
    const speculativeMatches = speculativeIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length
    
    return Math.max(5 + factualMatches - speculativeMatches, 1)
  }
}