import { SharedTimeEntryResponse, TimeEntryShareLink } from '../types';
import { supabase } from './supabaseClient';

type DbTimeEntryShareLink = {
  id: string;
  user_id: string;
  time_entry_id: string;
  token: string;
  include_details: boolean;
  created_at: string;
  revoked_at: string | null;
  expires_at: string | null;
};

const mapDbToApp = (row: DbTimeEntryShareLink): TimeEntryShareLink => ({
  id: row.id,
  userId: row.user_id,
  timeEntryId: row.time_entry_id,
  token: row.token,
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

export const listTimeEntryShareLinks = async (
  timeEntryId: string
): Promise<{ data: TimeEntryShareLink[]; error: Error | null }> => {
  const token = await getToken();
  if (!token) return { data: [], error: new Error('Unauthorized') };

  const params = new URLSearchParams();
  params.set('timeEntryId', timeEntryId);
  const response = await fetch(`/api/time-entry-share-links?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { data: [], error: new Error(body.error || 'Failed to load share links') };

  const links = Array.isArray(body.links) ? (body.links as DbTimeEntryShareLink[]).map(mapDbToApp) : [];
  return { data: links, error: null };
};

export const createTimeEntryShareLink = async (payload: {
  timeEntryId: string;
  includeDetails: boolean;
  expiresAt: string | null;
  forceNew?: boolean;
}): Promise<{ data: TimeEntryShareLink | null; error: Error | null }> => {
  const token = await getToken();
  if (!token) return { data: null, error: new Error('Unauthorized') };

  const response = await fetch('/api/time-entry-share-links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { data: null, error: new Error(body.error || 'Failed to create share link') };

  return { data: mapDbToApp(body.link as DbTimeEntryShareLink), error: null };
};

export const revokeTimeEntryShareLink = async (
  id: string
): Promise<{ data: TimeEntryShareLink | null; error: Error | null }> => {
  const token = await getToken();
  if (!token) return { data: null, error: new Error('Unauthorized') };

  const response = await fetch(`/api/time-entry-share-links?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { data: null, error: new Error(body.error || 'Failed to revoke share link') };

  return { data: mapDbToApp(body.link as DbTimeEntryShareLink), error: null };
};

export const getSharedTimeEntry = async (
  token: string
): Promise<{ data: SharedTimeEntryResponse | null; error: Error | null }> => {
  const response = await fetch(`/api/public/time-entry?token=${encodeURIComponent(token)}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { data: null, error: new Error(body.error || 'Failed to load entry') };
  return { data: body as SharedTimeEntryResponse, error: null };
};
