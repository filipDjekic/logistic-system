import { apiClient } from '../../../core/api/client';
import type {
  ActivityTimelineItem,
  OperationalAttachment,
  OperationalAttachmentCreate,
  OperationalAttachmentUpload,
  OperationalComment,
  OperationalCommentCreate,
  OperationalEntityType,
} from '../types/activityTimeline.types';

export const activityTimelineApi = {
  getTimeline(entityType: OperationalEntityType, entityId: number) {
    return apiClient
      .get<ActivityTimelineItem[]>('/api/activity-timeline', { params: { entityType, entityId } })
      .then((response) => response.data);
  },

  getRecent() {
    return apiClient
      .get<ActivityTimelineItem[]>('/api/activity-timeline/recent')
      .then((response) => response.data);
  },

  getComments(entityType: OperationalEntityType, entityId: number) {
    return apiClient
      .get<OperationalComment[]>('/api/operational-comments', { params: { entityType, entityId } })
      .then((response) => response.data);
  },

  createComment(payload: OperationalCommentCreate) {
    return apiClient.post<OperationalComment>('/api/operational-comments', payload).then((response) => response.data);
  },

  getAttachments(entityType: OperationalEntityType, entityId: number) {
    return apiClient
      .get<OperationalAttachment[]>('/api/operational-attachments', { params: { entityType, entityId } })
      .then((response) => response.data);
  },

  createAttachment(payload: OperationalAttachmentCreate) {
    return apiClient.post<OperationalAttachment>('/api/operational-attachments', payload).then((response) => response.data);
  },

  uploadAttachment(payload: OperationalAttachmentUpload) {
    const formData = new FormData();
    formData.append('entityType', payload.entityType);
    formData.append('entityId', String(payload.entityId));
    formData.append('file', payload.file);

    if (payload.attachmentType) {
      formData.append('attachmentType', payload.attachmentType);
    }

    if (payload.description?.trim()) {
      formData.append('description', payload.description.trim());
    }

    if (payload.companyId != null) {
      formData.append('companyId', String(payload.companyId));
    }

    return apiClient
      .post<OperationalAttachment>('/api/operational-attachments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => response.data);
  },
};
