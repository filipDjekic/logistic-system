import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import { activityTimelineApi } from '../api/activityTimelineApi';
import type { OperationalAttachmentCreate, OperationalAttachmentUpload, OperationalCommentCreate, OperationalEntityType } from '../types/activityTimeline.types';

export function useActivityTimeline(entityType: OperationalEntityType | '', entityId: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.activityTimeline.entity(entityType, entityId),
    queryFn: () => activityTimelineApi.getTimeline(entityType as OperationalEntityType, entityId as number),
    enabled: enabled && Boolean(entityType && entityId),
  });
}

export function useRecentActivityTimeline(enabled = true) {
  return useQuery({
    queryKey: queryKeys.activityTimeline.recent(),
    queryFn: () => activityTimelineApi.getRecent(),
    enabled,
    staleTime: 30_000,
  });
}

export function useOperationalComments(entityType: OperationalEntityType | '', entityId: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.activityTimeline.comments(entityType, entityId),
    queryFn: () => activityTimelineApi.getComments(entityType as OperationalEntityType, entityId as number),
    enabled: enabled && Boolean(entityType && entityId),
  });
}

export function useOperationalAttachments(entityType: OperationalEntityType | '', entityId: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.activityTimeline.attachments(entityType, entityId),
    queryFn: () => activityTimelineApi.getAttachments(entityType as OperationalEntityType, entityId as number),
    enabled: enabled && Boolean(entityType && entityId),
  });
}

export function useCreateOperationalComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OperationalCommentCreate) => activityTimelineApi.createComment(payload),
    onSuccess: async (comment) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.activityTimeline.entity(comment.entityType, comment.entityId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.activityTimeline.comments(comment.entityType, comment.entityId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.activityTimeline.recent() });
    },
  });
}

export function useCreateOperationalAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OperationalAttachmentCreate) => activityTimelineApi.createAttachment(payload),
    onSuccess: async (attachment) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.activityTimeline.entity(attachment.entityType, attachment.entityId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.activityTimeline.attachments(attachment.entityType, attachment.entityId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.activityTimeline.recent() });
    },
  });
}


export function useUploadOperationalAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OperationalAttachmentUpload) => activityTimelineApi.uploadAttachment(payload),
    onSuccess: async (attachment) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.activityTimeline.entity(attachment.entityType, attachment.entityId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.activityTimeline.attachments(attachment.entityType, attachment.entityId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.activityTimeline.recent() });
    },
  });
}
