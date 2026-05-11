import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { queryKeys } from '../../../core/constants/queryKeys';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { employeeWarehouseAssignmentsApi } from '../api/employeeWarehouseAssignmentsApi';
import type {
  EmployeeWarehouseAssignmentCreateRequest,
  EmployeeWarehouseAssignmentUpdateRequest,
} from '../types/employeeWarehouseAssignment.types';

export function useEmployeeWarehouseAssignmentsByEmployee(employeeId: number | null) {
  return useQuery({
    queryKey: queryKeys.employeeWarehouseAssignments.byEmployee(employeeId),
    queryFn: () => employeeWarehouseAssignmentsApi.getByEmployee(employeeId as number),
    enabled: Boolean(employeeId),
  });
}

export function useEmployeeWarehouseAssignmentsByWarehouse(warehouseId: number | null) {
  return useQuery({
    queryKey: queryKeys.employeeWarehouseAssignments.byWarehouse(warehouseId),
    queryFn: () => employeeWarehouseAssignmentsApi.getByWarehouse(warehouseId as number),
    enabled: Boolean(warehouseId),
  });
}

export function useCreateEmployeeWarehouseAssignment() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  return useMutation({
    mutationFn: (payload: EmployeeWarehouseAssignmentCreateRequest) => employeeWarehouseAssignmentsApi.create(payload),
    onSuccess: async (assignment) => {
      showSnackbar({ message: 'Warehouse access assigned.', severity: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.employeeWarehouseAssignments.root() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(assignment.employeeId) });
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });
}

export function useUpdateEmployeeWarehouseAssignment() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EmployeeWarehouseAssignmentUpdateRequest }) =>
      employeeWarehouseAssignmentsApi.update(id, payload),
    onSuccess: async () => {
      showSnackbar({ message: 'Warehouse access updated.', severity: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.employeeWarehouseAssignments.root() });
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });
}

export function useDeleteEmployeeWarehouseAssignment() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  return useMutation({
    mutationFn: (id: number) => employeeWarehouseAssignmentsApi.delete(id),
    onSuccess: async () => {
      showSnackbar({ message: 'Warehouse access removed.', severity: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.employeeWarehouseAssignments.root() });
    },
    onError: (error) => showSnackbar({ message: getErrorMessage(error), severity: 'error' }),
  });
}
