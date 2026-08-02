import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../core/constants/queryKeys';
import { activityTimelineApi } from './activityTimelineApi';
import type { OperationalAttachmentCreate, OperationalAttachmentUpload, OperationalCommentCreate, OperationalEntityType } from './types';

export function useActivityTimeline(entityType: OperationalEntityType | '', entityId: number | null, enabled = true) {
  return useQuery({ queryKey: queryKeys.activityTimeline.entity(entityType, entityId), queryFn: () => activityTimelineApi.getTimeline(entityType as OperationalEntityType, entityId as number), enabled: enabled && Boolean(entityType && entityId) });
}
export function useRecentActivityTimeline(enabled = true) {
  return useQuery({ queryKey: queryKeys.activityTimeline.recent(), queryFn: activityTimelineApi.getRecent, enabled, staleTime: 30_000 });
}
export function useOperationalComments(entityType: OperationalEntityType | '', entityId: number | null, enabled = true) {
  return useQuery({ queryKey: queryKeys.activityTimeline.comments(entityType, entityId), queryFn: () => activityTimelineApi.getComments(entityType as OperationalEntityType, entityId as number), enabled: enabled && Boolean(entityType && entityId) });
}
export function useOperationalAttachments(entityType: OperationalEntityType | '', entityId: number | null, enabled = true) {
  return useQuery({ queryKey: queryKeys.activityTimeline.attachments(entityType, entityId), queryFn: () => activityTimelineApi.getAttachments(entityType as OperationalEntityType, entityId as number), enabled: enabled && Boolean(entityType && entityId) });
}
export function useCreateOperationalComment() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (payload: OperationalCommentCreate) => activityTimelineApi.createComment(payload), onSuccess: async (item) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.activityTimeline.entity(item.entityType, item.entityId) }),
      client.invalidateQueries({ queryKey: queryKeys.activityTimeline.comments(item.entityType, item.entityId) }),
      client.invalidateQueries({ queryKey: queryKeys.activityTimeline.recent() }),
    ]);
  } });
}
function useAttachmentMutation<T>(mutationFn: (payload: T) => Promise<import('./types').OperationalAttachment>) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: async (item) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.activityTimeline.entity(item.entityType, item.entityId) }),
      client.invalidateQueries({ queryKey: queryKeys.activityTimeline.attachments(item.entityType, item.entityId) }),
      client.invalidateQueries({ queryKey: queryKeys.activityTimeline.recent() }),
    ]);
  } });
}
export const useCreateOperationalAttachment = () => useAttachmentMutation<OperationalAttachmentCreate>(activityTimelineApi.createAttachment);
export const useUploadOperationalAttachment = () => useAttachmentMutation<OperationalAttachmentUpload>(activityTimelineApi.uploadAttachment);
