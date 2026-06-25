import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { employeeProfileChangeRequestsApi } from '../api/employeeProfileChangeRequestsApi';
import type { PageResponse } from '../../../core/api/pagination';
import type { EmployeeProfileChangeRequestResponse } from '../types/employeeProfileChangeRequest.types';


function updateRequestInCachedPages(
  queryClient: ReturnType<typeof useQueryClient>,
  requestId: number,
  patch: Partial<EmployeeProfileChangeRequestResponse>,
) {
  queryClient.setQueriesData<PageResponse<EmployeeProfileChangeRequestResponse>>(
    { queryKey: queryKeys.employeeProfileChangeRequests.root() },
    (current) => {
      if (!current?.content) return current;
      return {
        ...current,
        content: current.content.map((request) =>
          request.id === requestId ? { ...request, ...patch } : request,
        ),
      };
    },
  );
}

function rollbackRequestInCachedPages(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: Array<[readonly unknown[], PageResponse<EmployeeProfileChangeRequestResponse> | undefined]>,
) {
  snapshot.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
}

export function useApproveEmployeeProfileChangeRequest() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (id: number) => employeeProfileChangeRequestsApi.approve(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.employeeProfileChangeRequests.root() });
      const snapshot = queryClient.getQueriesData<PageResponse<EmployeeProfileChangeRequestResponse>>({
        queryKey: queryKeys.employeeProfileChangeRequests.root(),
      });
      updateRequestInCachedPages(queryClient, id, { status: 'APPLIED', reviewedAt: new Date().toISOString() });
      return { snapshot };
    },
    onSuccess: async () => {
      showSnackbar({ message: 'Profile change request approved and applied.', severity: 'success' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.employeeProfileChangeRequests.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.employees.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root() }),
      ]);
    },
    onError: (error, _variables, context) => {
      rollbackRequestInCachedPages(queryClient, context?.snapshot ?? []);
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });
}

export function useRejectEmployeeProfileChangeRequest() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: number; rejectionReason: string }) =>
      employeeProfileChangeRequestsApi.reject(id, { rejectionReason }),
    onMutate: async ({ id, rejectionReason }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.employeeProfileChangeRequests.root() });
      const snapshot = queryClient.getQueriesData<PageResponse<EmployeeProfileChangeRequestResponse>>({
        queryKey: queryKeys.employeeProfileChangeRequests.root(),
      });
      updateRequestInCachedPages(queryClient, id, {
        status: 'REJECTED',
        reviewedAt: new Date().toISOString(),
        rejectionReason,
      });
      return { snapshot };
    },
    onSuccess: async () => {
      showSnackbar({ message: 'Profile change request rejected.', severity: 'success' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.employeeProfileChangeRequests.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.root() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.root() }),
      ]);
    },
    onError: (error, _variables, context) => {
      rollbackRequestInCachedPages(queryClient, context?.snapshot ?? []);
      showSnackbar({ message: getErrorMessage(error), severity: 'error' });
    },
  });
}
