import { SharedTimeReportResponse, TimeShareLink } from '../types';
import { supabase } from './supabaseClient';

type DbTimeShareLink = {
  id: string;
  user_id: string;
  token: string;
  label: string;
  from_time: string | null;
  to_time: string | null;
  include_details: boolean;
  created_at: string;
  revoked_at: string | null;
  expires_at: string | null;
};

const mapDbToApp = (row: DbTimeShareLink): TimeShareLink => ({
  id: row.id,
  userId: row.user_id,
  token: row.token,
  label: row.label || 'Time Report',
  fromTime: row.from_time,
  toTime: row.to_time,
  includeDetails: Boolean(row.include_details),
  createdAt: row.created_at,
  revokedAt: row.revoked_at,
  expiresAt: row.expires_at,
});

const getToken = async (): Promise<string | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

export const listTimeShareLinks = async (): Promise<{ data: TimeShareLink[]; error: Error | null }> => {
  const token = await getToken();
  if (!token) return { data: [], error: new Error('Unauthorized') };

  const response = await fetch('/api/time-share-links', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { data: [], error: new Error(body.error || 'Failed to load share links') };

  return { data: ((body.links as DbTimeShareLink[]) || []).map(mapDbToApp), error: null };
};

export const createTimeShareLink = async (payload: {
  label: string;
  fromTime: string | null;
  toTime: string | null;
  includeDetails: boolean;
  expiresAt: string | null;
}): Promise<{ data: TimeShareLink | null; error: Error | null }> => {
  const token = await getToken();
  if (!token) return { data: null, error: new Error('Unauthorized') };

  const response = await fetch('/api/time-share-links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { data: null, error: new Error(body.error || 'Failed to create share link') };

  return { data: mapDbToApp(body.link as DbTimeShareLink), error: null };
};

export const revokeTimeShareLink = async (id: string): Promise<{ data: TimeShareLink | null; error: Error | null }> => {
  const token = await getToken();
  if (!token) return { data: null, error: new Error('Unauthorized') };

  const response = await fetch(`/api/time-share-links?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { data: null, error: new Error(body.error || 'Failed to revoke share link') };

  return { data: mapDbToApp(body.link as DbTimeShareLink), error: null };
};

export const getSharedTimeReport = async (token: string): Promise<{ data: SharedTimeReportResponse | null; error: Error | null }> => {
  const response = await fetch(`/api/public/time-share?token=${encodeURIComponent(token)}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { data: null, error: new Error(body.error || 'Failed to load report') };
  return { data: body as SharedTimeReportResponse, error: null };
};

