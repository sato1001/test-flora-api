import { Request, Response, NextFunction } from 'express';
import { entriesService, EntriesService } from './entries.service';

export class EntriesController {
  constructor(private readonly service: EntriesService = entriesService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { limit, page, cursor, search } = req.query as unknown as {
        limit: number;
        page: number;
        cursor?: string;
        search?: string;
      };
      
      const result = await this.service.listWords(limit, page, cursor, search);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getDefinition = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { word } = req.params;
      const userId = req.user!.id;

      const { definition, cacheHeader } = await this.service.getWordDefinition(word, userId);

      res.setHeader('x-cache', cacheHeader);
      return res.status(200).json(definition);
    } catch (error) {
      next(error);
    }
  };

  favorite = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { word } = req.params;
      const userId = req.user!.id;

      await this.service.favoriteWord(userId, word);
      return res.status(200).json({ message: `Word '${word}' favorited successfully` });
    } catch (error) {
      next(error);
    }
  };

  unfavorite = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { word } = req.params;
      const userId = req.user!.id;

      await this.service.unfavoriteWord(userId, word);
      return res.status(200).json({ message: `Word '${word}' unfavorited successfully` });
    } catch (error) {
      next(error);
    }
  };
}
export const entriesController = new EntriesController();
export default entriesController;
