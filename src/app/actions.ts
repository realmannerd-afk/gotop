"use server";

import { supabaseServer } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';

export interface Space {
  id: number;
  name: string;
  url: string;
  logoUrl: string | null;
  claimedAt: string;
}

export async function getStats() {
  const { count, error } = await supabaseServer
    .from('spaces')
    .select('*', { count: 'exact', head: true });
    
  if (error) return { claimed: 0 };
  return { claimed: count || 0 };
}

export async function getAllClaims() {
  const { data, error } = await supabaseServer
    .from('spaces')
    .select('id, name, url, logo_url, claimed_at')
    .order('id', { ascending: true })
    .limit(10000);
    
  if (error) return [];
  
  return data.map(d => ({
    id: d.id,
    name: d.name,
    url: d.url,
    logoUrl: d.logo_url,
    claimedAt: new Date(d.claimed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }));
}

export async function getSpace(id: number) {
  const { data, error } = await supabaseServer
    .from('spaces')
    .select('id, name, url, logo_url, claimed_at')
    .eq('id', id)
    .single();
    
  if (error || !data) return null;
  
  return {
    id: data.id,
    name: data.name,
    url: data.url,
    logoUrl: data.logo_url,
    claimedAt: new Date(data.claimed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  };
}

export async function claimSpace(id: number, name: string, url: string) {
  if (id < 1 || id > 1000000) return { error: 'Invalid space ID.' };
  if (!name || name.length > 80) return { error: 'Name must be 1-80 chars.' };
  if (!url || url.length > 255) return { error: 'Invalid URL.' };

  const cookieStore = await cookies();
  let sessId = cookieStore.get('anon_session')?.value;
  if (!sessId) {
    sessId = randomUUID();
    cookieStore.set('anon_session', sessId, { maxAge: 60*60*24*365, httpOnly: true });
  }

  let domain = '';
  try {
    const formatted = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    domain = new URL(formatted).hostname;
  } catch (e) {
    return { error: 'Invalid URL format.' };
  }

  const logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  // Insert exactly into the requested ID
  const { error: insertError } = await supabaseServer.from('spaces').insert({
    id,
    name,
    url,
    logo_url,
    anonymous_session_id: sessId
  });

  if (insertError) {
    if (insertError.code === '42P01') {
      return { error: 'Database not setup. Please run the SQL migration in Supabase.' };
    }
    if (insertError.code === '23505') {
      return { error: 'This space was just claimed by someone else! Please choose another.' };
    }
    return { error: 'Database error occurred: ' + insertError.message };
  }

  return { success: true, id, logoUrl: logo_url };
}
