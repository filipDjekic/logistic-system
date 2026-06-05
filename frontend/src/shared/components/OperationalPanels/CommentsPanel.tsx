import { useState } from 'react';
import { Button, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import {
  useCreateOperationalComment,
  useOperationalComments,
} from '../../../features/activity-timeline/hooks/useActivityTimeline';
import type { OperationalEntityType } from '../../../features/activity-timeline/types/activityTimeline.types';
import RelatedDataSection from '../EntityDetails/RelatedDataSection';

type CommentsPanelProps = {
  entityType: OperationalEntityType;
  entityId: number | null;
  allowCreate?: boolean;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.replace('T', ' ') : date.toLocaleString();
}

export default function CommentsPanel({ entityType, entityId, allowCreate = true }: CommentsPanelProps) {
  const { showSnackbar } = useAppSnackbar();
  const commentsQuery = useOperationalComments(entityType, entityId);
  const createCommentMutation = useCreateOperationalComment();
  const [content, setContent] = useState('');
  const [internalNote, setInternalNote] = useState(false);

  const comments = commentsQuery.data ?? [];
  const canSubmit = Boolean(entityId && content.trim()) && !createCommentMutation.isPending;

  const handleSubmit = () => {
    if (!entityId || !content.trim()) return;

    createCommentMutation.mutate(
      { entityType, entityId, content: content.trim(), internalNote },
      {
        onSuccess: () => {
          setContent('');
          setInternalNote(false);
          showSnackbar({ message: 'Comment added.', severity: 'success' });
        },
        onError: (error) => {
          showSnackbar({ message: getErrorMessage(error), severity: 'error' });
        },
      },
    );
  };

  return (
    <RelatedDataSection
      title="Comments"
      description="Operational notes connected with this entity."
      loading={commentsQuery.isLoading}
      error={commentsQuery.isError}
      onRetry={() => { void commentsQuery.refetch(); }}
      empty={!commentsQuery.isLoading && !commentsQuery.isError && comments.length === 0 && !allowCreate}
      emptyTitle="No comments"
      emptyDescription="There are no operational comments for this entity yet."
    >
      {allowCreate ? (
        <Stack spacing={1.5}>
          <TextField
            label="Add comment"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
            <FormControlLabel
              control={<Checkbox checked={internalNote} onChange={(event) => setInternalNote(event.target.checked)} />}
              label="Internal note"
            />
            <Button variant="contained" disabled={!canSubmit} onClick={handleSubmit}>
              Add comment
            </Button>
          </Stack>
        </Stack>
      ) : null}

      {comments.length === 0 ? (
        <Typography color="text.secondary">No comments have been added yet.</Typography>
      ) : (
        <Stack spacing={1.25}>
          {comments.map((comment) => (
            <Stack key={comment.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={700}>{comment.authorName}</Typography>
              <Typography variant="body2">{comment.content}</Typography>
              <Typography variant="caption" color="text.secondary">
                {comment.authorEmail} · {formatDate(comment.createdAt)}{comment.internalNote ? ' · Internal' : ''}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </RelatedDataSection>
  );
}
