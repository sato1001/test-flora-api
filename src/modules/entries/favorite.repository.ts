import { Favorite } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { mapFavoriteToResponse } from './entries.mapper';

export class FavoriteRepository {
  async addFavorite(userId: string, word: string): Promise<Favorite> {
    return prisma.favorite.upsert({
      where: {
        userId_word: {
          userId,
          word,
        },
      },
      create: {
        userId,
        word,
      },
      update: {}, // Keep original creation time if already favorited
    });
  }

  async removeFavorite(userId: string, word: string): Promise<void> {
    await prisma.favorite.delete({
      where: {
        userId_word: {
          userId,
          word,
        },
      },
    });
  }

  async isFavorite(userId: string, word: string): Promise<boolean> {
    const fav = await prisma.favorite.findUnique({
      where: {
        userId_word: {
          userId,
          word,
        },
      },
    });
    return !!fav;
  }

  async listFavorites(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, totalDocs] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.favorite.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(totalDocs / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      results: items.map(mapFavoriteToResponse),
      totalDocs,
      page,
      totalPages,
      hasNext,
      hasPrev,
    };
  }
}
export const favoriteRepository = new FavoriteRepository();
export default favoriteRepository;
