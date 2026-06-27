import type { CityResponse } from '../../cities/types/city.types';
import type { CountryResponse } from '../../countries/types/country.types';

export const PROFILE_CHANGE_FIELD_LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  phoneNumber: 'Phone number',
  address: 'Address',
  cityId: 'City',
  countryId: 'Country',
};

export function formatProfileChangeFieldName(field: string) {
  return PROFILE_CHANGE_FIELD_LABELS[field] ?? field
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

export function formatProfileChangeValue(
  field: string,
  value: unknown,
  lookups: { countries?: CountryResponse[]; cities?: CityResponse[] } = {},
) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (field === 'countryId') {
    const country = lookups.countries?.find((item) => item.id === Number(value));
    return country ? `${country.name}${country.phoneCode ? ` (+${country.phoneCode})` : ''}` : `Country #${String(value)}`;
  }

  if (field === 'cityId') {
    const city = lookups.cities?.find((item) => item.id === Number(value));
    return city ? `${city.name}${city.postalCode ? ` (${city.postalCode})` : ''}` : `City #${String(value)}`;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export function formatProfileChangeSummary(
  changes: Record<string, unknown>,
  lookups: { countries?: CountryResponse[]; cities?: CityResponse[] } = {},
) {
  const entries = Object.entries(changes ?? {});
  if (!entries.length) {
    return '-';
  }
  return entries
    .map(([field, value]) => `${formatProfileChangeFieldName(field)}: ${formatProfileChangeValue(field, value, lookups)}`)
    .join(', ');
}
