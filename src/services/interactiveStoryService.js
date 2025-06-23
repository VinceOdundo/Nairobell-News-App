import { GeminiService } from '../lib/gemini';
import { supabase } from '../lib/supabase';

export class InteractiveStoryService {
  static async createInteractiveStory(article, options = {}) {
    try {
      const {
        format = 'timeline',
        interactivity = 'medium',
        includeMedia = true,
        language = 'en'
      } = options;

      const story = await this.generateStoryStructure(article, { format, language });
      const interactiveElements = await this.addInteractiveElements(story, { interactivity });
      
      if (includeMedia) {
        story.mediaElements = await this.suggestMediaElements(article);
      }

      return {
        ...story,
        interactiveElements,
        metadata: {
          format,
          interactivity,
          language,
          estimatedReadTime: this.calculateReadTime(story.content),
          complexity: this.calculateComplexity(story)
        }
      };

    } catch (error) {
      console.error('Interactive story creation error:', error);
      throw new Error('Failed to create interactive story');
    }
  }

  static async generateStoryStructure(article, options = {}) {
    const { format = 'timeline', language = 'en' } = options;

    let prompt = `Create an engaging, interactive story structure in ${language} based on this news article. `;

    switch (format) {
      case 'timeline':
        prompt += 'Structure it as a chronological timeline with key events, causes, and effects. Include decision points where readers can explore different aspects. ';
        break;
      case 'characters':
        prompt += 'Focus on the people involved - their backgrounds, motivations, and how they\'re affected. Make it character-driven. ';
        break;
      case 'impact':
        prompt += 'Structure around different levels of impact: immediate, short-term, long-term. Show how it affects different groups. ';
        break;
      case 'explainer':
        prompt += 'Create an educational explainer format with progressive disclosure of complexity. ';
        break;
      default:
        prompt += 'Create an engaging narrative structure. ';
    }

    prompt += `Include African context and make it culturally relevant. 

Article: ${article.title}
Content: ${article.content || article.description}

Return a JSON structure with:
{
  "title": "engaging title",
  "introduction": "hook paragraph",
  "sections": [
    {
      "id": "unique_id",
      "title": "section title",
      "content": "section content",
      "type": "main|sidebar|callout|quote",
      "order": number,
      "dependencies": ["section_ids_that_should_be_read_first"]
    }
  ],
  "keyPoints": ["important", "takeaways"],
  "connections": [
    {
      "from": "section_id",
      "to": "section_id",
      "relationship": "leads_to|explains|contrasts_with|supports"
    }
  ]
}`;

    const response = await GeminiService.generateContent(prompt);
    try {
      return JSON.parse(response);
    } catch {
      // Fallback structure if JSON parsing fails
      return {
        title: article.title,
        introduction: article.description,
        sections: [{
          id: 'main',
          title: 'Full Story',
          content: article.content || article.description,
          type: 'main',
          order: 1,
          dependencies: []
        }],
        keyPoints: [],
        connections: []
      };
    }
  }

  static async addInteractiveElements(story, options = {}) {
    const { interactivity = 'medium' } = options;

    const elements = [];

    // Add different types of interactive elements based on interactivity level
    switch (interactivity) {
      case 'high':
        elements.push(...await this.generateHighInteractivity(story));
        break;
      case 'medium':
        elements.push(...await this.generateMediumInteractivity(story));
        break;
      case 'low':
        elements.push(...await this.generateLowInteractivity(story));
        break;
    }

    return elements;
  }

  static async generateHighInteractivity(story) {
    return [
      {
        type: 'quiz',
        title: 'Test Your Understanding',
        questions: await this.generateQuizQuestions(story),
        placement: 'end'
      },
      {
        type: 'scenario',
        title: 'What Would You Do?',
        scenarios: await this.generateScenarios(story),
        placement: 'middle'
      },
      {
        type: 'timeline',
        title: 'Interactive Timeline',
        events: this.extractTimelineEvents(story),
        placement: 'sidebar'
      },
      {
        type: 'map',
        title: 'Impact Map',
        locations: this.extractLocations(story),
        placement: 'embed'
      },
      {
        type: 'discussion',
        title: 'Community Discussion',
        prompts: await this.generateDiscussionPrompts(story),
        placement: 'end'
      }
    ];
  }

  static async generateMediumInteractivity(story) {
    return [
      {
        type: 'poll',
        title: 'Quick Poll',
        question: await this.generatePollQuestion(story),
        options: await this.generatePollOptions(story),
        placement: 'middle'
      },
      {
        type: 'expandable',
        title: 'Learn More',
        sections: this.createExpandableSections(story),
        placement: 'inline'
      },
      {
        type: 'related',
        title: 'Related Stories',
        suggestions: await this.findRelatedStories(story),
        placement: 'sidebar'
      }
    ];
  }

  static async generateLowInteractivity(story) {
    return [
      {
        type: 'highlight',
        title: 'Key Quotes',
        quotes: this.extractKeyQuotes(story),
        placement: 'inline'
      },
      {
        type: 'summary',
        title: 'Quick Summary',
        points: story.keyPoints,
        placement: 'top'
      }
    ];
  }

  static async generateQuizQuestions(story) {
    const prompt = `Based on this story, create 3-5 multiple choice questions that test understanding of key facts and implications. Make them thought-provoking and relevant to African readers.

Story: ${JSON.stringify(story)}

Return JSON format:
[
  {
    "question": "question text",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": 0,
    "explanation": "why this is correct"
  }
]`;

    try {
      const response = await GeminiService.generateContent(prompt);
      return JSON.parse(response);
    } catch {
      return [];
    }
  }

