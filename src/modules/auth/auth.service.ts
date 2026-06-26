import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authRepository, AuthRepository } from './auth.repository';
import { AppError } from '../../utils/errors';
import { env } from '../../config/env';

export class AuthService {
  constructor(private readonly repository: AuthRepository = authRepository) {}

  private generateToken(payload: { id: string; name: string; email: string }): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '7d', // Token valid for 7 days
    });
  }

  async signup(name: string, email: string, password: string) {
    const existingUser = await this.repository.findByEmail(email);
    if (existingUser) {
      throw new AppError(400, 'A user with this email address already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await this.repository.createUser(name, email, passwordHash);

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    const token = this.generateToken(payload);

    return {
      id: user.id,
      name: user.name,
      token: `Bearer ${token}`,
    };
  }

  async signin(email: string, password: string) {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError(401, 'Invalid email or password');
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    const token = this.generateToken(payload);

    return {
      id: user.id,
      name: user.name,
      token: `Bearer ${token}`,
    };
  }
}
export const authService = new AuthService();
