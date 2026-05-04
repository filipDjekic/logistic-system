import { apiClient } from '../../../core/api/client';

export type ImportType = 'products' | 'vehicles' | 'warehouses' | 'warehouse-inventory' | 'employees';
export type ExportType = 'transport-report' | 'inventory-report' | 'employee-task-report';

export type ImportRowErrorResponse = {
  line: number;
  field: string;
  value: string | null;
  message: string;
};

export type ImportResultResponse = {
  importType: string;
  transactionMode: 'ALL_OR_NOTHING';
  success: boolean;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors: ImportRowErrorResponse[];
};

export const importTemplates: Record<ImportType, string> = {
  products:
    'name,description,sku,unit,price,fragile,weight,companyId\nExample product,Optional description,SKU-001,PIECE,100.00,false,10.50,\n',
  vehicles:
    'registrationNumber,brand,model,type,capacity,maxWeight,maxVolume,maxItems,fuelType,yearOfProduction,status,companyId\nBG-001-AA,Mercedes,Actros,TRUCK,18000,26000,86,33,DIESEL,2020,AVAILABLE,\n',
  warehouses:
  'name,address,city,postalCode,countryId,timezoneId,latitude,longitude,capacity,status,employeeId,companyId\nMain warehouse,Example address 1,Belgrade,11000,1,1,44.8125,20.4612,100000,ACTIVE,1,\n',
  'warehouse-inventory': 'warehouseId,productId,quantity,minStockLevel\n1,1,100,10\n',
  employees:
  'firstName,lastName,jmbg,phoneNumber,email,address,city,postalCode,countryId,timezoneId,primaryWarehouseId,position,employmentDate,salary,userId,companyId\nPetar,Petrovic,0101990710000,+38160111222,petar.petrovic@example.com,Example address 2,Belgrade,11000,1,1,1,WORKER,2026-05-01,90000,,\n',
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
