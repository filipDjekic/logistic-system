export type CityResponse = {
  id: number;
  name: string;
  postalCode: string | null;
  countryId: number;
  countryCode: string;
  countryName: string;
  active: boolean;
};
