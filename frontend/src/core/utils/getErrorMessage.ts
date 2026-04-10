import { normalizeApiError } from '../api/apiError';

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  return normalizeApiError(error, fallback).message;
}