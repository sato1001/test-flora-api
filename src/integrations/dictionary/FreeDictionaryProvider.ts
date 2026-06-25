import { DictionaryProvider } from './DictionaryProvider';
import { env } from '../../config/env';
import { logger } from '../../logger';

export class FreeDictionaryProvider implements DictionaryProvider {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = env.FREE_DICTIONARY_API_URL;
  }

  async getDefinition(word: string): Promise<any> {
    const url = `${this.baseUrl}/${encodeURIComponent(word)}`;
    return this.fetchWithRetry(url, word, 1);
  }

  private async fetchWithRetry(url: string, word: string, retriesLeft: number): Promise<any> {
    const controller = new AbortController();
    const timeout = 5000; // 5 seconds
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      logger.info({ word, url, retriesLeft }, 'Calling Free Dictionary API');
      
      const response = await fetch(url, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.status === 404) {
        logger.info({ word }, 'Word not found in Free Dictionary API');
        throw new Error('Word not found in the dictionary');
      }

      if (!response.ok) {
        logger.warn({ word, status: response.status }, 'Free Dictionary API returned non-OK status');
        if (response.status >= 500 && retriesLeft > 0) {
          logger.info({ word }, 'Retrying due to 5xx server error');
          return this.fetchWithRetry(url, word, retriesLeft - 1);
        }
        throw new Error('Dictionary service is temporarily unavailable');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        logger.error({ word }, 'Free Dictionary API request timed out');
        if (retriesLeft > 0) {
          logger.info({ word }, 'Retrying due to request timeout');
          return this.fetchWithRetry(url, word, retriesLeft - 1);
        }
        throw new Error('Request to dictionary service timed out');
      }

      // Re-throw handled errors directly
      if (
        error.message === 'Word not found in the dictionary' || 
        error.message === 'Dictionary service is temporarily unavailable'
      ) {
        throw error;
      }

      logger.error({ error: error.message || error, word }, 'Error calling Free Dictionary API');
      
      if (retriesLeft > 0) {
        logger.info({ word }, 'Retrying after unexpected connection failure');
        return this.fetchWithRetry(url, word, retriesLeft - 1);
      }
      
      throw new Error('Failed to fetch word definition');
    }
  }
}
