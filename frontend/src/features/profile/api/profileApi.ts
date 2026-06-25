import { apiClient } from '../../../core/api/client';
import type { ProfileResponse } from '../types/profile.types';
import type { EmployeeProfileChangeRequestCreate, EmployeeProfileChangeRequestResponse, EmployeeProfileChangeRequestsPageResponse, GetMyProfileChangeRequestsParams } from '../types/profileChangeRequest.types';

export const profileApi = {
  getCurrent() {
    return apiClient.get<ProfileResponse>('/api/profile').then((response) => response.data);
  },

  getMyChangeRequests(params: GetMyProfileChangeRequestsParams = {}) {
    return apiClient
      .get<EmployeeProfileChangeRequestsPageResponse>('/api/profile/change-requests', {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sort: params.sort ?? 'createdAt,desc',
        },
      })
      .then((response) => response.data);
  },


  createMyChangeRequest(payload: EmployeeProfileChangeRequestCreate) {
    return apiClient
      .post<EmployeeProfileChangeRequestResponse>('/api/profile/change-requests', payload)
      .then((response) => response.data);
  },
};
