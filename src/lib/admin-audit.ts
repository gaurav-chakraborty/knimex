import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';

/**
 * Records an admin action against the existing analytics_events table so
 * user management changes (role/plan edits, deletions, creations) are
 * traceable without introducing a dedicated audit-log table.
 */
export async function logAdminAction(params: {
  adminId: string;
  action: 'admin_user_updated' | 'admin_user_deleted' | 'admin_user_created' | 'admin_user_upserted';
  targetUserId: string;
  details?: Record<string, unknown>;
}) {
  try {
    await db.insert(analyticsEvents).values({
      userId: params.adminId,
      eventType: params.action,
      eventData: { targetUserId: params.targetUserId, ...params.details },
    });
  } catch (error) {
    // Audit logging must never block the admin action itself.
    console.error('Failed to record admin audit event:', error);
  }
}
