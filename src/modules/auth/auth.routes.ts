import { Router } from 'express';
import { authController } from './auth.controller';
import { signupSchema, signinSchema } from './auth.schema';
import { validate } from '../../middlewares/validate.middleware';

export const authRouter = Router();

authRouter.post('/signup', validate(signupSchema), authController.signup);
authRouter.post('/signin', validate(signinSchema), authController.signin);

export default authRouter;
