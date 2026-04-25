import { z } from 'zod';

const COVER_COLORS = ['blue', 'orange', 'sage', 'plum', 'sand', 'ink'] as const;

export const readingRecordSchema = z.object({
  bookTitle: z.string().min(1).max(200),
  author: z.string().min(1).max(100),
  isbn: z.string().max(20).optional(),
  rating: z.number().int().min(1).max(5),
  memo: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  coverColor: z.enum(COVER_COLORS).optional(),
  isPublic: z.boolean().optional(),
  readAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
});

export type ReadingRecordFormValues = z.infer<typeof readingRecordSchema>;
