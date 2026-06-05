import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { normalizeApiError } from '../../../core/api/apiError';

export function applyServerFieldErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
): boolean {
  const normalized = normalizeApiError(error);

  if (normalized.structuredFieldErrors.length === 0) {
    return false;
  }

  normalized.structuredFieldErrors.forEach((fieldError) => {
    setError(fieldError.field as FieldPath<TFieldValues>, {
      type: 'server',
      message: fieldError.message,
    });
  });

  return true;
}
