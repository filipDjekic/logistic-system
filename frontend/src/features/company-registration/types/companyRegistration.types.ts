export type CompanyRegistrationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type CompanyRegistrationCreateRequest = {
  companyName: string;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  companyEmail?: string | null;
  companyPhoneNumber?: string | null;
  countryId: number;
  cityId: number;
  timezoneId: number;
  address?: string | null;
  postalCode?: string | null;
  adminFirstName: string;
  adminLastName: string;
  adminAddress: string;
  adminEmail: string;
  adminPhoneNumber: string;
  adminJmbg: string;
  adminPassword: string;
  adminEmploymentDate: string;
  notes?: string | null;
};

export type CompanyRegistrationResponse = {
  id: number;
  companyName: string;
  registrationNumber: string | null;
  taxNumber: string | null;
  companyEmail: string | null;
  companyPhoneNumber: string | null;
  countryId: number | null;
  countryName: string | null;
  countryCode: string | null;
  cityId: number | null;
  cityName: string | null;
  timezoneId: number | null;
  timezoneName: string | null;
  timezoneDisplayName: string | null;
  address: string | null;
  postalCode: string | null;
  adminFirstName: string;
  adminLastName: string;
  adminAddress: string | null;
  adminEmail: string;
  adminPhoneNumber: string;
  adminJmbg: string;
  adminEmploymentDate: string;
  status: CompanyRegistrationStatus;
  statusLabel?: string | null;
  statusDescription?: string | null;
  reviewable?: boolean;
  terminal?: boolean;
  canMoveToReview?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedById: number | null;
  reviewedByEmail: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdCompanyId: number | null;
  updatedAt: string | null;
};

export type CompanyRegistrationPublicStatus = {
  id: number;
  companyName: string;
  adminEmail: string;
  status: CompanyRegistrationStatus;
  statusLabel?: string | null;
  statusDescription?: string | null;
  terminal?: boolean;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdCompanyId: number | null;
};

export type CompanyRegistrationValidationResponse = {
  companyNameAvailable: boolean;
  registrationNumberAvailable: boolean;
  taxNumberAvailable: boolean;
  adminEmailAvailable: boolean;
};
