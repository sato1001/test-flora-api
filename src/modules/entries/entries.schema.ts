import { z } from 'zod';

export const listEntriesSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .pipe(z.number().int().min(1).max(100)),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().int().min(1)),
    cursor: z.string().optional(),
  }),
});

export const wordParamSchema = z.object({
  params: z.object({
    word: z.string().min(1, 'Word param is required'),
  }),
});

export type ListEntriesInput = z.infer<typeof listEntriesSchema>;
export type WordParamInput = z.infer<typeof wordParamSchema>;
