import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AttachmentsPanel from './AttachmentsPanel';
import type { OperationalAttachment } from '../../../features/activity-timeline/types/activityTimeline.types';

const downloadAttachment = vi.hoisted(() => vi.fn());
const showSnackbar = vi.hoisted(() => vi.fn());
const createObjectURL = vi.hoisted(() => vi.fn());
const revokeObjectURL = vi.hoisted(() => vi.fn());
const attachmentsQuery = vi.hoisted(() => ({
  data: [] as OperationalAttachment[],
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));

vi.mock('../../../features/activity-timeline/api/activityTimelineApi', () => ({
  activityTimelineApi: { downloadAttachment },
}));

vi.mock('../../../features/activity-timeline/hooks/useActivityTimeline', () => ({
  useOperationalAttachments: () => attachmentsQuery,
  useUploadOperationalAttachment: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../../app/providers/useSnackbar', () => ({
  useAppSnackbar: () => ({ showSnackbar }),
}));

const internalAttachment: OperationalAttachment = {
  id: 17,
  entityType: 'TRANSPORT_ORDER',
  entityId: 3,
  attachmentType: 'DOCUMENT',
  fileName: 'delivery-note.pdf',
  contentType: 'application/pdf',
  fileUrl: '/api/operational-attachments/17/download',
  sizeBytes: 4,
  description: null,
  companyId: 1,
  uploadedById: 2,
  uploadedByEmail: 'dispatcher@example.com',
  uploadedByName: 'Demo Dispatcher',
  createdAt: '2026-07-28T10:00:00',
};

describe('AttachmentsPanel download', () => {
  beforeEach(() => {
    attachmentsQuery.data = [internalAttachment];
    downloadAttachment.mockReset();
    showSnackbar.mockReset();
    createObjectURL.mockReset();
    revokeObjectURL.mockReset();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
  });

  it('downloads an internal attachment through the authenticated API client path', async () => {
    const blob = new Blob(['test'], { type: 'application/pdf' });
    createObjectURL.mockReturnValue('blob:attachment');
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    downloadAttachment.mockResolvedValue(blob);

    render(<AttachmentsPanel entityType="TRANSPORT_ORDER" entityId={3} allowCreate={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'delivery-note.pdf' }));

    await waitFor(() => expect(downloadAttachment).toHaveBeenCalledWith(17));
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(anchorClick).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:attachment');
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it('shows a controlled error and does not start a download when the request fails', async () => {
    downloadAttachment.mockRejectedValue(new Error('Download failed'));

    render(<AttachmentsPanel entityType="TRANSPORT_ORDER" entityId={3} allowCreate={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'delivery-note.pdf' }));

    await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith({
      message: 'Download failed',
      severity: 'error',
    }));
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('keeps external HTTPS attachments as direct links', () => {
    attachmentsQuery.data = [{
      ...internalAttachment,
      id: 18,
      fileName: 'external-document.pdf',
      fileUrl: 'https://files.example.com/external-document.pdf',
    }];

    render(<AttachmentsPanel entityType="TRANSPORT_ORDER" entityId={3} allowCreate={false} />);

    expect(screen.getByRole('link', { name: 'external-document.pdf' })).toHaveAttribute(
      'href',
      'https://files.example.com/external-document.pdf',
    );
    expect(downloadAttachment).not.toHaveBeenCalled();
  });
});
