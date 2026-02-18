import { getAuthedUser, getSupabaseAdmin, json, parseBody } from '../payments/_shared.js';

/**
 * GET /api/usage/stats - Get current usage statistics
 * POST /api/usage/stats - Track a usage event
 */
export default async function handler(req, res) {
  try {
    const { user, error: authError } = await getAuthedUser(req);
    if (authError || !user) return json(res, 401, { error: 'Unauthorized' });

    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      // Get user's current usage stats
      const { data: profile } = await supabase
        .from('users')
        .select(`
          plan_tier,
          billing_interval,
          jobs_count,
          clients_count,
          time_entries_month_count,
          proposals_month_count,
          email_campaigns_month_count,
          email_contacts_count,
          marketing_websites_count,
          portfolio_sites_count,
          linkinbio_sites_count,
          ai_credits_used,
          ai_credits_limit,
          usage_period_start,
          usage_period_end,
          stripe_subscription_status,
          stripe_current_period_end
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        return json(res, 404, { error: 'Profile not found' });
      }

      return json(res, 200, { usage: profile });
    }

    if (req.method === 'POST') {
      // Track a usage event
      const body = await parseBody(req);
      const { eventType, resourceId, metadata, incrementCounter } = body;

      if (!eventType) {
        return json(res, 400, { error: 'eventType is required' });
      }

      // Record the event
      const { error: eventError } = await supabase
        .from('usage_events')
        .insert({
          user_id: user.id,
          event_type: eventType,
          resource_id: resourceId || null,
          metadata: metadata || {},
        });

      if (eventError) {
        console.error('Error recording usage event:', eventError);
      }

      // Optionally increment a counter
      if (incrementCounter) {
        const counterField = `${incrementCounter}_count`;
        
        // Get current count
        const { data: currentData } = await supabase
          .from('users')
          .select(counterField)
          .eq('id', user.id)
          .maybeSingle();
        
        if (currentData) {
          const currentCount = currentData[counterField] || 0;
          const updates = { [counterField]: currentCount + 1 };
          
          await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id);
        }
      }

      return json(res, 200, { success: true, message: 'Usage tracked successfully' });
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error('Usage tracking error:', err);
    return json(res, 500, {
      error: err instanceof Error ? err.message : 'Failed to track usage',
    });
  }
}
