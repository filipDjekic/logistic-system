import { apiClient } from '../../../core/api/client';

export type ImportType = 'products' | 'vehicles' | 'warehouses' | 'warehouse-inventory';
export type ExportType = 'transport-report' | 'inventory-report' | 'employee-task-report';

export type ImportResultResponse = {
  importType: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors: string[];
};

export const importTemplates: Record<ImportType, string> = {
  products: 'name,description,sku,unit,price,fragile,weight,companyId\nExample product,Optional description,SKU-001,PIECE,100.00,false,10.50,\n',
  vehicles: 'registrationNumber,brand,model,type,capacity,fuelType,yearOfProduction,status,companyId\nBG-001-AA,Mercedes,Actros,TRUCK,18000,DIESEL,2020,AVAILABLE,\n',
  warehouses: 'name,address,city,capacity,status,employeeId,companyId\nMain warehouse,Example address 1,Belgrade,100000,ACTIVE,1,\n',
  'warehouse-inventory': 'warehouseId,productId,quantity,minStockLevel\n1,1,100,10\n',
};

export const dataExchangeApi = {
  importCsv(type: ImportType, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient
      .post<ImportResultResponse>(`/api/data/import/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => response.data);
  },

  exportCsv(type: ExportType) {
    return apiClient
      .get<Blob>(`/api/data/export/${type}.csv`, {
        responseType: 'blob',
      })
      .then((response) => response.data);
  },
};
