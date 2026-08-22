import { createClient } from '@supabase/supabase-js';
import DodoPayments from '@dodopayments/core';
import crypto from 'crypto';

function getAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing service role key');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// Ensure the token hash matches
async function verifyToken(supabaseAdmin: any, listingId: string, rawToken: string) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const { data: access } = await supabaseAdmin
    .from('listing_access')
    .select('id')
    .eq('listing_id', listingId)
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (!access) throw new Error('Unauthorized');
  return true;
}

export async function getManagementData(listingId: string, rawToken: string) {
  try {
    const supabaseAdmin = getAdminClient();
    await verifyToken(supabaseAdmin, listingId, rawToken);

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('id, name, url, description, status, current_bid')
      .eq('id', listingId)
      .maybeSingle();

    if (!listing) return { error: 'Listing not found' };

    // Find real rank
    let rank = null;
    if (listing.status === 'active') {
      const { data: activeListings } = await supabaseAdmin
        .from('listings')
        .select('id')
        .eq('status', 'active')
        .order('current_bid', { ascending: false })
        .order('bid_placed_at', { ascending: true });
        
      if (activeListings) {
        rank = activeListings.findIndex((l: any) => l.id === listingId) + 1;
      }
    }

    // Analytics
    const { data: allClicks } = await supabaseAdmin.from('clicks').select('created_at').eq('listing_id', listingId);
    const { data: allImpressions } = await supabaseAdmin.from('impressions').select('created_at').eq('listing_id', listingId);

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const clicksCount = allClicks ? allClicks.length : 0;
    const impressionsCount = allImpressions ? allImpressions.length : 0;
    const click24h = allClicks ? allClicks.filter((c: any) => c.created_at >= last24h).length : 0;
    const imp24h = allImpressions ? allImpressions.filter((i: any) => i.created_at >= last24h).length : 0;
    const click7d = allClicks ? allClicks.filter((c: any) => c.created_at >= last7d).length : 0;
    const imp7d = allImpressions ? allImpressions.filter((i: any) => i.created_at >= last7d).length : 0;

    return {
      listing,
      rank,
      analytics: {
        allTime: { impressions: impressionsCount, clicks: clicksCount },
        last24h: { impressions: imp24h, clicks: click24h },
        last7d:  { impressions: imp7d, clicks: click7d }
      }
    };

  } catch (error: any) {
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
      return { error: `New bid must be greater than current bid of $${listing.current_bid}.` };
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

    if (!process.env.DODO_PAYMENTS_API_KEY) {
      return { error: 'Payment provider not configured.' };
    }

    const dodo = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY
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

  } catch (error: any) {
    return { error: error.message || 'Database error' };
  }
}

export async function updateListingDetails(
  listingId: string, 
  rawToken: string, 
  data: { name: string; description: string }
) {
  try {
    const supabaseAdmin = getAdminClient();
    await verifyToken(supabaseAdmin, listingId, rawToken);

    if (data.name.length < 1 || data.name.length > 200) return { error: 'Name is invalid' };
    if (data.description.length < 5 || data.description.length > 1500) return { error: 'Description is invalid' };

    const { error } = await supabaseAdmin
      .from('listings')
      .update({
        name: data.name,
        description: data.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId);

    if (error) return { error: 'Failed to update listing' };
    return { success: true };

  } catch (error: any) {
    return { error: error.message || 'Database error' };
  }
}
