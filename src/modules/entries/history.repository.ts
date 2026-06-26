import { History } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { mapHistoryToResponse } from './entries.mapper';

export class HistoryRepository {
  async addHistory(userId: string, word: string): Promise<History> {
    return prisma.history.create({
      data: {
        userId,
        word,
      },
    });
  }

  async listHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, totalDocs] = await Promise.all([
      prisma.history.findMany({
        where: { userId },
        orderBy: { accessedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.history.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(totalDocs / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      results: items.map(mapHistoryToResponse),
      totalDocs,
      page,
      totalPages,
      hasNext,
      hasPrev,
    };
  }
}
export const historyRepository = new HistoryRepository();
export default historyRepository;
