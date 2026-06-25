import { userRepository, UserRepository } from './user.repository';
import { favoriteRepository, FavoriteRepository } from '../entries/favorite.repository';
import { historyRepository, HistoryRepository } from '../entries/history.repository';
import { AppError } from '../../utils/errors';

export class UserService {
  constructor(
    private readonly userRepo: UserRepository = userRepository,
    private readonly favoriteRepo: FavoriteRepository = favoriteRepository,
    private readonly historyRepo: HistoryRepository = historyRepository
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return user;
  }

  async getHistory(userId: string, page: number, limit: number) {
    return this.historyRepo.listHistory(userId, page, limit);
  }

  async getFavorites(userId: string, page: number, limit: number) {
    return this.favoriteRepo.listFavorites(userId, page, limit);
  }
}
export const userService = new UserService();
export default userService;
