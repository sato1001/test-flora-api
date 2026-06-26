import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'English Dictionary API',
      version: '1.0.0',
      description: 'A robust Node.js REST API for managing an English dictionary, user accounts, query history, and favorites.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            token: { type: 'string', example: 'Bearer JWT.Token' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            totalDocs: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
    paths: {
      '/': {
        get: {
          summary: 'Base Route',
          description: 'Returns API message to verify it is online.',
          responses: {
            200: {
              description: 'Successful Response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: 'English Dictionary' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/health': {
        get: {
          summary: 'Health Check',
          description: 'Returns API health status.',
          responses: {
            200: {
              description: 'Successful Response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/auth/signup': {
        post: {
          summary: 'Register User',
          description: 'Create a new user account and returns a session JWT token.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', format: 'password', example: 'securePassword123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            400: { description: 'Validation failed or email already exists' },
          },
        },
      },
      '/auth/signin': {
        post: {
          summary: 'Login User',
          description: 'Authenticate user credentials and returns a session JWT token.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', format: 'password', example: 'securePassword123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Logged in successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            401: { description: 'Invalid email or password' },
          },
        },
      },
      '/entries/en': {
        get: {
          summary: 'List & Search Words',
          description: 'List words from the imported dictionary. Supports both standard offset-based pagination and cursor-based pagination.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Prefix search pattern' },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 }, description: 'Page size' },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Offset page number (when cursor is not used)' },
            { in: 'query', name: 'cursor', schema: { type: 'string' }, description: 'Word to act as the cursor (lexicographical pagination)' },
          ],
          responses: {
            200: {
              description: 'Word List retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      results: { type: 'array', items: { type: 'string' } },
                      totalDocs: { type: 'integer' },
                      page: { type: 'integer' },
                      totalPages: { type: 'integer' },
                      limit: { type: 'integer' },
                      nextCursor: { type: 'string' },
                      hasNext: { type: 'boolean' },
                      hasPrev: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/entries/en/{word}': {
        get: {
          summary: 'Word definition lookup',
          description: 'Get definition for a word. Tries cache first, then calls external provider.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'word', required: true, schema: { type: 'string' }, description: 'Word to define' },
          ],
          responses: {
            200: {
              description: 'Word definition',
              headers: {
                'x-cache': { schema: { type: 'string' }, description: 'HIT or MISS' },
                'x-response-time': { schema: { type: 'string' }, description: 'Response duration in ms' },
              },
            },
            401: { description: 'Unauthorized' },
            404: { description: 'Word not found' },
          },
        },
      },
      '/entries/en/{word}/favorite': {
        post: {
          summary: 'Favorite a word',
          description: 'Add a word to the user\'s favorites.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'word', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Word favorited successfully' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/entries/en/{word}/unfavorite': {
        delete: {
          summary: 'Unfavorite a word',
          description: 'Remove a word from the user\'s favorites.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: 'path', name: 'word', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Word unfavorited successfully' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/user/me': {
        get: {
          summary: 'Get User Profile',
          description: 'Get authenticated user details.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'User details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/user/me/history': {
        get: {
          summary: 'Get Search History',
          description: 'Retrieve paginated query history for the authenticated user.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: {
              description: 'Search history list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            word: { type: 'string' },
                            added: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                      totalDocs: { type: 'integer' },
                      page: { type: 'integer' },
                      totalPages: { type: 'integer' },
                      hasNext: { type: 'boolean' },
                      hasPrev: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/user/me/favorites': {
        get: {
          summary: 'Get Favorites',
          description: 'Retrieve paginated favorited words for the authenticated user.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: {
              description: 'Favorites list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            word: { type: 'string' },
                            added: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                      totalDocs: { type: 'integer' },
                      page: { type: 'integer' },
                      totalPages: { type: 'integer' },
                      hasNext: { type: 'boolean' },
                      hasPrev: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
