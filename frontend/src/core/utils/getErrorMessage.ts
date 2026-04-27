import { normalizeApiError } from '../api/apiError';

export function getErrorMessage(
  error: unknown,
  fallback = 'The request could not be completed. Check the data and try again.',
): string {
  return normalizeApiError(error, fallback).message;
}
