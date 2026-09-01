/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  messageAr?: string;
  error?: string;
  timestamp: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  businessId: string;
  role: 'owner' | 'accountant' | 'viewer';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
