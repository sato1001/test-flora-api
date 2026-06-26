import { entriesRepository, EntriesRepository } from './entries.repository';
import { favoriteRepository, FavoriteRepository } from './favorite.repository';
import { historyRepository, HistoryRepository } from './history.repository';
import { DictionaryProvider } from '../../integrations/dictionary/DictionaryProvider';
import { FreeDictionaryProvider } from '../../integrations/dictionary/FreeDictionaryProvider';
import { getCache, setCache } from '../../cache/redis';
import { logger } from '../../logger';
import { AppError } from '../../utils/errors';

export class EntriesService {
  constructor(
    private readonly entriesRepo: EntriesRepository = entriesRepository,
    private readonly favoriteRepo: FavoriteRepository = favoriteRepository,
    private readonly historyRepo: HistoryRepository = historyRepository,
    private readonly dictionaryProvider: DictionaryProvider = new FreeDictionaryProvider()
  ) {}

  async listWords(limit: number, page: number, cursor?: string, search?: string) {
    const totalDocs = await this.entriesRepo.countWords(search);

    if (cursor) {
      // Fetch limit + 1 to see if we have next entries
      const words = await this.entriesRepo.getWordsCursor(limit + 1, cursor, search);
      const hasNext = words.length > limit;

      if (hasNext) {
        words.pop();
      }

      const results = words.map((w) => w.word);
      const nextCursor = results.length > 0 ? results[results.length - 1] : undefined;

      return {
        results,
        totalDocs,
        limit,
        nextCursor,
        hasNext,
      };
    } else {
      const words = await this.entriesRepo.getWordsOffset(limit, page, search);
      const results = words.map((w) => w.word);

      const totalPages = Math.ceil(totalDocs / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        results,
        totalDocs,
        page,
        totalPages,
        hasNext,
        hasPrev,
      };
    }
  }

  async getWordDefinition(word: string, userId: string) {
    const lowercaseWord = word.trim().toLowerCase();
    const cacheKey = `dictionary:${lowercaseWord}`;

    // 1. Try reading from Redis cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      logger.info({ word: lowercaseWord }, 'Word definition cache HIT');

      // Async (fire-and-forget) history logging
      this.historyRepo.addHistory(userId, lowercaseWord).catch((err) => {
        logger.error({ err, userId, word: lowercaseWord }, 'Async history logging failed');
      });

      return {
        definition: JSON.parse(cachedData),
        cacheHeader: 'HIT',
      };
    }

    // 2. Cache MISS: call resilient external dictionary client
    logger.info({ word: lowercaseWord }, 'Word definition cache MISS');
    let definition;
    try {
      definition = await this.dictionaryProvider.getDefinition(lowercaseWord);
    } catch (error: any) {
      if (error.message === 'Word not found in the dictionary') {
        throw new AppError(404, 'Word not found in the dictionary');
      }
      throw error;
    }

    // 3. Write definition response to Cache (24-hour TTL)
    await setCache(cacheKey, JSON.stringify(definition));

    // 4. Async (fire-and-forget) history logging
    this.historyRepo.addHistory(userId, lowercaseWord).catch((err) => {
      logger.error({ err, userId, word: lowercaseWord }, 'Async history logging failed');
    });

    return {
      definition,
      cacheHeader: 'MISS',
    };
  }

  async favoriteWord(userId: string, word: string) {
    const lowercaseWord = word.trim().toLowerCase();
    return this.favoriteRepo.addFavorite(userId, lowercaseWord);
  }

  async unfavoriteWord(userId: string, word: string) {
    const lowercaseWord = word.trim().toLowerCase();
    return this.favoriteRepo.removeFavorite(userId, lowercaseWord);
  }
}
export const entriesService = new EntriesService();
export default entriesService;
