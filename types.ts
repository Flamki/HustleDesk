
export interface AuthError {
  email?: string;
  password?: string;
  general?: string;
}

export interface PasswordRequirement {
  id: string;
  label: string;
  regex: RegExp;
  met: boolean;
}

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  plan: SubscriptionPlan;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  skills: string[];
  createdAt: string;
}

export interface AuthResponse {
  user: User | null;
  error: Error | null;
}

export type JobStatus = 'Saved' | 'Applied' | 'Replied' | 'Won' | 'Lost';

export interface Job {
  id: string;
  title: string;
  company?: string;
  platform: string;
  description: string;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  proposedPrice?: number;
  status: JobStatus;
  createdAt: string;
  appliedAt?: string;
  followUpAt?: string;
  closedAt?: string;
  notes?: string;
  proposal?: string;
  userId?: string;
}

export interface JobsListQuery {
  status?: 'saved' | 'applied' | 'replied' | 'won' | 'lost';
  platform?: 'upwork' | 'fiverr' | 'linkedin' | 'other';
  limit?: number;
  offset?: number;
  search?: string;
}

export interface JobsListResponse {
  jobs: Job[];
  total: number;
  limit: number;
  offset: number;
}

export interface DashboardActivity {
  type: 'saved' | 'applied' | 'won' | 'lost';
  title: string;
  platform: string;
  timestamp: string;
  text: string;
}

export interface DashboardStatsResponse {
  applications_this_week: number;
  awaiting_reply: number;
  active_conversations: number;
  projects_won: number;
  total_revenue: number;
  followups_due: Job[];
  recent_activity: DashboardActivity[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface AiPreferences {
  defaultTone: 'professional' | 'friendly' | 'confident';
  defaultLength: 'concise' | 'standard' | 'detailed';
}

export interface NotificationSettings {
  emailFollowUp: boolean;
  emailReplies: boolean;
  emailWeeklyStats: boolean;
}

export interface FreelancerProfile {
  id: string;
  userId: string;
  skills: string[];
  experienceLevel: 'Entry' | 'Intermediate' | 'Expert';
  yearsExperience: number;
  bio: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  hourlyRate: number;
  pastProjects: Project[];
  communicationStyle: string;
  completedOnboarding: boolean;
  preferences?: AiPreferences;
  notificationSettings?: NotificationSettings;
}

export interface TimeEntry {
  id: string;
  userId: string;
  jobId?: string;
  client: string;
  project: string;
  description: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  hourlyRate: number;
  currency: string;
  earnings: number;
  createdAt: string;
}

export interface TimeEntriesQuery {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface TimeEntriesResponse {
  entries: TimeEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface TimeShareLink {
  id: string;
  userId: string;
  token: string;
  label: string;
  fromTime: string | null;
  toTime: string | null;
  includeDetails: boolean;
  createdAt: string;
  revokedAt: string | null;
  expiresAt: string | null;
}

export interface SharedTimeReportResponse {
  link: {
    label: string;
    from_time: string;
    to_time: string;
    include_details: boolean;
    created_at: string;
  };
  summary: {
    tracked_seconds: number;
    total_earnings: number;
    effective_hourly_rate: number;
    currency: string;
  };
  entries: Array<{
    id: string;
    client: string;
    project: string;
    description: string;
    start_time: string;
    end_time: string;
    duration_seconds: number;
    hourly_rate: number;
    currency: string;
    earnings: number;
  }>;
}

export interface TimeEntryShareLink {
  id: string;
  userId: string;
  timeEntryId: string;
  token: string;
  includeDetails: boolean;
  createdAt: string;
  revokedAt: string | null;
  expiresAt: string | null;
}

export interface SharedTimeEntryResponse {
  link: {
    include_details: boolean;
    created_at: string;
  };
  summary: {
    tracked_seconds: number;
    total_earnings: number;
    effective_hourly_rate: number;
    currency: string;
  };
  entry: {
    id: string;
    client: string;
    project: string;
    description: string;
    start_time: string;
    end_time: string;
    duration_seconds: number;
    hourly_rate: number;
    currency: string;
    earnings: number;
  };
}

export interface MarketingContact {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  tags: string[];
  status: 'subscribed' | 'unsubscribed' | 'pending';
  subscribedAt: string;
  unsubscribedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingCampaign {
  id: string;
  userId: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  bodyText: string;
  bodyHtml: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  audienceTag: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
}

export interface AnalyticsInsight {
  type: string;
  title: string;
  detail: string;
  confidence: number;
}

export interface AnalyticsResponse {
  range: string;
  metrics: {
    total_revenue: number;
    won_revenue: number;
    tracked_earnings: number;
    tracked_hours: number;
    effective_hourly_rate: number;
    win_rate: number;
    reply_rate: number;
    active_leads: number;
    closed_deals: number;
    win_probability_score: number;
  };
  funnel: Array<{ stage: string; value: number }>;
  platform_performance: Array<{
    platform: string;
    applications: number;
    wins: number;
    win_rate: number;
    revenue: number;
  }>;
  trend: Array<{ label: string; revenue: number; applications: number; wins: number }>;
  insights: AnalyticsInsight[];
  forecast: {
    next_30_days_revenue: number;
    avg_daily_revenue: number;
    trend_slope_per_day: number;
    confidence: number;
  };
  cohort_retention: Array<{
    cohort_month: string;
    cohort_size: number;
    retention: Array<{
      month: string;
      retained: number;
      rate: number;
    }>;
  }>;
}

export interface ClientInsight {
  name: string;
  status: 'Active' | 'Lead' | 'Dormant';
  total_revenue: number;
  projects_count: number;
  jobs_count: number;
  won_jobs: number;
  active_leads: number;
  tracked_hours: number;
  effective_hourly_rate: number;
  last_active_at: string | null;
  last_active_label: string;
  health_score: number;
}

export interface ClientsInsightsResponse {
  segmentation_weights: {
    won_job_weight: number;
    active_lead_weight: number;
    revenue_weight: number;
    recency_recent_weight: number;
    recency_warm_weight: number;
    dormancy_penalty: number;
  };
  summary: {
    total_clients: number;
    retained_clients: number;
    retention_rate: number;
    total_client_revenue: number;
  };
  clients: ClientInsight[];
  opportunities: Array<{
    client: string;
    potential: string;
    reason: string;
    action: string;
  }>;
  distribution: Array<{
    label: string;
    value: number;
  }>;
}
