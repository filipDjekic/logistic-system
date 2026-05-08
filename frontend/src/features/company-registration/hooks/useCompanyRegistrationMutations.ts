import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { companyRegistrationApi } from '../api/companyRegistrationApi';
import type { CompanyRegistrationCreateRequest } from '../types/companyRegistration.types';

export function useSubmitCompanyRegistration() {
  const { showSnackbar } = useAppSnackbar();
  return useMutation({
    mutationFn: (payload: CompanyRegistrationCreateRequest) => companyRegistrationApi.submit(payload),
    onSuccess: () => showSnackbar({ message: 'Registration request submitted.', severity: 'success' }),
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });
}

export function useApproveCompanyRegistration() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  return useMutation({
    mutationFn: (id: number) => companyRegistrationApi.approve(id),
    onSuccess: async () => {
      showSnackbar({ message: 'Registration request approved.', severity: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.companyRegistrationRequests.root() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.root() });
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });
}

export function useRejectCompanyRegistration() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: number; rejectionReason: string }) =>
      companyRegistrationApi.reject(id, rejectionReason),
    onSuccess: async () => {
      showSnackbar({ message: 'Registration request rejected.', severity: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.companyRegistrationRequests.root() });
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });
}
