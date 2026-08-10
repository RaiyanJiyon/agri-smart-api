import { Types } from 'mongoose';
import { ApiError } from '../../shared/errors/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';

export const getDiseaseReportObjectId = (reportId: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(reportId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid disease report ID.');
  }

  return new Types.ObjectId(reportId);
};
