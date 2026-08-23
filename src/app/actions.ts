"use server";

import { supabaseServer } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';

export interface Space {
  id: number;
  message: string;
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
    .select('id, message, claimed_at')
    .order('id', { ascending: true })
    .limit(10000);
    
  if (error) return [];
  
  return data.map(d => ({
    id: d.id,
    message: d.message,
    claimedAt: new Date(d.claimed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }));
}

export async function getSpace(id: number) {
  const { data, error } = await supabaseServer
    .from('spaces')
    .select('id, message, claimed_at')
    .eq('id', id)
    .single();
    
  if (error || !data) return null;
  
  return {
    id: data.id,
    message: data.message,
    claimedAt: new Date(data.claimed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  };
}

export async function claimSpace(message: string) {
  if (!message || message.length > 80) return { error: 'Message must be 1-80 chars.' };

  const cookieStore = await cookies();
  let sessId = cookieStore.get('anon_session')?.value;
  if (!sessId) {
    sessId = randomUUID();
    cookieStore.set('anon_session', sessId, { maxAge: 60*60*24*365, httpOnly: true });
  }

  let attempts = 0;
  let claimedId = null;
  
  while (attempts < 5) {
    const { count, error: countError } = await supabaseServer.from('spaces').select('*', { count: 'exact', head: true });
    
    if (countError && countError.code === '42P01') {
      return { error: 'Database not setup. Please run the SQL migration.' };
    }

    const nextId = (count || 0) + 1;
    if (nextId > 1000000) return { error: 'All spaces claimed.' };

    const { error: insertError } = await supabaseServer.from('spaces').insert({
      id: nextId,
      message,
      anonymous_session_id: sessId
    });

    if (!insertError) {
      claimedId = nextId;
      break;
    }
    
    if (insertError.code !== '23505') {
      return { error: 'Database error occurred: ' + insertError.message };
    }
    
    attempts++;
  }

  if (!claimedId) return { error: 'High traffic. Please try again.' };

  return { success: true, id: claimedId };
}
