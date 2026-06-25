import { prisma } from '../../database/prisma';

export class EntriesRepository {
  async countWords(search?: string): Promise<number> {
    return prisma.dictionaryWord.count({
      where: search
        ? {
            word: {
              startsWith: search,
              mode: 'insensitive',
            },
          }
        : undefined,
    });
  }

  async getWordsOffset(limit: number, page: number, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.word = {
        startsWith: search,
        mode: 'insensitive',
      };
    }

    return prisma.dictionaryWord.findMany({
      where,
      orderBy: { word: 'asc' },
      skip,
      take: limit,
    });
  }

  async getWordsCursor(limit: number, cursor?: string, search?: string) {
    const where: any = {};
    if (search) {
      where.word = {
        startsWith: search,
        mode: 'insensitive',
      };
    }
    if (cursor) {
      where.word = {
        ...where.word,
        gt: cursor,
      };
    }

    return prisma.dictionaryWord.findMany({
      where,
      orderBy: { word: 'asc' },
      take: limit,
    });
  }
}
export const entriesRepository = new EntriesRepository();
export default entriesRepository;
