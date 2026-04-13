import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { companiesApi } from '../api/companiesApi';
import type { CompanyCreateRequest } from '../types/company.types';

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: (payload: CompanyCreateRequest) => companiesApi.create(payload),
    onSuccess: async (createdCompany) => {
      showSnackbar({
        message: createdCompany.adminEmail
          ? `Company created successfully. Bootstrap admin email: ${createdCompany.adminEmail}`
          : 'Company created successfully.',
        severity: 'success',
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.companies.all(),
      });
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}
