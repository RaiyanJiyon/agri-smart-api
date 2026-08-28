export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Agri-Smart API Specification',
    version: '1.0.0',
    description:
      'Comprehensive RESTful API contract for the Agri-Smart platform, supporting AI-driven Crop Recommendation, Plant Disease Detection, Farm Management, AI Assistant, and Administrative Control.',
    contact: {
      name: 'Agri-Smart Development Team',
      email: 'support@agrismart.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
    {
      url: 'https://api.agrismart.com/api/v1',
      description: 'Production API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT Access Token in the format: `Bearer <token>`',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'Session Refresh Token cookie set automatically during login.',
      },
    },
    schemas: {
      ApiSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully.' },
          data: { type: 'object', nullable: true },
          meta: { type: 'object', nullable: true },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation or execution error message.' },
          errors: {
            type: 'array',
            items: { type: 'object' },
            nullable: true,
          },
          traceId: { type: 'string', example: 'req-12345' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66c9f0b123456789abcdef01' },
          email: { type: 'string', example: 'farmer@example.com' },
          isEmailVerified: { type: 'boolean', example: true },
          role: { type: 'string', enum: ['FARMER', 'EXPERT', 'ADMIN'], example: 'FARMER' },
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'BANNED'], example: 'ACTIVE' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Profile: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66c9f0b123456789abcdef02' },
          user: { type: 'string', example: '66c9f0b123456789abcdef01' },
          fullName: { type: 'string', example: 'Raiyan Jiyon' },
          phoneNumber: { type: 'string', example: '+8801700000000' },
          avatarUrl: {
            type: 'string',
            example: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
          },
          bio: { type: 'string', example: 'Organic crop farmer from Bogura.' },
          location: {
            type: 'object',
            properties: {
              division: { type: 'string', example: 'Rajshahi' },
              district: { type: 'string', example: 'Bogura' },
              upazila: { type: 'string', example: 'Sadar' },
            },
          },
        },
      },
      Farm: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66c9f0b123456789abcdef03' },
          userId: { type: 'string', example: '66c9f0b123456789abcdef01' },
          farmName: { type: 'string', example: 'Green Valley Paddy Farm' },
          sizeInAcres: { type: 'number', example: 5.5 },
          soilType: { type: 'string', example: 'Clay Loam' },
          cropTypes: { type: 'array', items: { type: 'string' }, example: ['Rice', 'Potato'] },
        },
      },
      CropRecommendation: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66c9f0b123456789abcdef04' },
          userId: { type: 'string', example: '66c9f0b123456789abcdef01' },
          inputParameters: {
            type: 'object',
            properties: {
              nitrogen: { type: 'number', example: 90 },
              phosphorus: { type: 'number', example: 42 },
              potassium: { type: 'number', example: 43 },
              temperature: { type: 'number', example: 25.5 },
              humidity: { type: 'number', example: 82.0 },
              ph: { type: 'number', example: 6.5 },
              rainfall: { type: 'number', example: 202.9 },
            },
          },
          processingStatus: {
            type: 'string',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
            example: 'COMPLETED',
          },
          recommendationResult: {
            type: 'object',
            properties: {
              recommendedCrop: { type: 'string', example: 'Rice' },
              confidence: { type: 'number', example: 0.95 },
              rationale: { type: 'string', example: 'Optimal humidity and nitrogen content.' },
            },
          },
        },
      },
      DiseaseReport: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66c9f0b123456789abcdef05' },
          userId: { type: 'string', example: '66c9f0b123456789abcdef01' },
          imageUrl: {
            type: 'string',
            example: 'https://res.cloudinary.com/cloud/image/upload/leaf.jpg',
          },
          processingStatus: {
            type: 'string',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
            example: 'COMPLETED',
          },
          diagnosisResult: {
            type: 'object',
            properties: {
              diseaseName: { type: 'string', example: 'Early Blight' },
              confidence: { type: 'number', example: 0.92 },
              remedies: {
                type: 'array',
                items: { type: 'string' },
                example: ['Apply copper-based fungicide.'],
              },
            },
          },
        },
      },
      Conversation: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66c9f0b123456789abcdef06' },
          userId: { type: 'string', example: '66c9f0b123456789abcdef01' },
          title: { type: 'string', example: 'Pesticide Selection Advice' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Message: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66c9f0b123456789abcdef07' },
          conversationId: { type: 'string', example: '66c9f0b123456789abcdef06' },
          sender: { type: 'string', enum: ['USER', 'ASSISTANT'], example: 'USER' },
          content: { type: 'string', example: 'What fertilizer is best for tomatoes?' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Check API Server Health Status',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new user account',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'fullName'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'farmer@example.com' },
                  password: { type: 'string', minLength: 8, example: 'StrongP@ss123' },
                  fullName: { type: 'string', example: 'Raiyan Jiyon' },
                  role: { type: 'string', enum: ['FARMER', 'EXPERT'], example: 'FARMER' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user and obtain JWT tokens',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'farmer@example.com' },
                  password: { type: 'string', example: 'StrongP@ss123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Log out current session',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Logged out successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/refresh-token': {
      post: {
        summary: 'Refresh JWT Access Token using refresh cookie',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Access token refreshed successfully' },
          401: { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Retrieve authenticated user identity',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User profile retrieved successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/profile': {
      get: {
        summary: 'Retrieve current user profile details',
        tags: ['Profile'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Profile retrieved successfully' },
          401: { description: 'Unauthorized' },
        },
      },
      patch: {
        summary: 'Update current user profile information',
        tags: ['Profile'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string', example: 'Raiyan Jiyon' },
                  phoneNumber: { type: 'string', example: '+8801700000000' },
                  bio: { type: 'string', example: 'Updated farmer profile' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/farms': {
      get: {
        summary: 'List user farm records',
        tags: ['Farm'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Farms retrieved successfully' },
        },
      },
      post: {
        summary: 'Create a new farm profile',
        tags: ['Farm'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['farmName', 'sizeInAcres'],
                properties: {
                  farmName: { type: 'string', example: 'Green Meadow Farm' },
                  sizeInAcres: { type: 'number', example: 10.5 },
                  cropTypes: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['Paddy', 'Wheat'],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Farm created successfully' },
        },
      },
    },
    '/dashboard': {
      get: {
        summary: 'Retrieve personalized dashboard overview metrics',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Dashboard metrics retrieved successfully' },
        },
      },
    },
    '/crop-recommendations': {
      post: {
        summary: 'Submit soil and climate parameters for crop recommendation',
        tags: ['Crop Recommendation'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'nitrogen',
                  'phosphorus',
                  'potassium',
                  'temperature',
                  'humidity',
                  'ph',
                  'rainfall',
                ],
                properties: {
                  nitrogen: { type: 'number', example: 90 },
                  phosphorus: { type: 'number', example: 42 },
                  potassium: { type: 'number', example: 43 },
                  temperature: { type: 'number', example: 25.5 },
                  humidity: { type: 'number', example: 82.0 },
                  ph: { type: 'number', example: 6.5 },
                  rainfall: { type: 'number', example: 202.9 },
                },
              },
            },
          },
        },
        responses: {
          202: { description: 'Recommendation request queued successfully' },
        },
      },
      get: {
        summary: 'Get historical crop recommendations list',
        tags: ['Crop Recommendation'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Recommendation history retrieved' },
        },
      },
    },
    '/disease-detection': {
      post: {
        summary: 'Submit crop image URL for automated disease diagnosis',
        tags: ['Disease Detection'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['imageUrl'],
                properties: {
                  imageUrl: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://res.cloudinary.com/cloud/image/upload/sample.jpg',
                  },
                },
              },
            },
          },
        },
        responses: {
          202: { description: 'Disease analysis job queued' },
        },
      },
      get: {
        summary: 'Retrieve disease detection report history',
        tags: ['Disease Detection'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Disease reports list retrieved' },
        },
      },
    },
    '/ai-assistant/conversations': {
      post: {
        summary: 'Start a new AI Assistant conversation session',
        tags: ['AI Assistant'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Irrigation Strategy' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Conversation started' },
        },
      },
      get: {
        summary: 'List user AI assistant conversations',
        tags: ['AI Assistant'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Conversations retrieved' },
        },
      },
    },
    '/admin/users': {
      get: {
        summary: 'List system users (Admin Access Required)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User list retrieved' },
          403: { description: 'Forbidden - Admin privileges required' },
        },
      },
    },
    '/admin/activities': {
      get: {
        summary: 'Retrieve administrative action audit log',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Admin activity audit logs retrieved' },
          403: { description: 'Forbidden' },
        },
      },
    },
  },
};
