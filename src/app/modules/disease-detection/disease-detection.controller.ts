import type { Request, Response } from 'express';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import type { CreateDiseaseDetectionPayload } from './disease-detection.interface.js';
import { getUserObjectId } from '../../shared/utils/request.utils.js';
import { DiseaseDetectionService } from './disease-detection.service.js';
import { sendResponse } from '../../shared/utils/index.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { getDiseaseReportObjectId } from './disease-detection.utils.js';

const createDiseaseDetection = catchAsync(
  async (req: Request<unknown, unknown, CreateDiseaseDetectionPayload>, res: Response) => {
    const userId = getUserObjectId(req);

    const file = req.file;

    if (!file) {
      // The service also checks this, but doing it here gives the
      // controller a clear request-level failure.
      throw new Error('Disease image is required.');
    }

    const data = await DiseaseDetectionService.createDiseaseDetection(userId, req.body, file);

    sendResponse(res, {
      success: true,
      statusCode: HTTP_STATUS.CREATED,
      message: 'Disease detection completed successfully.',
      data,
    });
  }
);

const getMyReports = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserObjectId(req);

  const data = await DiseaseDetectionService.getMyReports(userId);

  sendResponse(res, {
    success: true,
    statusCode: HTTP_STATUS.OK,
    message: 'Disease reports retrieved successfully.',
    data,
  });
});

const getMyReport = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserObjectId(req);
  const params = req.params as { reportId: string };
  const reportId = getDiseaseReportObjectId(params.reportId);

  const data = await DiseaseDetectionService.getMyReport(reportId, userId);

  sendResponse(res, {
    success: true,
    statusCode: HTTP_STATUS.OK,
    message: 'Disease report retrieved successfully.',
    data,
  });
});

const deleteMyReport = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserObjectId(req);
  const params = req.params as { reportId: string };
  const reportId = getDiseaseReportObjectId(params.reportId);

  await DiseaseDetectionService.deleteMyReport(reportId, userId);

  sendResponse(res, {
    success: true,
    statusCode: HTTP_STATUS.OK,
    message: 'Disease report deleted successfully.',
    data: null,
  });
});

export const DiseaseDetectionController = {
  createDiseaseDetection,
  getMyReports,
  getMyReport,
  deleteMyReport,
};
