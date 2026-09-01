export type ExpenseCategoryType =
  | 'Purchases'
  | 'Marketing'
  | 'Transport'
  | 'Utilities'
  | 'Salaries'
  | 'Rent'
  | 'Other';

export interface CreateExpenseDto {
  title: string;
  titleAr?: string;
  amount: number;
  category: ExpenseCategoryType;
  expenseDate?: string;
  paymentMethod?: string;
  currency?: string;
  notes?: string;
  receiptStoragePath?: string;
}

export interface UpdateExpenseDto {
  title?: string;
  titleAr?: string;
  amount?: number;
  category?: ExpenseCategoryType;
  expenseDate?: string;
  paymentMethod?: string;
  notes?: string;
  receiptStoragePath?: string;
  isArchived?: boolean;
}

export interface ExpenseQueryDto {
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}
