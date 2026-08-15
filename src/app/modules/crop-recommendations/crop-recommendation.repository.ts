import type { Types, UpdateQuery } from 'mongoose';
import type { CropRecommendation } from './crop-recommendation.interface.js';
import { CropRecommendationModel } from './crop-recommendation.model.js';

const create = async (payload: CropRecommendation): Promise<CropRecommendation> => {
  return CropRecommendationModel.create(payload);
};

const findByIdAndUserId = async (
  recommendationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<CropRecommendation | null> => {
  const result = await CropRecommendationModel.findOne({
    _id: recommendationId,
    userId: userId,
  });

  return result;
};

const findByUserId = async (userId: Types.ObjectId): Promise<CropRecommendation[]> => {
  return CropRecommendationModel.find({
    userId: userId,
  })
    .sort({
      requestedAt: -1,
    })
    .lean<CropRecommendation[]>();
};

const deleteByIdAndUserId = async (recommendationId: Types.ObjectId, userId: Types.ObjectId) => {
  return CropRecommendationModel.findOneAndDelete({
    _id: recommendationId,
    userId: userId,
  });
};

const updateById = async (
  recommendationId: Types.ObjectId,
  update: UpdateQuery<CropRecommendation>
): Promise<CropRecommendation | null> => {
  return CropRecommendationModel.findByIdAndUpdate(recommendationId, update, {
    returnDocument: 'after',
    runValidators: true,
  }).lean<CropRecommendation | null>();
};

export const CropRecommendationRepository = {
  create,
  findByIdAndUserId,
  findByUserId,
  deleteByIdAndUserId,
  updateById,
};
