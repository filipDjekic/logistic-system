export type OperationalEntityType =
  | 'TRANSPORT_ORDER'
  | 'TASK'
  | 'WAREHOUSE'
  | 'WAREHOUSE_INVENTORY'
  | 'STOCK_MOVEMENT'
  | 'SHIFT'
  | 'EMPLOYEE'
  | 'VEHICLE'
  | 'VEHICLE_MAINTENANCE'
  | 'PRODUCT'
  | 'COMPANY'
  | 'NOTIFICATION'
  | 'GENERAL';

export type ActivityTimelineItemType = 'COMMENT' | 'ATTACHMENT' | 'DOMAIN_EVENT';
export type OperationalAttachmentType =
  | 'DOCUMENT'
  | 'DELIVERY_NOTE'
  | 'REPORT'
  | 'DAMAGE_PHOTO'
  | 'WRITE_OFF_EVIDENCE'
  | 'ADJUSTMENT_EVIDENCE'
  | 'OTHER';
export type DomainEventType =
  | 'COMMENT_CREATED'
  | 'COMMENT_DELETED'
  | 'ATTACHMENT_ADDED'
  | 'ATTACHMENT_REMOVED'
  | 'TRANSPORT_LIFECYCLE'
  | 'INVENTORY_LIFECYCLE'
  | 'TASK_LIFECYCLE'
  | 'SHIFT_LIFECYCLE'
  | 'VEHICLE_MAINTENANCE'
  | 'SYSTEM_EVENT';

export type ActivityTimelineItem = {
  type: ActivityTimelineItemType;
  sourceId: number;
  entityType: OperationalEntityType;
  entityId: number;
  title: string;
  description: string | null;
  actorName: string | null;
  actorEmail: string | null;
  occurredAt: string | null;
};

export type OperationalComment = {
  id: number;
  entityType: OperationalEntityType;
  entityId: number;
  content: string;
  internalNote: boolean;
  companyId: number | null;
  authorId: number;
  authorEmail: string;
  authorName: string;
  createdAt: string;
  updatedAt: string | null;
};

export type OperationalAttachment = {
  id: number;
  entityType: OperationalEntityType;
  entityId: number;
  attachmentType: OperationalAttachmentType;
  fileName: string;
  contentType: string | null;
  fileUrl: string;
  sizeBytes: number | null;
  description: string | null;
  companyId: number | null;
  uploadedById: number;
  uploadedByEmail: string;
  uploadedByName: string;
  createdAt: string;
};

export type OperationalCommentCreate = {
  entityType: OperationalEntityType;
  entityId: number;
  content: string;
  internalNote?: boolean;
  companyId?: number | null;
};

export type OperationalAttachmentCreate = {
  entityType: OperationalEntityType;
  entityId: number;
  attachmentType?: OperationalAttachmentType;
  fileName: string;
  contentType?: string | null;
  fileUrl: string;
  sizeBytes?: number | null;
  description?: string | null;
  companyId?: number | null;
};

export type OperationalAttachmentUpload = {
  entityType: OperationalEntityType;
  entityId: number;
  file: File;
  attachmentType?: OperationalAttachmentType;
  description?: string | null;
  companyId?: number | null;
};
