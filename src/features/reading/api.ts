import { api } from '@/lib/api';
import type { ReadingRecord, ReadingRecordPage, ReadingRecordRequest } from './types';

export const readingApi = {
  /** 내 독서 기록 목록 */
  getMyRecords: (page = 0, size = 20) =>
    api
      .get<{ data: ReadingRecordPage }>('/v1/reading-records', { params: { page, size } })
      .then((r) => r.data.data),

  /** 독서 기록 등록 */
  create: (req: ReadingRecordRequest) =>
    api
      .post<{ data: ReadingRecord }>('/v1/reading-records', req)
      .then((r) => r.data.data),

  /** 독서 기록 수정 */
  update: (id: number, req: Partial<ReadingRecordRequest>) =>
    api
      .patch<{ data: ReadingRecord }>(`/reading-records/${id}`, req)
      .then((r) => r.data.data),

  /** 독서 기록 삭제 */
  delete: (id: number) =>
    api.delete(`/reading-records/${id}`),
};
