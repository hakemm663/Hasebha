import { getSupabaseAdmin } from '../../common/supabase-admin';

export interface NotificationEntity {
  id: string;
  businessId: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  relatedId?: string;
  createdAt: string;
}

export class NotificationsService {
  private supabase = getSupabaseAdmin();

  async listNotifications(businessId: string, limit = 50): Promise<NotificationEntity[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to list notifications: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      businessId: row.business_id,
      title: row.title,
      titleAr: row.title_ar,
      message: row.message,
      messageAr: row.message_ar,
      type: row.type,
      isRead: Boolean(row.is_read),
      actionUrl: row.action_url,
      relatedId: row.related_id,
      createdAt: row.created_at,
    }));
  }

  async markAsRead(businessId: string, notificationId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('business_id', businessId);

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
    return true;
  }

  async markAllAsRead(businessId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('business_id', businessId);

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
    return true;
  }
}
