import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { responseTimeMiddleware } from './middlewares/response-time.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { router } from './routes';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(responseTimeMiddleware);

// Mount main routing
app.use('/', router);

// Global Error Handler
app.use(errorMiddleware);
export default app;
