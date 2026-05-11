import { apiClient } from '../../../core/api/client';
import type {
  ActivityTimelineItem,
  OperationalAttachment,
  OperationalAttachmentCreate,
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
};
