import { Router } from 'express';
import { entriesController } from './entries.controller';
import { listEntriesSchema, wordParamSchema } from './entries.schema';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

export const entriesRouter = Router();

// Authenticated route to list/search words
entriesRouter.get('/en', authMiddleware, validate(listEntriesSchema), entriesController.list);

// Authenticated routes (require Bearer Token)
entriesRouter.get('/en/:word', authMiddleware, validate(wordParamSchema), entriesController.getDefinition);
entriesRouter.post('/en/:word/favorite', authMiddleware, validate(wordParamSchema), entriesController.favorite);
entriesRouter.delete('/en/:word/unfavorite', authMiddleware, validate(wordParamSchema), entriesController.unfavorite);

export default entriesRouter;
