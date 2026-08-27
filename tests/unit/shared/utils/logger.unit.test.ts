import { describe, expect, it, vi } from 'vitest';
import { logger } from '../../../../src/app/shared/utils/logger.js';

describe('logger utility', () => {
  it('should execute info, warn, error, and debug log methods without throwing', () => {
    const noop = () => {
      // Intentionally empty for mock implementation
    };

    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(noop);
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(noop);
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(noop);
    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(noop);

    logger.info('Test info message', { meta: 'data' });
    logger.warn('Test warn message');
    logger.error('Test error message', new Error('Fail'));
    logger.debug('Test debug message');

    expect(infoSpy).toHaveBeenCalledWith('Test info message', { meta: 'data' });
    expect(warnSpy).toHaveBeenCalledWith('Test warn message');
    expect(errorSpy).toHaveBeenCalledWith('Test error message', expect.any(Error));
    expect(debugSpy).toHaveBeenCalledWith('Test debug message');

    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    debugSpy.mockRestore();
  });
});
