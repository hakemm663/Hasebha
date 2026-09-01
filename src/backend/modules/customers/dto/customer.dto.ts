export interface CreateCustomerDto {
  name: string;
  nameAr?: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
  currency?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  nameAr?: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
  isArchived?: boolean;
}

export interface CustomerQueryDto {
  search?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}
