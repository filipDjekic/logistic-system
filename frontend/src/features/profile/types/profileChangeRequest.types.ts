import type { PageParams, PageResponse } from '../../../core/api/pagination';

export type EmployeeProfileChangeRequestStatus = 'PENDING' | 'APPLIED' | 'REJECTED' | 'CANCELLED';

export type EmployeeProfileChangeRequestResponse = {
  id: number;
  employeeId: number;
  employeeFullName: string | null;
  requestedByUserId: number;
  requestedByFullName: string | null;
  companyId: number | null;
  companyName: string | null;
  status: EmployeeProfileChangeRequestStatus;
  requestedChanges: Record<string, unknown>;
  reason: string | null;
  reviewedByUserId: number | null;
  reviewedByFullName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string | null;
  version: number | null;
};

export type EmployeeProfileChangeRequestsPageResponse = PageResponse<EmployeeProfileChangeRequestResponse>;


export type EmployeeProfileChangeRequestCreate = {
  requestedChanges: Record<string, unknown>;
  reason?: string | null;
};

export type GetMyProfileChangeRequestsParams = PageParams;