  static async generateScenarios(story) {
    const prompt = `Create 2-3 "What would you do?" scenarios based on this story. Make them realistic and relevant to African contexts.

Story: ${JSON.stringify(story)}

Return JSON format:
[
  {
    "scenario": "situation description",
    "options": [
      {
        "action": "possible action",
        "outcome": "likely result",
        "reasoning": "why this might happen"
      }
    ]
  }
]`;

    try {
      const response = await GeminiService.generateContent(prompt);
      return JSON.parse(response);
    } catch {
      return [];
    }
  }

  static extractTimelineEvents(story) {
    // Extract dates and events from story content
    const events = [];
    story.sections.forEach(section => {
      // Simple regex to find dates and events
      const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4}|\w+ \d{1,2}, \d{4}|\d{4})/g;
      const dates = section.content.match(dateRegex);
      
      if (dates) {
        dates.forEach(date => {
          events.push({
            date,
            event: section.title,
            description: section.content.substring(0, 100) + '...'
          });
        });
      }
    });

    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  static extractLocations(story) {
    // Extract location mentions for mapping
    const locations = [];
    const africanCountries = [
      'Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Ethiopia', 'Tanzania',
      'Uganda', 'Morocco', 'Egypt', 'Algeria', 'Sudan', 'Angola', 'Mozambique'
    ];

    story.sections.forEach(section => {
      africanCountries.forEach(country => {
        if (section.content.toLowerCase().includes(country.toLowerCase())) {
          locations.push({
            name: country,
            context: section.title,
            relevance: 'mentioned'
          });
        }
      });
    });

    return [...new Set(locations.map(l => l.name))].map(name => 
      locations.find(l => l.name === name)
    );
  }

  static async generateDiscussionPrompts(story) {
    const prompt = `Generate 3-5 thoughtful discussion prompts based on this story that would engage African readers and encourage meaningful conversation.

Story: ${JSON.stringify(story)}

Return as array of strings.`;

    try {
      const response = await GeminiService.generateContent(prompt);
      return JSON.parse(response);
    } catch {
      return [
        "What are your thoughts on this story?",
        "How might this affect your community?",
        "What questions does this raise for you?"
      ];
    }
  }

  static async generatePollQuestion(story) {
    const prompt = `Create one engaging poll question based on this story that would be interesting to African readers. Keep it concise.

Story: ${story.title}
Content: ${story.introduction}`;

    try {
      return await GeminiService.generateContent(prompt);
    } catch {
      return "What's your take on this story?";
    }
  }

  static async generatePollOptions(story) {
    const prompt = `Create 3-4 poll options for a question about this story. Make them balanced and thoughtful.

Story: ${story.title}
Content: ${story.introduction}

Return as JSON array of strings.`;

    try {
      const response = await GeminiService.generateContent(prompt);
      return JSON.parse(response);
    } catch {
      return ["Strongly agree", "Somewhat agree", "Somewhat disagree", "Strongly disagree"];
    }
  }

  static createExpandableSections(story) {
    return story.sections
      .filter(section => section.type === 'sidebar' || section.content.length > 200)
      .map(section => ({
        title: section.title,
        preview: section.content.substring(0, 100) + '...',
        fullContent: section.content
      }));
  }

  static extractKeyQuotes(story) {
    const quotes = [];
    story.sections.forEach(section => {
      // Simple regex to find quoted text
      const quoteRegex = /"([^"]+)"/g;
      let match;
      
      while ((match = quoteRegex.exec(section.content)) !== null) {
        quotes.push({
          text: match[1],
          context: section.title
        });
      }
    });

    return quotes.slice(0, 3); // Limit to 3 key quotes
  }

  static calculateReadTime(content) {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }

  static calculateComplexity(story) {
    const factors = {
      sectionCount: story.sections.length,
      averageWordsPerSection: story.sections.reduce((sum, s) => sum + s.content.split(/\s+/).length, 0) / story.sections.length,
      connectionCount: story.connections.length
    };

    if (factors.sectionCount > 8 || factors.averageWordsPerSection > 300) return 'high';
    if (factors.sectionCount > 4 || factors.averageWordsPerSection > 150) return 'medium';
    return 'low';
  }

  static async suggestMediaElements(article) {
    const prompt = `Suggest appropriate media elements (images, videos, infographics) that would enhance this news story. Consider African context and visual storytelling.

Article: ${article.title}
Content: ${article.content || article.description}

Return JSON format:
[
  {
    "type": "image|video|infographic|chart",
    "description": "what it should show",
    "placement": "top|inline|sidebar|end",
    "purpose": "illustrate|explain|engage|summarize"
  }
]`;

    try {
      const response = await GeminiService.generateContent(prompt);
      return JSON.parse(response);
    } catch {
      return [];
    }
  }

  static async saveInteractiveStory(story, articleId, userId) {
    try {
      const { data, error } = await supabase
        .from('interactive_stories')
        .insert({
          article_id: articleId,
          user_id: userId,
          story_data: story,
          format: story.metadata.format,
          interactivity_level: story.metadata.interactivity,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving interactive story:', error);
      throw error;
    }
  }

  static async getInteractiveStory(articleId, userId) {
    try {
      const { data, error } = await supabase
        .from('interactive_stories')
        .select('*')
        .eq('article_id', articleId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.story_data;
    } catch (error) {
      console.error('Error fetching interactive story:', error);
      return null;
    }
  }
}
