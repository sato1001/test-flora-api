import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  signup = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { name, email, password } = req.body;
      const result = await this.service.signup(name, email, password);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  signin = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { email, password } = req.body;
      const result = await this.service.signin(email, password);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
export const authController = new AuthController();
