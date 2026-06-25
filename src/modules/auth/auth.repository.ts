import { User } from '@prisma/client';
import { prisma } from '../../database/prisma';

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(name: string, email: string, passwordHash: string): Promise<User> {
    return prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });
  }
}
export const authRepository = new AuthRepository();
