export type ProductUnit =
  | 'PIECE'
  | 'KG'
  | 'LITER'
  | 'PALLET'
  | 'BOX';

export type ProductResponse = {
  id: number;
  name: string;
  description: string;
  sku: string;
  unit: ProductUnit;
  price: number;
  fragile: boolean;
  weight: number;
  active: boolean;
  companyId: number | null;
  companyName: string | null;
};

export type ProductCreateRequest = {
  name: string;
  description: string;
  sku: string;
  unit: ProductUnit;
  price: number;
  fragile: boolean;
  weight: number;
};

export type ProductUpdateRequest = ProductCreateRequest;

export type ProductFormValues = {
  name: string;
  description: string;
  sku: string;
  unit: ProductUnit;
  price: string;
  fragile: boolean;
  weight: string;
};