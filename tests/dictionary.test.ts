import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { prisma } from '../src/database/prisma';
import * as redisModule from '../src/cache/redis';
import { env } from '../src/config/env';

// Mock DB client
vi.mock('../src/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    dictionaryWord: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    favorite: {
      upsert: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    history: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock Cache
vi.mock('../src/cache/redis', () => ({
  connectRedis: vi.fn(),
  disconnectRedis: vi.fn(),
  getCache: vi.fn(),
  setCache: vi.fn(),
}));

// Mock External Provider
vi.mock('../src/integrations/dictionary/FreeDictionaryProvider', () => {
  return {
    FreeDictionaryProvider: vi.fn().mockImplementation(() => ({
      getDefinition: vi.fn().mockImplementation(async (word: string) => {
        if (word === 'notfound') {
          throw new Error('Word not found in the dictionary');
        }
        return [{ word, meanings: [] }];
      }),
    })),
  };
});

describe('English Dictionary API Tests', () => {
  const testUser = { id: 'user-uuid-123', name: 'John Doe', email: 'john@example.com' };
  const validToken = jwt.sign(testUser, env.JWT_SECRET);
  const authHeader = `Bearer ${validToken}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /health & GET /', () => {
    it('should return health check status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });

    it('should return API message on base path', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'English Dictionary' });
    });
  });

  describe('Auth Module', () => {
    it('should register a new user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'user-uuid-123',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/auth/signup')
        .send({ name: 'John Doe', email: 'john@example.com', password: 'securePassword123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toEqual({
        id: 'user-uuid-123',
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should login an existing user', async () => {
      const passwordHash = await bcrypt.hash('securePassword123', 10);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-uuid-123',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/auth/signin')
        .send({ email: 'john@example.com', password: 'securePassword123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail login with incorrect password', async () => {
      const passwordHash = await bcrypt.hash('securePassword123', 10);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-uuid-123',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/auth/signin')
        .send({ email: 'john@example.com', password: 'wrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });
  });

  describe('Entries Module', () => {
    it('should list words with offset pagination', async () => {
      vi.mocked(prisma.dictionaryWord.count).mockResolvedValue(100);
      vi.mocked(prisma.dictionaryWord.findMany).mockResolvedValue([
        { id: '1', word: 'apple', createdAt: new Date() },
        { id: '2', word: 'apricot', createdAt: new Date() },
      ]);

      const res = await request(app)
        .get('/entries/en?limit=2&page=1')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.results).toEqual(['apple', 'apricot']);
      expect(res.body.totalDocs).toBe(100);
      expect(res.body.page).toBe(1);
    });

    it('should return 401 for listing words without authorization', async () => {
      const res = await request(app).get('/entries/en?limit=2&page=1');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Authentication token is missing');
    });

    it('should define word (cache MISS, call provider)', async () => {
      vi.mocked(redisModule.getCache).mockResolvedValue(null);
      vi.mocked(prisma.history.create).mockResolvedValue({
        id: 'h1',
        userId: 'user-uuid-123',
        word: 'apple',
        accessedAt: new Date(),
      });

      const res = await request(app)
        .get('/entries/en/apple')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.headers['x-cache']).toBe('MISS');
      expect(res.body).toEqual([{ word: 'apple', meanings: [] }]);
    });

    it('should define word (cache HIT)', async () => {
      const mockCachedDefinition = [{ word: 'apple', meanings: ['a fruit'] }];
      vi.mocked(redisModule.getCache).mockResolvedValue(JSON.stringify(mockCachedDefinition));

      const res = await request(app)
        .get('/entries/en/apple')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.headers['x-cache']).toBe('HIT');
      expect(res.body).toEqual(mockCachedDefinition);
    });

    it('should return 404 for word not found', async () => {
      vi.mocked(redisModule.getCache).mockResolvedValue(null);

      const res = await request(app)
        .get('/entries/en/notfound')
        .set('Authorization', authHeader);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Word not found in the dictionary');
    });

    it('should favorite a word', async () => {
      vi.mocked(prisma.favorite.upsert).mockResolvedValue({
        id: 'f1',
        userId: 'user-uuid-123',
        word: 'apple',
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/entries/en/apple/favorite')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Word 'apple' favorited successfully");
    });

    it('should unfavorite a word', async () => {
      vi.mocked(prisma.favorite.delete).mockResolvedValue({
        id: 'f1',
        userId: 'user-uuid-123',
        word: 'apple',
        createdAt: new Date(),
      });

      const res = await request(app)
        .delete('/entries/en/apple/unfavorite')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Word 'apple' unfavorited successfully");
    });
  });

  describe('User Module', () => {
    it('should return current authenticated user profile', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-uuid-123',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .get('/user/me')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 'user-uuid-123',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return paginated history', async () => {
      vi.mocked(prisma.history.count).mockResolvedValue(1);
      vi.mocked(prisma.history.findMany).mockResolvedValue([
        { id: 'h1', userId: 'user-uuid-123', word: 'apple', accessedAt: new Date() },
      ]);

      const res = await request(app)
        .get('/user/me/history?limit=5&page=1')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.results).toEqual([{ word: 'apple', accessedAt: expect.any(String) }]);
      expect(res.body.totalDocs).toBe(1);
    });

    it('should return paginated favorites', async () => {
      vi.mocked(prisma.favorite.count).mockResolvedValue(1);
      vi.mocked(prisma.favorite.findMany).mockResolvedValue([
        { id: 'f1', userId: 'user-uuid-123', word: 'apricot', createdAt: new Date() },
      ]);

      const res = await request(app)
        .get('/user/me/favorites?limit=5&page=1')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.results).toEqual([{ word: 'apricot', addedAt: expect.any(String) }]);
      expect(res.body.totalDocs).toBe(1);
    });
  });
});
