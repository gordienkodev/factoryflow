import express from 'express';
import cors from 'cors';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi';
import swaggerUi from 'swagger-ui-express';
import { z } from 'zod';
import {
  downtimesPath,
  registerDowntimesOpenApi,
} from './downtimes/downtimes.openapi.js';
import { downtimesRouter } from './downtimes/downtimes.routes.js';
import { handleHttpError } from './lib/http-errors.js';
import {
  machinesPath,
  registerMachinesOpenApi,
} from './machines/machines.openapi.js';
import { machinesRouter } from './machines/machines.routes.js';
import {
  operationsPath,
  registerOperationsOpenApi,
} from './operations/operations.openapi.js';
import { operationsRouter } from './operations/operations.routes.js';
import { ordersPath, registerOrdersOpenApi } from './orders/orders.openapi.js';
import { ordersRouter } from './orders/orders.routes.js';
import {
  registerScheduleOpenApi,
  schedulePath,
} from './schedule/schedule.openapi.js';
import { scheduleRouter } from './schedule/schedule.routes.js';

export const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  }),
);

app.use(express.json());

const registry = new OpenAPIRegistry();
const healthPath = '/api/health';
const healthResponse = z.object({ status: z.literal('ok') });

registry.registerPath({
  method: 'get',
  path: healthPath,
  summary: 'Проверка доступности API',
  responses: {
    200: {
      description: 'API доступен',
      content: {
        'application/json': { schema: healthResponse },
      },
    },
  },
});

app.get(healthPath, (_req, res) => {
  const body: z.infer<typeof healthResponse> = { status: 'ok' };
  res.json(body);
});

app.use(machinesPath, machinesRouter);
registerMachinesOpenApi(registry);

app.use(ordersPath, ordersRouter);
registerOrdersOpenApi(registry);

app.use(operationsPath, operationsRouter);
registerOperationsOpenApi(registry);

app.use(downtimesPath, downtimesRouter);
registerDowntimesOpenApi(registry);

app.use(schedulePath, scheduleRouter);
registerScheduleOpenApi(registry);

const openApi = new OpenApiGeneratorV31(registry.definitions).generateDocument({
  openapi: '3.1.0',
  info: { title: 'FactoryFlow API', version: '1.0.0' },
});

app.get('/api/openapi.json', (_req, res) => {
  res.json(openApi);
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApi));
app.use(handleHttpError);
