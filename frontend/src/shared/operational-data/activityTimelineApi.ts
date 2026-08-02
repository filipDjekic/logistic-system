import { apiClient } from '../../core/api/client';
import type {
  ActivityTimelineItem, OperationalAttachment, OperationalAttachmentCreate,
  OperationalAttachmentUpload, OperationalComment, OperationalCommentCreate,
  OperationalEntityType,
} from './types';

export const activityTimelineApi = {
  getTimeline: (entityType: OperationalEntityType, entityId: number) =>
    apiClient.get<ActivityTimelineItem[]>('/api/activity-timeline', { params: { entityType, entityId } }).then((r) => r.data),
  getRecent: () => apiClient.get<ActivityTimelineItem[]>('/api/activity-timeline/recent').then((r) => r.data),
  getComments: (entityType: OperationalEntityType, entityId: number) =>
    apiClient.get<OperationalComment[]>('/api/operational-comments', { params: { entityType, entityId } }).then((r) => r.data),
  createComment: (payload: OperationalCommentCreate) =>
    apiClient.post<OperationalComment>('/api/operational-comments', payload).then((r) => r.data),
  getAttachments: (entityType: OperationalEntityType, entityId: number) =>
    apiClient.get<OperationalAttachment[]>('/api/operational-attachments', { params: { entityType, entityId } }).then((r) => r.data),
  downloadAttachment: (id: number) =>
    apiClient.get<Blob>(`/api/operational-attachments/${id}/download`, { responseType: 'blob' }).then((r) => r.data),
  createAttachment: (payload: OperationalAttachmentCreate) =>
    apiClient.post<OperationalAttachment>('/api/operational-attachments', payload).then((r) => r.data),
  uploadAttachment(payload: OperationalAttachmentUpload) {
    const formData = new FormData();
    formData.append('entityType', payload.entityType);
    formData.append('entityId', String(payload.entityId));
    formData.append('file', payload.file);
    if (payload.attachmentType) formData.append('attachmentType', payload.attachmentType);
    if (payload.description?.trim()) formData.append('description', payload.description.trim());
    return apiClient.post<OperationalAttachment>('/api/operational-attachments/upload', formData).then((r) => r.data);
  },
};
