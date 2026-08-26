/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../../../src/app.js';
import { AuthModel } from '../../../../src/app/modules/auth/auth.model.js';
import { ProfileModel } from '../../../../src/app/modules/profile/profile.model.js';
import { ConversationModel } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.model.js';
import { MessageModel } from '../../../../src/app/modules/ai-assistant/message/message.model.js';
import { USER_STATUS } from '../../../../src/app/modules/auth/auth.constant.js';
import { CONVERSATION_STATUS } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.constant.js';
import {
  MESSAGE_ROLE,
  MESSAGE_STATUS,
} from '../../../../src/app/modules/ai-assistant/message/message.constant.js';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';

vi.mock('../../../../src/app/shared/ai/ai.service.js', () => ({
  aiService: {
    generateChatResponse: vi.fn().mockResolvedValue({
      message: 'For rice blast disease, apply recommended fungicide and manage water levels.',
    }),
  },
}));

describe('AI Assistant API', () => {
  let accessToken: string;
  let userId: mongoose.Types.ObjectId;
  let profileId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    userId = new mongoose.Types.ObjectId();
    profileId = new mongoose.Types.ObjectId();

    const hashedPassword = await hashPassword('Password123!');

    await AuthModel.create({
      _id: userId,
      name: 'Test Farmer',
      email: 'aifarmer@example.com',
      password: hashedPassword,
      role: 'farmer',
      isEmailVerified: true,
      status: USER_STATUS.ACTIVE,
      passwordChangedAt: new Date(),
    });

    await ProfileModel.create({
      _id: profileId,
      userId,
      firstName: 'Test',
      lastName: 'Farmer',
      address: 'Bogura, Bangladesh',
    });

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'aifarmer@example.com',
      password: 'Password123!',
    });

    expect(loginResponse.status).toBe(200);
    accessToken = loginResponse.body.data.accessToken;
    expect(accessToken).toBeDefined();
  });

  // ============================================================
  // POST /api/v1/ai-assistant (Create Conversation)
  // ============================================================

  describe('POST /api/v1/ai-assistant', () => {
    it('should create a new conversation successfully', async () => {
      const response = await request(app)
        .post('/api/v1/ai-assistant')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profileId: profileId.toString(),
          title: 'Pest Management Consultation',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Conversation created successfully.');
      expect(response.body.data.title).toBe('Pest Management Consultation');
      expect(response.body.data.status).toBe(CONVERSATION_STATUS.ACTIVE);
      expect(response.body.data.userId).toBe(userId.toString());

      const stored = await ConversationModel.findById(response.body.data._id);
      expect(stored).not.toBeNull();
    });

    it('should return 400 Bad Request when title is missing', async () => {
      const response = await request(app)
        .post('/api/v1/ai-assistant')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profileId: profileId.toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 Unauthorized when unauthenticated', async () => {
      const response = await request(app).post('/api/v1/ai-assistant').send({
        title: 'Title',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 Forbidden when using another user profileId', async () => {
      const otherProfileId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/v1/ai-assistant')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profileId: otherProfileId.toString(),
          title: 'Test Conversation',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // GET /api/v1/ai-assistant (Get Conversations)
  // ============================================================

  describe('GET /api/v1/ai-assistant', () => {
    it('should return user conversations', async () => {
      await ConversationModel.create([
        {
          userId,
          title: 'First Chat',
          status: CONVERSATION_STATUS.ACTIVE,
          lastActivityAt: new Date(Date.now() - 1000),
        },
        {
          userId,
          title: 'Second Chat',
          status: CONVERSATION_STATUS.ACTIVE,
          lastActivityAt: new Date(),
        },
      ]);

      const response = await request(app)
        .get('/api/v1/ai-assistant')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].title).toBe('Second Chat');
    });
  });

  // ============================================================
  // GET /api/v1/ai-assistant/:conversationId
  // ============================================================

  describe('GET /api/v1/ai-assistant/:conversationId', () => {
    it('should return a conversation by ID', async () => {
      const conversation = await ConversationModel.create({
        userId,
        title: 'Soil Health',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(),
      });

      const response = await request(app)
        .get(`/api/v1/ai-assistant/${conversation._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Soil Health');
    });

    it('should return 404 when conversation does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/ai-assistant/${nonExistentId.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // PATCH /api/v1/ai-assistant/:conversationId
  // ============================================================

  describe('PATCH /api/v1/ai-assistant/:conversationId', () => {
    it('should update conversation title and status successfully', async () => {
      const conversation = await ConversationModel.create({
        userId,
        title: 'Old Title',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(),
      });

      const response = await request(app)
        .patch(`/api/v1/ai-assistant/${conversation._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'New Title',
          status: CONVERSATION_STATUS.COMPLETED,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Title');
      expect(response.body.data.status).toBe(CONVERSATION_STATUS.COMPLETED);
    });
  });

  // ============================================================
  // DELETE /api/v1/ai-assistant/:conversationId
  // ============================================================

  describe('DELETE /api/v1/ai-assistant/:conversationId', () => {
    it('should soft delete conversation (mark completed)', async () => {
      const conversation = await ConversationModel.create({
        userId,
        title: 'Active Chat',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(),
      });

      const response = await request(app)
        .delete(`/api/v1/ai-assistant/${conversation._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const stored = await ConversationModel.findById(conversation._id);
      expect(stored?.status).toBe(CONVERSATION_STATUS.COMPLETED);
    });
  });

  // ============================================================
  // POST /api/v1/ai-assistant/:conversationId/messages
  // ============================================================

  describe('POST /api/v1/ai-assistant/:conversationId/messages', () => {
    it('should send message to active conversation and return user and assistant messages', async () => {
      const conversation = await ConversationModel.create({
        userId,
        title: 'Rice Blast Query',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(),
      });

      const response = await request(app)
        .post(`/api/v1/ai-assistant/${conversation._id.toString()}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'How to cure rice blast?',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Message sent successfully.');
      expect(response.body.data.userMessage.content).toBe('How to cure rice blast?');
      expect(response.body.data.userMessage.role).toBe(MESSAGE_ROLE.USER);

      expect(response.body.data.assistantMessage.content).toBe(
        'For rice blast disease, apply recommended fungicide and manage water levels.'
      );
      expect(response.body.data.assistantMessage.role).toBe(MESSAGE_ROLE.ASSISTANT);

      const storedUserMsg = await MessageModel.findById(response.body.data.userMessage._id);
      expect(storedUserMsg).not.toBeNull();

      const storedAssistantMsg = await MessageModel.findById(
        response.body.data.assistantMessage._id
      );
      expect(storedAssistantMsg).not.toBeNull();
    });

    it('should return 400 Bad Request when sending message to completed conversation', async () => {
      const conversation = await ConversationModel.create({
        userId,
        title: 'Closed Chat',
        status: CONVERSATION_STATUS.COMPLETED,
        lastActivityAt: new Date(),
      });

      const response = await request(app)
        .post(`/api/v1/ai-assistant/${conversation._id.toString()}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Hello?',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot send messages to a completed conversation.');
    });
  });

  // ============================================================
  // GET /api/v1/ai-assistant/:conversationId/messages
  // ============================================================

  describe('GET /api/v1/ai-assistant/:conversationId/messages', () => {
    it('should retrieve conversation message history', async () => {
      const conversation = await ConversationModel.create({
        userId,
        title: 'Fertilizer Query',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(),
      });

      await MessageModel.create([
        {
          conversationId: conversation._id,
          role: MESSAGE_ROLE.USER,
          content: 'What fertilizer to use?',
          status: MESSAGE_STATUS.COMPLETED,
        },
        {
          conversationId: conversation._id,
          role: MESSAGE_ROLE.ASSISTANT,
          content: 'Use NPK 10-10-10.',
          status: MESSAGE_STATUS.COMPLETED,
        },
      ]);

      const response = await request(app)
        .get(`/api/v1/ai-assistant/${conversation._id.toString()}/messages`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const messages = response.body.data as { content: string }[];
      const contents = messages.map((m) => m.content);
      expect(contents).toContain('What fertilizer to use?');
      expect(contents).toContain('Use NPK 10-10-10.');
    });

    it('should return 404 when accessing messages of non-existent conversation', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/ai-assistant/${nonExistentId.toString()}/messages`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
