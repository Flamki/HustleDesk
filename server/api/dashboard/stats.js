import {
  authenticate,
  sendSuccess,
  sendBadRequest,
  sendMethodNotAllowed,
  sendServerError,
  parseQueryParams,
  validateEnum,
  logger,
  executeQuery,
  RATE_LIMIT_CONFIGS,
  applyRateLimit,
} from '../_shared/index.js';

const VALID_RANGES = ['7d', '30d', '90d'];

const getRangeStartIso = (range) => {
  const now = new Date();
  const validRange = VALID_RANGES.includes(range) ? range : '7d';
  
  if (validRange === '30d') now.setUTCDate(now.getUTCDate() - 30);
  else if (validRange === '90d') now.setUTCDate(now.getUTCDate() - 90);
  else now.setUTCDate(now.getUTCDate() - 7);
  
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
};

const startOfMonthIso = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString();
};

const todayDate = () => new Date().toISOString().slice(0, 10);

const buildActivity = (jobs) => {
  const activity = [];
  for (const job of jobs) {
    activity.push({
      type: 'saved',
      title: job.title,
      platform: job.platform,
      timestamp: job.created_at,
      text: `Saved ${job.title}`,
    });
    if (job.applied_at) {
      activity.push({
        type: 'applied',
        title: job.title,
        platform: job.platform,
        timestamp: job.applied_at,
        text: `Applied to ${job.title}`,
      });
    }
    if (job.closed_at && (job.status === 'won' || job.status === 'lost')) {
      activity.push({
        type: job.status,
        title: job.title,
        platform: job.platform,
        timestamp: job.closed_at,
        text: job.status === 'won' ? `Won ${job.title}` : `Closed ${job.title} as lost`,
      });
    }
  }
  return activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
};

/**
 * Dashboard stats endpoint - aggregates key metrics for the user
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return sendMethodNotAllowed(res, ['GET']);
    }

    // Apply rate limiting (lenient for dashboard)
    const rateLimitAllowed = await applyRateLimit(req, res, RATE_LIMIT_CONFIGS.LENIENT, 'dashboard:stats');
    if (!rateLimitAllowed) return;

    // Authenticate
    const auth = await authenticate(req, res);
    if (!auth) return;

    const { user, supabase } = auth;

    // Parse and validate range parameter
    const params = parseQueryParams(req);
    const range = String(params.range || '7d');
    
    const rangeValidation = validateEnum(range, VALID_RANGES, 'Range');
    if (!rangeValidation.valid) {
      return sendBadRequest(res, rangeValidation.error);
    }

    const weekStart = getRangeStartIso(range);
    const monthStart = startOfMonthIso();
    const today = todayDate();

    // Execute all queries in parallel for performance
    const [
      applicationsResult,
      awaitingReplyResult,
      activeConversationsResult,
      wonDataResult,
      followupsDueResult,
      activityJobsResult,
    ] = await Promise.all([
      executeQuery(
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('status', 'saved')
          .gte('created_at', weekStart),
        { operation: 'dashboard_applications', userId: user.id }
      ),
      executeQuery(
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'applied'),
        { operation: 'dashboard_awaiting_reply', userId: user.id }
      ),
      executeQuery(
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'replied'),
        { operation: 'dashboard_active_conversations', userId: user.id }
      ),
      executeQuery(
        supabase
          .from('jobs')
          .select('id,proposed_price', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'won')
          .gte('created_at', monthStart),
        { operation: 'dashboard_won_jobs', userId: user.id }
      ),
      executeQuery(
        supabase
          .from('jobs')
          .select('*')
          .eq('user_id', user.id)
          .eq('followup_date', today)
          .order('created_at', { ascending: false }),
        { operation: 'dashboard_followups', userId: user.id }
      ),
      executeQuery(
        supabase
          .from('jobs')
          .select('title,platform,status,created_at,applied_at,closed_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        { operation: 'dashboard_activity', userId: user.id }
      ),
    ]);

    // Check for errors in any query
    if (!wonDataResult.success || !followupsDueResult.success || !activityJobsResult.success) {
      logger.error('Dashboard query failed', {
        userId: user.id,
        wonDataError: wonDataResult.error,
        followupsError: followupsDueResult.error,
        activityError: activityJobsResult.error,
      });
      return sendServerError(res, 'Failed to fetch dashboard data');
    }

    const totalRevenue = (wonDataResult.data || []).reduce(
      (sum, row) => sum + Number(row.proposed_price || 0),
      0
    );
    
    const recentActivity = buildActivity(activityJobsResult.data || []);

    logger.info('Dashboard stats fetched', {
      userId: user.id,
      range,
    });

    return sendSuccess(res, {
      applications_this_week: applicationsResult.count || 0,
      awaiting_reply: awaitingReplyResult.count || 0,
      active_conversations: activeConversationsResult.count || 0,
      projects_won: wonDataResult.count || 0,
      total_revenue: totalRevenue,
      followups_due: followupsDueResult.data || [],
      recent_activity: recentActivity,
      range,
    });
  } catch (error) {
    logger.logError(error, req);
    return sendServerError(res, 'Internal server error');
  }
}
