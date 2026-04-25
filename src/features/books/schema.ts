import { z } from 'zod';

export const bookCreateSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  author: z.string().min(1, '저자를 입력해주세요'),
  publisher: z.string().optional(),
  isbn: z.string().optional(),
  genre: z.string().min(1, '장르를 선택해주세요'),
  condition: z.enum(['LIKE_NEW', 'GOOD', 'ACCEPTABLE'], {
    error: '컨디션을 선택해주세요',
  }),
  description: z.string().max(200, '200자 이내로 입력해주세요').optional(),
  coverColor: z.string().optional(),
  kakaoThumbnailUrl: z.string().optional(),
});

export type BookCreateForm = z.infer<typeof bookCreateSchema>;
