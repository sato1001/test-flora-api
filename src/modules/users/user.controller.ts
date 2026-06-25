import { Request, Response, NextFunction } from 'express';
import { userService, UserService } from './user.service';

export class UserController {
  constructor(private readonly service: UserService = userService) {}

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = req.user!.id;
      const user = await this.service.getProfile(userId);
      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = req.user!.id;
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const history = await this.service.getHistory(userId, page, limit);
      return res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  };

  getFavorites = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = req.user!.id;
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const favorites = await this.service.getFavorites(userId, page, limit);
      return res.status(200).json(favorites);
    } catch (error) {
      next(error);
    }
  };
}
export const userController = new UserController();
export default userController;
