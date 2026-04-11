import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { companiesApi } from '../api/companiesApi';
import type { CompanyUpdateRequest } from '../types/company.types';

type UpdateCompanyPayload = {
  id: number;
  data: CompanyUpdateRequest;
};

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: UpdateCompanyPayload) => companiesApi.update(id, data),
    onSuccess: async (_, variables) => {
      showSnackbar({
        message: 'Company updated successfully.',
        severity: 'success',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.companies.all() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.companies.detail(variables.id),
        }),
      ]);
    },
    onError: (error) => {
      showSnackbar({
        message: getErrorMessage(error),
        severity: 'error',
      });
    },
  });
}