import { getSupabaseAdmin } from '../../common/supabase-admin';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './dto/customer.dto';

export interface CustomerEntity {
  id: string;
  businessId: string;
  code: string;
  name: string;
  nameAr?: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
  isArchived: boolean;
  totalInvoiced: number;
  outstandingBalance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export class CustomersService {
  private supabase = getSupabaseAdmin();

  /**
   * List customers for a specific business with optional search & pagination
   */
  async listCustomers(businessId: string, query: CustomerQueryDto = {}) {
    const { search, isArchived = false, page = 1, limit = 50 } = query;

    let dbQuery = this.supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .eq('is_archived', isArchived)
      .order('created_at', { ascending: false });

    if (search) {
      dbQuery = dbQuery.or(
        `name.ilike.%${search}%,name_ar.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await dbQuery.range(from, to);

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    // Map rows to camelCase entity
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
   * Find a single customer with strict tenant verification
   */
  async getCustomerById(businessId: string, customerId: string): Promise<CustomerEntity> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('business_id', businessId)
      .single();

    if (error || !data) {
      throw new Error(`Customer not found or unauthorized access: ${error?.message}`);
    }

    return this.mapToEntity(data);
  }

  /**
   * Create a new customer with auto-incrementing customer code
   */
  async createCustomer(businessId: string, dto: CreateCustomerDto): Promise<CustomerEntity> {
    // Generate next customer code for this business
    const { count } = await this.supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);

    const nextCode = `CUST-${String((count || 0) + 1).padStart(4, '0')}`;

    const { data, error } = await this.supabase
      .from('customers')
      .insert({
        business_id: businessId,
        code: nextCode,
        name: dto.name,
        name_ar: dto.nameAr || null,
        phone: dto.phone || null,
        email: dto.email || null,
        company: dto.company || null,
        address: dto.address || null,
        notes: dto.notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create customer: ${error?.message}`);
    }

    return this.mapToEntity(data);
  }

  /**
   * Update customer record
   */
  async updateCustomer(
    businessId: string,
    customerId: string,
    dto: UpdateCustomerDto
  ): Promise<CustomerEntity> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameAr !== undefined) updateData.name_ar = dto.nameAr;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.company !== undefined) updateData.company = dto.company;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.isArchived !== undefined) updateData.is_archived = dto.isArchived;

    const { data, error } = await this.supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update customer: ${error?.message}`);
    }

    return this.mapToEntity(data);
  }

  /**
   * Archive / Soft delete customer
   */
  async archiveCustomer(businessId: string, customerId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('customers')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', customerId)
      .eq('business_id', businessId);

    if (error) {
      throw new Error(`Failed to archive customer: ${error.message}`);
    }

    return true;
  }

  private mapToEntity(row: any): CustomerEntity {
    return {
      id: row.id,
      businessId: row.business_id,
      code: row.code,
      name: row.name,
      nameAr: row.name_ar,
      phone: row.phone || '',
      email: row.email || '',
      company: row.company || '',
      address: row.address || '',
      notes: row.notes || '',
      isArchived: Boolean(row.is_archived),
      totalInvoiced: Number(row.total_invoiced || 0),
      outstandingBalance: Number(row.outstanding_balance || 0),
      currency: row.currency || 'EGP',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
