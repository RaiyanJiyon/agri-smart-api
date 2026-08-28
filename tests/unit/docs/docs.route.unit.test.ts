import { describe, expect, it } from 'vitest';
import { swaggerSpec } from '../../../src/app/docs/swagger.js';
import { DocsRoutes } from '../../../src/app/docs/docs.route.js';

describe('OpenAPI & Swagger Documentation Route', () => {
  it('should export valid OpenAPI 3.0.3 specification object', () => {
    expect(swaggerSpec.openapi).toBe('3.0.3');
    expect(swaggerSpec.info.title).toBe('Agri-Smart API Specification');
    expect(swaggerSpec.paths).toBeDefined();
    expect(swaggerSpec.components.schemas).toBeDefined();
    expect(swaggerSpec.components.securitySchemes).toBeDefined();
  });

  it('should export DocsRoutes Express router instance', () => {
    expect(DocsRoutes).toBeDefined();
  });
});
