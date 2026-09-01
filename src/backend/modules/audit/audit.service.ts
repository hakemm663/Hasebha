import { getSupabaseAdmin } from '../../common/supabase-admin';

export class AuditService {
  private supabase = getSupabaseAdmin();

  async logAction(params: {
    businessId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
  }) {
    try {
      await this.supabase.from('audit_logs').insert({
        business_id: params.businessId,
        user_id: params.userId || null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        details: params.details || null,
        ip_address: params.ipAddress || null,
      });
    } catch (err) {
      console.warn('AuditService logAction note:', err);
    }
  }
}
