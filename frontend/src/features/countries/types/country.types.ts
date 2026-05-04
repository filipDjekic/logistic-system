export type CountryResponse = {
  id: number;
  iso2Code: string;
  iso3Code: string;
  numericCode: string | null;
  name: string;
  currencyCode: string | null;
  currencyName: string | null;
  phoneCode: string | null;
  defaultTimezoneId: number | null;
  defaultTimezoneName: string | null;
  defaultTimezoneDisplayName: string | null;
  timezones: TimezoneResponse[];
  euMember: boolean;
  active: boolean;
};

export type TimezoneResponse = {
  id: number;
  name: string;
  displayName: string;
  utcOffsetMinutes: number;
  countryId: number;
  countryCode: string;
  countryName: string;
  active: boolean;
};