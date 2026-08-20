export const startWorkers = async (): Promise<void> => {
  await import('./disease-detection/disease-detection.worker.js');
  await import('./crop-recommendation/crop-recommendation.worker.js');
};
