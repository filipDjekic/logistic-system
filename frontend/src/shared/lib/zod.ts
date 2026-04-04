import { z } from 'zod';

function trimStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function emptyStringToUndefined(value: unknown) {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
}

function emptyStringToNull(value: unknown) {
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }

  return value;
}

function stringNumberToNumber(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed === '') {
      return undefined;
    }

    return Number(trimmed);
  }

  return value;
}

export const zodUtil = {
  requiredString(message = 'This field is required') {
    return z.preprocess(
      trimStringValue,
      z.string().min(1, message),
    );
  },

  optionalString() {
    return z.preprocess(
      emptyStringToUndefined,
      z.string().trim().optional(),
    );
  },

  nullableString() {
    return z.preprocess(
      emptyStringToNull,
      z.string().trim().nullable(),
    );
  },

  requiredNumber(message = 'This field is required') {
    return z.preprocess(
      stringNumberToNumber,
      z.number({
        error: message,
      }),
    );
  },

  positiveNumber(message = 'Value must be greater than 0') {
    return z.preprocess(
      stringNumberToNumber,
      z.number().positive(message),
    );
  },

  optionalNumber() {
    return z.preprocess(
      stringNumberToNumber,
      z.number().optional(),
    );
  },

  requiredEnum<TEnum extends Record<string, string>>(enumObject: TEnum) {
    return z.enum(Object.values(enumObject) as [string, ...string[]]);
  },

  requiredDateString(message = 'Date is required') {
    return z.preprocess(
      trimStringValue,
      z.string().min(1, message),
    );
  },

  optionalDateString() {
    return z.preprocess(
      emptyStringToUndefined,
      z.string().trim().optional(),
    );
  },
};