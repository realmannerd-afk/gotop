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
  // Use exact count (count: 'exact', head: true)
  const { count, error } = await supabaseServer
    .from('spaces')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error("Count error", error);
    return { claimed: 0 };
  }
  
  return { claimed: count || 0 };
}

export async function getRecentClaims() {
  const { data, error } = await supabaseServer
    .from('spaces')
    .select('id, message, claimed_at')
    .order('claimed_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error("Recent claims error", error);
    return [];
  }
  
  return data.map(d => ({
    id: d.id,
    message: d.message,
    claimedAt: new Date(d.claimed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
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
    claimedAt: new Date(data.claimed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  };
}

export async function claimSpace(message: string) {
  if (!message || message.length > 80) {
    return { error: 'Message must be between 1 and 80 characters.' };
  }

  const cookieStore = await cookies();
  let sessId = cookieStore.get('anon_session')?.value;
  if (!sessId) {
    sessId = randomUUID();
    cookieStore.set('anon_session', sessId, { maxAge: 60*60*24*365, httpOnly: true });
  }

  // To assign a space, we determine the next available ID safely.
  // The simplest is to get the current count and add 1.
  // Because multiple people might try simultaneously, we retry if duplicate.
  let attempts = 0;
  let claimedId = null;
  
  while (attempts < 5) {
    const { count } = await supabaseServer.from('spaces').select('*', { count: 'exact', head: true });
    const nextId = (count || 0) + 1;
    
    if (nextId > 1000000) {
      return { error: 'All spaces have been claimed.' };
    }

    const { error: insertError } = await supabaseServer.from('spaces').insert({
      id: nextId,
      message,
      anonymous_session_id: sessId
    });

    if (!insertError) {
      claimedId = nextId;
      break;
    }
    
    // If it's a unique constraint violation on ID, loop will retry.
    // Otherwise, something is broken.
    if (insertError.code !== '23505') { // 23505 is PostgreSQL unique_violation
      return { error: 'Database error occurred. Please try again.' };
    }
    
    attempts++;
  }

  if (!claimedId) {
    return { error: 'High traffic. Please try claiming again.' };
  }

  return { success: true, id: claimedId };
}
