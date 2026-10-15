/** OpenAPI contract for the routes mounted under /api/v1 (src/app/routes/index.ts). */
export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Agri-Smart API',
    version: '1.0.0',
    description:
      'API contract for Agri-Smart. All paths are relative to the selected server URL. Successful API responses use the standard envelope; validation and application errors use the error envelope.',
    contact: { name: 'Agri-Smart Development Team', email: 'support@agrismart.com' },
  },
  servers: [
    { url: 'http://localhost:5000/api/v1', description: 'Local development' },
    { url: 'https://agri-smart-api-meud.onrender.com/api/v1', description: 'Production' },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Profile' },
    { name: 'Farms' },
    { name: 'Dashboard' },
    { name: 'Crop Recommendations' },
    { name: 'Disease Detection' },
    { name: 'AI Assistant' },
    { name: 'Notifications' },
    { name: 'Admin' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description:
          'Refresh-token cookie set by login and refresh-token; sent automatically by cookie-enabled clients.',
      },
    },
    parameters: {
      page: {
        name: 'page',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1 },
        description: 'One-based page number.',
      },
      limit: {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100 },
      },
    },
    schemas: {
      SuccessEnvelope: {
        type: 'object',
        required: ['statusCode', 'success', 'message', 'data'],
        properties: {
          statusCode: { type: 'integer', example: 200 },
          success: { type: 'boolean', enum: [true] },
          message: { type: 'string' },
          data: { description: 'Endpoint-specific result; may be null.' },
          meta: {
            type: 'object',
            description: 'Present only when the handler supplies pagination metadata.',
          },
        },
      },
      ErrorEnvelope: {
        type: 'object',
        required: ['success', 'status', 'message'],
        properties: {
          success: { type: 'boolean', enum: [false] },
          status: { type: 'integer' },
          message: { type: 'string' },
          errorSources: { type: 'array', items: { $ref: '#/components/schemas/ErrorSource' } },
          retryAfter: { type: 'integer', description: 'Retry delay in seconds, when supplied.' },
          stack: { type: 'string', description: 'Included only in development.' },
        },
      },
      ErrorSource: {
        type: 'object',
        required: ['path', 'message'],
        properties: {
          path: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
          message: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66c9f0b123456789abcdef01' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['farmer', 'admin', 'super_admin'] },
          isEmailVerified: { type: 'boolean' },
          status: { type: 'string', enum: ['active', 'inactive', 'blocked', 'suspended'] },
          profileImage: { type: 'string', nullable: true },
          lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
          passwordChangedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Profile: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string', pattern: '^01[0-9]{9}$' },
          avatar: { type: 'string', format: 'uri' },
          address: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Farm: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          name: { type: 'string' },
          location: { type: 'string' },
          area: { type: 'number', exclusiveMinimum: 0 },
          areaUnit: { type: 'string', enum: ['acre', 'hectare', 'bigha', 'katha'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CropRecommendationInput: {
        type: 'object',
        additionalProperties: false,
        required: [
          'location',
          'fieldArea',
          'soilType',
          'soilPh',
          'nitrogen',
          'phosphorus',
          'potassium',
          'averageTemperature',
          'annualRainfall',
        ],
        properties: {
          location: { type: 'string', minLength: 1 },
          fieldArea: { type: 'number', exclusiveMinimum: 0 },
          soilType: { type: 'string', minLength: 1 },
          soilPh: { type: 'number', minimum: 0, maximum: 14 },
          nitrogen: { type: 'number', minimum: 0 },
          phosphorus: { type: 'number', minimum: 0 },
          potassium: { type: 'number', minimum: 0 },
          averageTemperature: { type: 'number' },
          annualRainfall: { type: 'number', minimum: 0 },
        },
      },
      CropRecommendation: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          profileId: { type: 'string' },
          inputParameters: { $ref: '#/components/schemas/CropRecommendationInput' },
          recommendationResult: {
            type: 'object',
            nullable: true,
            properties: {
              recommendedCrops: { type: 'array', items: { type: 'string' } },
              explanation: { type: 'string' },
              confidence: { type: 'number', minimum: 0, maximum: 1, nullable: true },
            },
          },
          processingStatus: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'failed'],
          },
          requestedAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DiseaseReport: {
        type: 'object',
        description: 'Disease report document returned by the disease-detection module.',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          profileId: { type: 'string' },
          image: {
            type: 'object',
            properties: { url: { type: 'string', format: 'uri' }, publicId: { type: 'string' } },
          },
          processingStatus: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'failed'],
          },
          diagnosisResult: {
            type: 'object',
            nullable: true,
            properties: {
              disease: { type: 'string' },
              explanation: { type: 'string' },
              recommendedActions: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number', minimum: 0, maximum: 1, nullable: true },
            },
          },
          requestedAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Conversation: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          profileId: { type: 'string', nullable: true },
          title: { type: 'string' },
          status: { type: 'string', enum: ['active', 'completed'] },
          lastActivityAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Message: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          conversationId: { type: 'string' },
          role: { type: 'string', enum: ['user', 'assistant'] },
          content: { type: 'string' },
          status: { type: 'string', enum: ['completed', 'failed'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          type: {
            type: 'string',
            enum: ['system', 'account', 'ai', 'disease_detection', 'crop_recommendation'],
          },
          status: { type: 'string', enum: ['unread', 'read'] },
          title: { type: 'string' },
          message: { type: 'string' },
          metadata: { nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', example: '66c9f0b123456789abcdef01' },
    },
    responses: {
      BadRequest: {
        description: 'Invalid request, validation failure, or malformed identifier.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      Unauthorized: {
        description: 'Authentication is missing or invalid.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      Forbidden: {
        description: 'The authenticated user is not allowed to perform this operation.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      NotFound: {
        description: 'Requested resource was not found.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      TooManyRequests: {
        description: 'Rate limit exceeded. A Retry-After header may be supplied.',
        headers: { 'Retry-After': { schema: { type: 'integer' } } },
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      ServerError: {
        description: 'Unexpected server error.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check server and database health',
        responses: {
          200: {
            description: 'Database connection is healthy.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status', 'timeStamp', 'database'],
                  properties: {
                    status: { type: 'string', enum: ['UP'] },
                    timeStamp: { type: 'string', format: 'date-time' },
                    database: { type: 'string', enum: ['connected'] },
                  },
                },
              },
            },
          },
          500: {
            description: 'Database is disconnected.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['DOWN'] },
                    timeStamp: { type: 'string', format: 'date-time' },
                    database: { type: 'string', enum: ['disconnected'] },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register an account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 100 },
                  email: { type: 'string', format: 'email' },
                  password: {
                    type: 'string',
                    minLength: 8,
                    maxLength: 100,
                    description:
                      'Must include an uppercase letter, a number, and a special character.',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registration accepted; verification email is sent.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          409: { description: 'Email already exists.' },
          429: { $ref: '#/components/responses/TooManyRequests' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email address',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['token'],
                properties: { token: { type: 'string', minLength: 1 } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Email verified.' },
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/auth/resend-verification-email': {
      post: {
        tags: ['Auth'],
        summary: 'Resend email verification message',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              'Generic success response, regardless of account existence or verification state.',
          },
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate and create a session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Returns an access token and user; sets the refreshToken cookie.',
            headers: {
              'Set-Cookie': {
                schema: { type: 'string' },
                description: 'HttpOnly refreshToken cookie.',
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token and issue access token',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Returns an access token and rotates the refreshToken cookie.' },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'End the current refresh-token session',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Session ended and refresh cookie cleared.' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/auth/logout-all': {
      post: {
        tags: ['Auth'],
        summary: 'End all sessions for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'All sessions ended and refresh cookie cleared.' },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change password for authenticated user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', minLength: 1 },
                  newPassword: {
                    type: 'string',
                    minLength: 8,
                    maxLength: 100,
                    description:
                      'Must include an uppercase letter, a number, and a special character.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password changed; refresh cookie cleared.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Generic success response to avoid disclosing account existence.' },
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with emailed token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['token', 'newPassword'],
                properties: {
                  token: { type: 'string', minLength: 1 },
                  newPassword: {
                    type: 'string',
                    minLength: 8,
                    maxLength: 100,
                    description:
                      'Must include an uppercase letter, a number, and a special character.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset; refresh cookie cleared.' },
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/profile/me': {
      get: {
        tags: ['Profile'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Profile returned.' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Profile'],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                minProperties: 1,
                properties: {
                  firstName: { type: 'string', minLength: 2, maxLength: 50 },
                  lastName: { type: 'string', minLength: 2, maxLength: 50 },
                  phone: { type: 'string', pattern: '^01[0-9]{9}$' },
                  avatar: { type: 'string', format: 'uri' },
                  address: { type: 'string', minLength: 5, maxLength: 300 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/farms': {
      get: {
        tags: ['Farms'],
        summary: 'List current user farms',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Farm array returned.' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Farms'],
        summary: 'Create a farm',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['name', 'location', 'area', 'areaUnit'],
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 100 },
                  location: { type: 'string', minLength: 2, maxLength: 300 },
                  area: { type: 'number', exclusiveMinimum: 0 },
                  areaUnit: { type: 'string', enum: ['acre', 'hectare', 'bigha', 'katha'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Farm created.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/farms/{farmId}': {
      parameters: [
        { name: 'farmId', in: 'path', required: true, schema: { $ref: '#/components/schemas/Id' } },
      ],
      get: {
        tags: ['Farms'],
        summary: 'Get one of the current user farms',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Farm returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Farms'],
        summary: 'Update a farm',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                minProperties: 1,
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 100 },
                  location: { type: 'string', minLength: 2, maxLength: 300 },
                  area: { type: 'number', exclusiveMinimum: 0 },
                  areaUnit: { type: 'string', enum: ['acre', 'hectare', 'bigha', 'katha'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Farm updated.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Farms'],
        summary: 'Delete a farm',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Farm deleted; data is null.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get current user dashboard',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Dashboard data returned.' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/crop-recommendations': {
      post: {
        tags: ['Crop Recommendations'],
        summary: 'Generate a crop recommendation',
        description:
          'Creates the recommendation synchronously; the handler responds with HTTP 201.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['profileId', 'inputParameters'],
                properties: {
                  profileId: { type: 'string', minLength: 1 },
                  inputParameters: { $ref: '#/components/schemas/CropRecommendationInput' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Recommendation generated.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
      get: {
        tags: ['Crop Recommendations'],
        summary: 'List current user recommendations',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Recommendation array returned.' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/crop-recommendations/{recommendationId}': {
      parameters: [
        {
          name: 'recommendationId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/Id' },
        },
      ],
      get: {
        tags: ['Crop Recommendations'],
        summary: 'Get one recommendation',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Recommendation returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Crop Recommendations'],
        summary: 'Delete one recommendation',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Recommendation deleted; data is null.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/disease-detection': {
      post: {
        tags: ['Disease Detection'],
        summary: 'Upload an image for disease detection',
        description:
          'Send multipart form data. The image field is processed by Multer; profileId is required in the same form. Image upload limits and accepted formats are enforced by upload middleware.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image', 'profileId'],
                properties: {
                  image: { type: 'string', format: 'binary' },
                  profileId: { type: 'string', minLength: 1 },
                },
              },
              encoding: { image: { contentType: 'image/*' } },
            },
          },
        },
        responses: {
          201: { description: 'Report created and analysis job queued.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
      get: {
        tags: ['Disease Detection'],
        summary: 'List current user disease reports',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Disease report array returned.' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/disease-detection/{reportId}': {
      parameters: [
        {
          name: 'reportId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/Id' },
        },
      ],
      get: {
        tags: ['Disease Detection'],
        summary: 'Get one disease report',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Report returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Disease Detection'],
        summary: 'Delete one disease report',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Report deleted; data is null.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/ai-assistant': {
      post: {
        tags: ['AI Assistant'],
        summary: 'Create a conversation',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['title'],
                properties: {
                  profileId: { type: 'string', minLength: 1 },
                  title: { type: 'string', minLength: 1, maxLength: 200 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Conversation created.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      get: {
        tags: ['AI Assistant'],
        summary: 'List current user conversations',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Conversation array returned.' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/ai-assistant/{conversationId}': {
      parameters: [
        {
          name: 'conversationId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/Id' },
        },
      ],
      get: {
        tags: ['AI Assistant'],
        summary: 'Get one conversation',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Conversation returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['AI Assistant'],
        summary: 'Update conversation title or status',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                minProperties: 1,
                properties: {
                  title: { type: 'string', minLength: 1, maxLength: 200 },
                  status: { type: 'string', enum: ['active', 'completed'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Conversation updated.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['AI Assistant'],
        summary: 'Delete a conversation',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Conversation deleted; data is null.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/ai-assistant/{conversationId}/messages': {
      parameters: [
        {
          name: 'conversationId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/Id' },
        },
      ],
      post: {
        tags: ['AI Assistant'],
        summary: 'Send a message to the assistant',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['content'],
                properties: { content: { type: 'string', minLength: 1, maxLength: 5000 } },
              },
            },
          },
        },
        responses: {
          200: { description: 'User and assistant message result returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
      get: {
        tags: ['AI Assistant'],
        summary: 'List messages in a conversation',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Message array returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/notification': {
      get: {
        tags: ['Notifications'],
        summary: 'List current user notifications',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
        ],
        responses: {
          200: { description: 'Notification list with pagination and unread count.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/notification/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all current user notifications as read',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'All notifications marked read; data is null.' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/notification/{notificationId}': {
      parameters: [
        {
          name: 'notificationId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/Id' },
        },
      ],
      get: {
        tags: ['Notifications'],
        summary: 'Get one notification',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Notification returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Notifications'],
        summary: 'Delete one notification',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Notification deleted; data is null.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/notification/{notificationId}/read': {
      parameters: [
        {
          name: 'notificationId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/Id' },
        },
      ],
      patch: {
        tags: ['Notifications'],
        summary: 'Mark one notification as read',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Updated notification returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/admin/dashboard/statistics': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin dashboard statistics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Statistics returned.' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/ai-usage/statistics': {
      get: {
        tags: ['Admin'],
        summary: 'Get AI usage statistics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'AI usage statistics returned.' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List users (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string', minLength: 1 } },
          {
            name: 'role',
            in: 'query',
            schema: { type: 'string', enum: ['farmer', 'admin', 'super_admin'] },
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['active', 'inactive', 'blocked', 'suspended'] },
          },
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
        ],
        responses: {
          200: { description: 'Users and pagination returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/users/{userId}': {
      parameters: [
        { name: 'userId', in: 'path', required: true, schema: { $ref: '#/components/schemas/Id' } },
      ],
      get: {
        tags: ['Admin'],
        summary: 'Get a user (admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/admin/users/{userId}/status': {
      parameters: [
        { name: 'userId', in: 'path', required: true, schema: { $ref: '#/components/schemas/Id' } },
      ],
      patch: {
        tags: ['Admin'],
        summary: 'Update user status (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['active', 'inactive', 'blocked', 'suspended'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated user returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/admin/activity': {
      get: {
        tags: ['Admin'],
        summary: 'List admin audit activities',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'adminId', in: 'query', schema: { $ref: '#/components/schemas/Id' } },
          { name: 'targetUserId', in: 'query', schema: { $ref: '#/components/schemas/Id' } },
          {
            name: 'action',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'view_user',
                'view_users',
                'block_user',
                'unblock_user',
                'deactivate_user',
                'activate_user',
                'update_user_status',
                'view_dashboard_statistics',
                'view_ai_usage_statistics',
              ],
            },
          },
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
        ],
        responses: {
          200: { description: 'Activity list and pagination returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/activity/{activityId}': {
      parameters: [
        {
          name: 'activityId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/Id' },
        },
      ],
      get: {
        tags: ['Admin'],
        summary: 'Get one admin audit activity',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Activity returned.' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
};
