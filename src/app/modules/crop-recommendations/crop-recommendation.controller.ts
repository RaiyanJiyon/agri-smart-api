import type { Types } from 'mongoose';

export interface CreateCropRecommendationPayload {
  userId: Types.ObjectId;

  profileId: Types.ObjectId;

  inputParameters: Record<string, unknown>;
}
