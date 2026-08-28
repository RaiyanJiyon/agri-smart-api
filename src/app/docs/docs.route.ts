import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

export const DocsRoutes = Router();

DocsRoutes.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
