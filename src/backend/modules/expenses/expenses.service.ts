import { getSupabaseAdmin } from '../../common/supabase-admin';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseQueryDto, ExpenseCategoryType } from './dto/expense.dto';
import { StorageService } from '../storage/storage.service';

export interface ExpenseEntity {
  id: string;
  businessId: string;
  title: string;
  titleAr?: string;
  amount: number;
  category: ExpenseCategoryType;
  currency: string;
  expenseDate: string;
  paymentMethod: string;
  notes?: string;
  receiptStoragePath?: string;
  receiptSignedUrl?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ExpensesService {
  private supabase = getSupabaseAdmin();
  private storageService = new StorageService();

  /**
   * List expenses with category and date filtering
   */
  async listExpenses(businessId: string, query: ExpenseQueryDto = {}) {
    const { category, startDate, endDate, search, isArchived = false, page = 1, limit = 50 } = query;

    let dbQuery = this.supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .eq('is_archived', isArchived)
      .order('expense_date', { ascending: false });

    if (category) {
      dbQuery = dbQuery.eq('category_name', category);
    }

    if (startDate) {
      dbQuery = dbQuery.gte('expense_date', startDate);
    }

    if (endDate) {
      dbQuery = dbQuery.lte('expense_date', endDate);
    }

    if (search) {
      dbQuery = dbQuery.or(`title.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await dbQuery.range(from, to);

    if (error) {
      throw new Error(`Failed to fetch expenses: ${error.message}`);
    }

    const items = (data || []).map(this.mapToEntity);
    return {
      items,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get single expense by ID
   */
  async getExpenseById(businessId: string, expenseId: string): Promise<ExpenseEntity> {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .eq('business_id', businessId)
      .single();

    if (error || !data) {
      throw new Error(`Expense not found or unauthorized access: ${error?.message}`);
    }

    return this.mapToEntity(data);
  }

  /**
   * Create expense record
   */
  async createExpense(businessId: string, dto: CreateExpenseDto): Promise<ExpenseEntity> {
    const amount = Math.max(0.01, Number(dto.amount));
    const expenseDate = dto.expenseDate || new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('expenses')
      .insert({
        business_id: businessId,
        title: dto.title,
        title_ar: dto.titleAr || null,
        amount,
        category_name: dto.category,
        currency: dto.currency || 'EGP',
        expense_date: expenseDate,
        payment_method: dto.paymentMethod || 'Cash',
        notes: dto.notes || null,
        receipt_storage_path: dto.receiptStoragePath || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create expense: ${error?.message}`);
    }

    return this.mapToEntity(data);
  }

  /**
   * Update expense record
   */
  async updateExpense(
    businessId: string,
    expenseId: string,
    dto: UpdateExpenseDto
  ): Promise<ExpenseEntity> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.titleAr !== undefined) updateData.title_ar = dto.titleAr;
    if (dto.amount !== undefined) updateData.amount = Math.max(0.01, Number(dto.amount));
    if (dto.category !== undefined) updateData.category_name = dto.category;
    if (dto.expenseDate !== undefined) updateData.expense_date = dto.expenseDate;
    if (dto.paymentMethod !== undefined) updateData.payment_method = dto.paymentMethod;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.receiptStoragePath !== undefined) updateData.receipt_storage_path = dto.receiptStoragePath;
    if (dto.isArchived !== undefined) updateData.is_archived = dto.isArchived;

    const { data, error } = await this.supabase
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update expense: ${error?.message}`);
    }

    return this.mapToEntity(data);
  }

  /**
   * Soft delete / archive expense
   */
  async archiveExpense(businessId: string, expenseId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('expenses')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', expenseId)
      .eq('business_id', businessId);

    if (error) {
      throw new Error(`Failed to archive expense: ${error.message}`);
    }

    return true;
  }

  /**
   * Aggregated expense analytics
   */
  async getExpenseAnalytics(businessId: string) {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('amount, category_name, expense_date')
      .eq('business_id', businessId)
      .eq('is_archived', false);

    if (error) {
      throw new Error(`Failed to calculate expense analytics: ${error.message}`);
    }

    const expenses = data || [];
    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    // Group by category
    const categoryMap: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category_name || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount || 0);
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }));

    // Group by month
    const monthlyMap: Record<string, number> = {};
    expenses.forEach((e) => {
      const month = (e.expense_date || '').substring(0, 7); // YYYY-MM
      if (month) {
        monthlyMap[month] = (monthlyMap[month] || 0) + Number(e.amount || 0);
      }
    });

    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));

    return {
      totalExpenses,
      categoryBreakdown,
      monthlyTrend,
    };
  }

  /**
   * Request signed upload URL for an expense receipt
   */
  async getReceiptUploadUrl(
    businessId: string,
    expenseId: string,
    fileName: string,
    contentType: string,
    fileSizeBytes?: number
  ) {
    // 1. Verify expense exists and belongs to this business
    await this.getExpenseById(businessId, expenseId);

    // 2. Generate signed upload URL and tenant-scoped storage path
    return this.storageService.createReceiptSignedUploadUrl(
      businessId,
      expenseId,
      fileName,
      contentType,
      fileSizeBytes
    );
  }

  /**
   * Persist receipt storage path to expense record after upload succeeds
   */
  async completeReceiptUpload(
    businessId: string,
    expenseId: string,
    storagePath: string
  ): Promise<ExpenseEntity> {
    // 1. Verify expense exists and belongs to this business
    const existing = await this.getExpenseById(businessId, expenseId);

    // 2. Security validation: ensure the storagePath is scoped to this business and expense
    const expectedPrefix = `businesses/${businessId}/expenses/${expenseId}/`;
    if (!storagePath.startsWith(expectedPrefix)) {
      throw new Error('Tenant security violation: Storage path does not match authenticated business and expense.');
    }

    const oldPath = existing.receiptStoragePath;

    // 3. Update expense with new receipt path
    const updated = await this.updateExpense(businessId, expenseId, {
      receiptStoragePath: storagePath,
    });

    // 4. Clean up old receipt object if replaced
    if (oldPath && oldPath !== storagePath) {
      this.storageService.deleteReceiptFile(oldPath).catch((e) => {
        console.warn('Failed to clean up old receipt object:', e);
      });
    }

    // 5. Attach signed download URL
    const signedUrl = await this.storageService.getReceiptSignedUrl(storagePath);
    return {
      ...updated,
      receiptSignedUrl: signedUrl || undefined,
    };
  }

  /**
   * Get secure private download URL for an expense receipt
   */
  async getReceiptDownloadUrl(
    businessId: string,
    expenseId: string
  ): Promise<{ signedUrl: string; storagePath: string; expenseId: string }> {
    const expense = await this.getExpenseById(businessId, expenseId);
    if (!expense.receiptStoragePath) {
      throw new Error('No receipt attached to this expense.');
    }

    const signedUrl = await this.storageService.getReceiptSignedUrl(expense.receiptStoragePath);
    if (!signedUrl) {
      throw new Error('Failed to generate secure receipt access URL.');
    }

    return {
      signedUrl,
      storagePath: expense.receiptStoragePath,
      expenseId,
    };
  }

  /**
   * Remove receipt from expense and delete storage file
   */
  async deleteReceipt(businessId: string, expenseId: string): Promise<ExpenseEntity> {
    const expense = await this.getExpenseById(businessId, expenseId);
    if (expense.receiptStoragePath) {
      await this.storageService.deleteReceiptFile(expense.receiptStoragePath);
    }

    return this.updateExpense(businessId, expenseId, {
      receiptStoragePath: undefined,
    });
  }

  private mapToEntity(row: any): ExpenseEntity {
    return {
      id: row.id,
      businessId: row.business_id,
      title: row.title,
      titleAr: row.title_ar,
      amount: Number(row.amount || 0),
      category: row.category_name || 'Other',
      currency: row.currency || 'EGP',
      expenseDate: row.expense_date,
      paymentMethod: row.payment_method || 'Cash',
      notes: row.notes || '',
      receiptStoragePath: row.receipt_storage_path,
      isArchived: Boolean(row.is_archived),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
