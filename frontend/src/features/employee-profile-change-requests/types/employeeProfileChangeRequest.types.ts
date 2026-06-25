import type { PageParams, PageResponse } from '../../../core/api/pagination';
import type {
  EmployeeProfileChangeRequestResponse,
  EmployeeProfileChangeRequestStatus,
} from '../../profile/types/profileChangeRequest.types';

export type { EmployeeProfileChangeRequestResponse, EmployeeProfileChangeRequestStatus };

export type EmployeeProfileChangeRequestsPageResponse = PageResponse<EmployeeProfileChangeRequestResponse>;

export type GetEmployeeProfileChangeRequestsParams = PageParams & {
  status?: EmployeeProfileChangeRequestStatus | '';
};

export type RejectEmployeeProfileChangeRequestPayload = {
  rejectionReason: string;
};
