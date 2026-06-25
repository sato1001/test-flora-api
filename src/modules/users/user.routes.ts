import { Router } from 'express';
import { userController } from './user.controller';
import { userPaginationSchema } from './user.schema';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

export const userRouter = Router();

// Apply auth middleware to all user endpoints
userRouter.use(authMiddleware);

userRouter.get('/me', userController.getMe);
userRouter.get('/me/history', validate(userPaginationSchema), userController.getHistory);
userRouter.get('/me/favorites', validate(userPaginationSchema), userController.getFavorites);

export default userRouter;
