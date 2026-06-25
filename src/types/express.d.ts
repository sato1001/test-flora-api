import { TokenPayload } from '../middlewares/auth.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
