import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest, { params }: { params: Promise<{ listingId: string }> }) {
  const resolvedParams = await params;
  const listingId = resolvedParams.listingId;
  const placement = request.nextUrl.searchParams.get('placement') || 'other';
  
  // Validate placement
  const allowedPlacements = ['homepage', 'leaderboard', 'trending', 'new', 'category', 'product'];
  const safePlacement = allowedPlacements.includes(placement) ? placement : 'other';
  
  const referrer = request.headers.get('referer') || null;

  // We can use the anon key since policies allow public read for active listings and public inserts for clicks
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: listing } = await supabase
    .from('listings')
    .select('id, url, status')
    .eq('id', listingId)
    .maybeSingle();

  if (!listing) return new NextResponse('Not Found', { status: 404 });
  if (listing.status !== 'active') return new NextResponse('Listing Unavailable', { status: 403 });

  let sessionId = request.cookies.get('gt_sess')?.value;
  let isNewSession = false;
  if (!sessionId) {
    sessionId = randomUUID();
    isNewSession = true;
  }

  try {
    await supabase.from('clicks').insert({
      listing_id: listingId,
      session_id: sessionId,
      placement: safePlacement,
      referrer
    });
  } catch (err) {
    console.error('Click tracking error:', err);
  }

  const response = NextResponse.redirect(listing.url, 302);
  
  if (isNewSession) {
    response.cookies.set('gt_sess', sessionId, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }
  
  return response;
}
