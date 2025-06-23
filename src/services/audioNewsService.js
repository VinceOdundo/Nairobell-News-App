import { GeminiService } from '../lib/gemini';
import { supabase } from '../lib/supabase';

export class AudioNewsService {
  static async generateAudioNews(article, options = {}) {
    try {
      const {
        language = 'en',
        voice = 'neutral',
        speed = 1.0,
        style = 'news',
        includeContext = true
      } = options;

      // Generate audio script using Gemini
      const script = await this.generateAudioScript(article, { language, style, includeContext });
      
      // Use Web Speech API for text-to-speech (browser-based)
      if ('speechSynthesis' in window) {
        const audioBlob = await this.textToSpeechWeb(script, { language, voice, speed });
        return {
          script,
          audioBlob,
          duration: this.estimateDuration(script),
          language,
          voice
        };
      }

      // Fallback: return just the script for external TTS services
      return {
        script,
        audioBlob: null,
        duration: this.estimateDuration(script),
        language,
        voice,
        error: 'Text-to-speech not supported in this browser'
      };

    } catch (error) {
      console.error('Audio news generation error:', error);
      throw new Error('Failed to generate audio news');
    }
  }

  static async generateAudioScript(article, options = {}) {
    const {
      language = 'en',
      style = 'news',
      includeContext = true
    } = options;

    let prompt = `Create an engaging audio news script in ${language} for the article below. `;

    switch (style) {
      case 'podcast':
        prompt += 'Make it conversational and engaging, like a podcast episode. Add natural pauses and emphasis. ';
        break;
      case 'radio':
        prompt += 'Make it professional and clear, suitable for radio broadcast. ';
        break;
      case 'storytelling':
        prompt += 'Tell it as a compelling story with narrative elements. ';
        break;
      default:
        prompt += 'Make it clear and informative for news delivery. ';
    }

    if (includeContext) {
      prompt += 'Include relevant African context and explain any complex terms. ';
    }

    prompt += `\n\nArticle Title: ${article.title}\n`;
    prompt += `Article Content: ${article.content || article.description}\n`;
    prompt += 'Create a natural-sounding script with appropriate pacing marks [PAUSE] where needed.';

    return await GeminiService.generateContent(prompt);
  }

  static async textToSpeechWeb(text, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const { language = 'en', voice = 'neutral', speed = 1.0 } = options;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'sw' ? 'sw-KE' : 
                        language === 'ha' ? 'ha-NG' :
                        language === 'am' ? 'am-ET' :
                        language === 'zu' ? 'zu-ZA' : 'en-US';
        
        utterance.rate = speed;
        utterance.pitch = 1.0;
        
        // Try to find an appropriate voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.lang.startsWith(utterance.lang.split('-')[0]) ||
          (voice === 'female' && v.name.toLowerCase().includes('female')) ||
          (voice === 'male' && v.name.toLowerCase().includes('male'))
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        // Record audio using MediaRecorder API
        const audioChunks = [];
        let mediaRecorder;

        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = event => {
              audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
              resolve(audioBlob);
            };

            utterance.onstart = () => {
              mediaRecorder.start();
            };

            utterance.onend = () => {
              mediaRecorder.stop();
              stream.getTracks().forEach(track => track.stop());
            };

            utterance.onerror = (error) => {
              mediaRecorder.stop();
              stream.getTracks().forEach(track => track.stop());
              reject(error);
            };

            speechSynthesis.speak(utterance);
          })
          .catch(() => {
            // Fallback: just use speech synthesis without recording
            utterance.onend = () => {
              resolve(null); // No audio blob, but speech was played
            };
            
            utterance.onerror = reject;
            speechSynthesis.speak(utterance);
          });

      } catch (error) {
        reject(error);
      }
    });
  }

  static estimateDuration(text) {
    // Estimate reading time: average 200 words per minute for speech
    const words = text.split(/\s+/).length;
    return Math.ceil((words / 200) * 60); // Duration in seconds
  }

  static async saveAudioNews(articleId, audioData, userId) {
    try {
      const { data, error } = await supabase
        .from('audio_news')
        .insert({
          article_id: articleId,
          user_id: userId,
          script: audioData.script,
          duration: audioData.duration,
          language: audioData.language,
          voice: audioData.voice,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving audio news:', error);
      throw error;
    }
  }

  static async getAudioNews(articleId, userId) {
    try {
      const { data, error } = await supabase
        .from('audio_news')
        .select('*')
        .eq('article_id', articleId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching audio news:', error);
      return null;
    }
  }

  static getLanguageName(code) {
    const languages = {
      'en': 'English',
      'sw': 'Swahili',
      'ha': 'Hausa',
      'am': 'Amharic',
      'zu': 'Zulu',
      'yo': 'Yoruba',
      'ig': 'Igbo',
      'fr': 'French',
      'ar': 'Arabic',
      'pt': 'Portuguese'
    };
    return languages[code] || 'English';
  }

  static getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
      { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
      { code: 'am', name: 'Amharic', flag: '🇪🇹' },
      { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
      { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
      { code: 'fr', name: 'French', flag: '🇫🇷' },
      { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
      { code: 'pt', name: 'Portuguese', flag: '🇵🇹' }
    ];
  }

  static async createAudioPlaylist(articles, options = {}) {
    try {
      const {
        language = 'en',
        maxDuration = 1800, // 30 minutes
        style = 'news'
      } = options;

      const playlist = [];
      let totalDuration = 0;

      for (const article of articles) {
        if (totalDuration >= maxDuration) break;

        const audioNews = await this.generateAudioNews(article, {
          language,
          style,
          includeContext: false // Shorter for playlists
        });

        if (audioNews && totalDuration + audioNews.duration <= maxDuration) {
          playlist.push({
            ...audioNews,
            article
          });
          totalDuration += audioNews.duration;
        }
      }

      return {
        playlist,
        totalDuration,
        estimatedLength: `${Math.ceil(totalDuration / 60)} minutes`
      };

    } catch (error) {
      console.error('Error creating audio playlist:', error);
      throw error;
    }
  }
}
