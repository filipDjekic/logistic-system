export type CountryResponse = {
  id: number;
  code: string;
  code3: string;
  name: string;
  phoneCode: string | null;
  currencyCode: string | null;
  euMember: boolean;
  active: boolean;
};