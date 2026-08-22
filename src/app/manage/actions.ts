/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createClient } from '@supabase/supabase-js';
import DodoPayments from 'dodopayments';
import { createHash, randomBytes } from 'crypto';

function getAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing service role key');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

async function verifyToken(supabaseAdmin: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, listingId: string, rawToken: string) {
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const { data: access } = await supabaseAdmin
    .from('listing_access')
    .select('id')
    .eq('listing_id', listingId)
    .eq('token_hash', tokenHash)
    .maybeSingle();
  
  if (!access) throw new Error('Invalid or expired management link.');
}

export async function getManagementData(listingId: string, rawToken: string) {
  try {
    const supabaseAdmin = getAdminClient();
    await verifyToken(supabaseAdmin, listingId, rawToken);

    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .select('*, categories(name)')
      .eq('id', listingId)
      .maybeSingle();

    if (error || !listing) return { error: 'Listing not found.' };


    // Get analytics
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: allImpressions } = await supabaseAdmin.from('impressions').select('created_at').eq('listing_id', listingId);
    const { data: allClicks } = await supabaseAdmin.from('clicks').select('created_at').eq('listing_id', listingId);

    const impressionsCount = allImpressions ? allImpressions.length : 0;
    const clicksCount = allClicks ? allClicks.length : 0;
    
    const imp24h = allImpressions ? allImpressions.filter(i => i.created_at >= last24h).length : 0;
    const click24h = allClicks ? allClicks.filter(c => c.created_at >= last24h).length : 0;
    
    const imp7d = allImpressions ? allImpressions.filter(i => i.created_at >= last7d).length : 0;
    const click7d = allClicks ? allClicks.filter(c => c.created_at >= last7d).length : 0;

    const analytics = {
      allTime: { impressions: impressionsCount, clicks: clicksCount },
      last24h: { impressions: imp24h, clicks: click24h },
      last7d:  { impressions: imp7d, clicks: click7d }
    };

    // Get bid history
    const { data: bidHistory } = await supabaseAdmin
      .from('bids')
      .select('amount, previous_amount, amount_paid, created_at, status')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    // Calculate current rank and #1 bid
    const { data: allActive } = await supabaseAdmin
      .from('listings')
      .select('id, current_bid')
      .eq('status', 'active')
      .order('current_bid', { ascending: false })
      .order('bid_placed_at', { ascending: true });

    let currentRank = 0;
    let numberOneBid = 0;

    if (allActive && allActive.length > 0) {
      currentRank = allActive.findIndex((l: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => l.id === listingId) + 1;
      numberOneBid = allActive[0].current_bid;
    }

    return {
      data: {
        listing,
        analytics,
        bidHistory: bidHistory || [],
        currentRank,
        numberOneBid
      }
    };
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: error.message || 'Database error' };
  }
}

export async function processRebidMock(listingId: string, rawToken: string, newBid: number) {
  try {
    const supabaseAdmin = getAdminClient();
    await verifyToken(supabaseAdmin, listingId, rawToken);

    if (newBid < 1 || !Number.isInteger(newBid)) return { error: 'Invalid bid amount.' };

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('id, name, current_bid, status')
      .eq('id', listingId)
      .maybeSingle();

    if (!listing) return { error: 'Listing not found.' };
    if (listing.status !== 'active') return { error: 'Listing is not active yet.' };

    if (newBid <= listing.current_bid) {
      return { error: `New bid must be greater than current bid of ${listing.current_bid}.` };
    }

    const amountToPay = newBid - listing.current_bid;

    // Insert pending bid record
    const { data: insertedBid, error: bidError } = await supabaseAdmin
      .from('bids')
      .insert({
        listing_id: listingId,
        amount: newBid,
        previous_amount: listing.current_bid,
        amount_paid: amountToPay,
        status: 'pending' // pending until webhook
      })
      .select('id')
      .single();

    if (bidError || !insertedBid) {
      return { error: 'Failed to initialize rebid' };
    }

    const dodo = new DodoPayments({
      bearerToken: process.env.DODO_BEARER_TOKEN,
      environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode'
    });

    const product = await dodo.products.create({
      name: `Gotop Rebid: ${listing.name}`,
      tax_category: 'digital_products',
      price: {
         type: 'one_time_price',
         currency: 'USD',
         price: amountToPay * 100, // Convert dollars to cents for Dodo
         discount: 0,
         purchasing_power_parity: false,
      }
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gotop.lol';

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: product.product_id, quantity: 1 }],
      metadata: {
         listing_id: listingId,
         bid_id: insertedBid.id,
         type: 'rebid'
      },
      return_url: `${appUrl}/manage/${listingId}/${rawToken}?status=success`
    });

    return { checkoutUrl: session.checkout_url };

  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: error.message || 'Database error' };
  }
}

export async function updateListingDetails(listingId: string, rawToken: string, details: {
  name?: string;
  description?: string;
  logoUrl?: string;
}) {
  try {
    const supabaseAdmin = getAdminClient();
    await verifyToken(supabaseAdmin, listingId, rawToken);

    if (details.name && (details.name.length < 2 || details.name.length > 80)) return { error: 'Invalid name length' };
    if (details.description && (details.description.length < 20 || details.description.length > 500)) return { error: 'Invalid description length' };

    await supabaseAdmin
      .from('listings')
      .update({
        name: details.name,
        description: details.description,
        logo_url: details.logoUrl
      })
      .eq('id', listingId);

    return { success: true };
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return { error: error.message || 'Database error' };
  }
}
