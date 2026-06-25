import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { userRouter } from '../modules/users/user.routes';
import { entriesRouter } from '../modules/entries/entries.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';

export const router = Router();

// Base route
router.get('/', (req, res) => {
  res.json({ message: 'English Dictionary' });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Swagger UI Route
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount Modules
router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/entries', entriesRouter);
export default router;
