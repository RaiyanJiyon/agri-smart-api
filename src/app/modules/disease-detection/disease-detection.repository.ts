import type { Types, UpdateQuery } from 'mongoose';
import type { DiseaseReport } from './disease-detection.interface.js';
import { DiseaseReportModel } from './disease-detection.model.js';

const create = async (payload: DiseaseReport): Promise<DiseaseReport> => {
  const diseaseReport = await DiseaseReportModel.create(payload);

  return diseaseReport.toObject();
};

const findByUserId = async (userId: Types.ObjectId): Promise<DiseaseReport[]> => {
  return DiseaseReportModel.find({
    userId,
  })
    .sort({ createdAt: -1 })
    .lean<DiseaseReport[]>();
};

const findByIdAndUserId = async (
  diseaseReportId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<DiseaseReport | null> => {
  return DiseaseReportModel.findOne({
    _id: diseaseReportId,
    userId,
  }).lean<DiseaseReport | null>();
};

const deleteByIdAndUserId = async (
  diseaseReportId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<DiseaseReport | null> => {
  return DiseaseReportModel.findOneAndDelete({
    _id: diseaseReportId,
    userId,
  }).lean<DiseaseReport | null>();
};

const updateById = async (
  diseaseReportId: Types.ObjectId,
  update: UpdateQuery<DiseaseReport>
): Promise<DiseaseReport | null> => {
  return DiseaseReportModel.findByIdAndUpdate(diseaseReportId, update, {
    new: true,
    runValidators: true,
  }).lean<DiseaseReport | null>();
};

export const DiseaseDetectionRepository = {
  create,
  findByUserId,
  findByIdAndUserId,
  deleteByIdAndUserId,
  updateById,
};
