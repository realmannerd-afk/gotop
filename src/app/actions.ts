'use server';
import DodoPayments from 'dodopayments';
import { cookies } from 'next/headers';

import { getCategories } from '@/data/db';
import { fetchMetadata } from '@/lib/metadata';
import { normalizeUrl, isSafeUrl } from '@/lib/url';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHash } from 'crypto';

export async function fetchCategories() {
  return await getCategories();
}

export async function fetchUrlMetadata(url: string) {
  let targetUrl = url;
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }
  const safe = await isSafeUrl(targetUrl);
  if (!safe) {
    return { error: 'Invalid or unsafe URL' };
  }
  const meta = await fetchMetadata(targetUrl);
  return { data: meta, targetUrl };
}

export async function submitListing(data: {
  url: string;
  name: string;
  description: string;
  category: string;
  bid: number;
}) {
  try {
    
    // Auto-fetch metadata if not provided
    if (!data.name || !data.description) {
      const metaRes = await fetchUrlMetadata(data.url);
      if (!metaRes.error && metaRes.data) {
        data.url = metaRes.targetUrl || data.url;
        data.name = data.name || metaRes.data.title || new URL(data.url).hostname;
        data.description = data.description || metaRes.data.description || 'No description available for this website.';
      } else {
        return { error: 'Failed to securely reach website. Please check the URL.' };
      }
    }
    
    // 1. Validation

    const safe = await isSafeUrl(data.url);
    if (!safe) return { error: 'Invalid or unsafe URL' };
    
    const normalizedUrl = normalizeUrl(data.url);
    if (data.name.length < 1 || data.name.length > 200) return { error: 'Name is invalid' };
    if (data.description.length < 5 || data.description.length > 1500) return { error: 'Description is invalid' };
    
    if (data.bid < 1 || !Number.isInteger(data.bid)) return { error: 'Minimum bid is $1, whole numbers only' };

    // Get categories to validate
    const categories = await getCategories();
    const cat = categories.find(c => c.name === data.category);
    if (!cat) return { error: 'Invalid category' };

    // Initialize Service Role Client (throws if not set)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Server configuration error: missing service role key');
    }
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // 2. Duplicate Check
    const { data: existing } = await supabaseAdmin
      .from('listings')
      .select('id, status')
      .eq('url', normalizedUrl)
      .maybeSingle();
      
    if (existing) {
      if (existing.status === 'active') {
        return { error: 'This product is already listed.' };
      }
      if (existing.status === 'pending') {
        // User aborted previous checkout, delete it so they can try again cleanly
        await supabaseAdmin.from('bids').delete().eq('listing_id', existing.id);
        await supabaseAdmin.from('listings').delete().eq('id', existing.id);
      }
    }

    // Generate slug
    let slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const { data: slugCheck } = await supabaseAdmin.from('listings').select('id').eq('slug', slug).maybeSingle();
    if (slugCheck) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // 3. Insert Listing
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .insert({
        name: data.name,
        slug,
        url: normalizedUrl,
        description: data.description,
        category_id: cat.id,
        current_bid: data.bid,
        status: 'pending'
      })
      .select('id')
      .single();

    if (listingError || !listing) {
      if (listingError?.code === '23505') {
        return { error: 'This product is already listed.' };
      }
      throw listingError || new Error('Failed to create listing');
    }

    // 4. Insert Bid
    const { error: bidError } = await supabaseAdmin
      .from('bids')
      .insert({
        listing_id: listing.id,
        amount: data.bid,
        previous_amount: 0,
        amount_paid: data.bid,
        status: 'pending'
      });

    if (bidError) {
      // Rollback
      await supabaseAdmin.from('listings').delete().eq('id', listing.id);
      throw bidError;
    }

    // 5. Generate and Insert Token
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const { error: accessError } = await supabaseAdmin
      .from('listing_access')
      .insert({
        listing_id: listing.id,
        token_hash: tokenHash
      });

    if (accessError) {
      // Rollback
      await supabaseAdmin.from('bids').delete().eq('listing_id', listing.id);
      await supabaseAdmin.from('listings').delete().eq('id', listing.id);
      throw accessError;
    }

    return { 
      success: true, 
      listingId: listing.id,
      token: rawToken // Only returned once!
    };
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error('Submit error:', error);
    return { error: 'An unexpected error occurred during submission.' };
  }
}

export async function getCheckoutData(listingId: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing service role key');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, name, description, logo_url, status, category_id, categories(name)')
      .eq('id', listingId)
      .maybeSingle();

    if (listingError || !listing) return { error: 'Listing not found.' };

    if (listing.status === 'active') return { error: 'This listing is already active.', isAlreadyActive: true };
    if (listing.status !== 'pending') return { error: `Listing is ${listing.status}.` };

    const { data: bid, error: bidError } = await supabaseAdmin
      .from('bids')
      .select('id, amount, status')
      .eq('listing_id', listingId)
      .eq('status', 'pending')
      .maybeSingle();

    if (bidError || !bid) return { error: 'Pending bid not found.' };

    return {
      data: {
        listing,
        bid
      }
    };
  } catch (error) {
    console.error('getCheckoutData error:', error);
    return { error: 'Database error' };
  }
}

export async function processMockPayment(listingId: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing service role key');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // 1 & 2. Load listing and pending bid
    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('id, status')
      .eq('id', listingId)
      .maybeSingle();

    if (!listing) return { error: 'Listing not found.' };
    
    // Idempotency check
    if (listing.status === 'active') {
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('id')
        .eq('listing_id', listingId)
        .eq('status', 'completed')
        .maybeSingle();
        
      if (payment) {
        // Calculate rank
        const { data: rankData } = await supabaseAdmin
          .from('listings')
          .select('id')
          .eq('status', 'active')
          .order('current_bid', { ascending: false })
          .order('bid_placed_at', { ascending: true });
        
        const rank = rankData ? rankData.findIndex(l => l.id === listingId) + 1 : 0;
        return { success: true, rank, currentBid: null }; 
      }
    }

    if (listing.status !== 'pending') return { error: `Listing is ${listing.status}.` };

    const { data: bid } = await supabaseAdmin
      .from('bids')
      .select('id, amount')
      .eq('listing_id', listingId)
      .eq('status', 'pending')
      .maybeSingle();

    if (!bid) return { error: 'Pending bid not found.' };
    
    // OCC Update for the bid (ensures idempotency)
    const { data: updatedBid, error: bidUpdateError } = await supabaseAdmin
      .from('bids')
      .update({ status: 'paid' })
      .eq('id', bid.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
      
    if (bidUpdateError || !updatedBid) {
      return { error: 'Payment already processing or failed.' };
    }

    // 4. Update listing
    await supabaseAdmin
      .from('listings')
      .update({ 
        status: 'active',
        current_bid: bid.amount,
        bid_placed_at: new Date().toISOString()
      })
      .eq('id', listingId);

    // 5. Create payment record
    await supabaseAdmin
      .from('payments')
      .insert({
        listing_id: listingId,
        bid_id: bid.id,
        amount: bid.amount,
        status: 'completed',
        provider: 'mock',
        provider_payment_id: `mock_txn_${randomBytes(8).toString('hex')}`
      });

    // 6. Calculate Rank
    const { data: rankData } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('status', 'active')
      .order('current_bid', { ascending: false })
      .order('bid_placed_at', { ascending: true });
    
    const rank = rankData ? rankData.findIndex(l => l.id === listingId) + 1 : 0;

    return { success: true, rank, currentBid: bid.amount };
  } catch (error) {
    console.error('processMockPayment error:', error);
    return { error: 'Database error' };
  }
}




export async function trackImpressions(listingIds: string[], placement: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('gt_sess')?.value;
    if (!sessionId) {
      sessionId = randomBytes(16).toString('hex');
      cookieStore.set('gt_sess', sessionId, {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    // deduplication check in DB: check if these impressions were recorded in the last 1 hour
    const { data: recent } = await supabase
      .from('impressions')
      .select('listing_id')
      .eq('session_id', sessionId)
      .eq('placement', placement)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
    
    const recentIds = new Set(recent?.map(r => r.listing_id) || []);
    const newIds = listingIds.filter(id => !recentIds.has(id));

    if (newIds.length === 0) return { success: true };

    const payload = newIds.map(id => ({
      listing_id: id,
      session_id: sessionId,
      placement
    }));

    await supabase.from('impressions').insert(payload);
    return { success: true };
  } catch (err) {
    console.error('Failed to track impressions', err);
    return { success: false };
  }
}

export async function createDodoCheckout(listingId: string) {
  try {
    if (!process.env.DODO_BEARER_TOKEN) throw new Error('Missing DODO_BEARER_TOKEN');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing service role key');
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data: listing } = await supabaseAdmin.from('listings').select('id, name, status').eq('id', listingId).maybeSingle();
    if (!listing) return { error: 'Listing not found.' };
    if (listing.status !== 'pending') return { error: 'Listing is not pending.' };

    const { data: bid } = await supabaseAdmin.from('bids').select('id, amount').eq('listing_id', listingId).eq('status', 'pending').maybeSingle();
    if (!bid) return { error: 'Pending bid not found.' };

    const dodo = new DodoPayments({ bearerToken: process.env.DODO_BEARER_TOKEN, environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode' });
    
    // Create product dynamically for this bid
    const product = await dodo.products.create({
      name: `Gotop Leaderboard: ${listing.name}`,
      tax_category: 'digital_products',
      price: {
         type: 'one_time_price',
         currency: 'USD',
         price: bid.amount * 100, // Cents
         discount: 0,
         purchasing_power_parity: false,
      }
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gotop.lol';
    
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: product.product_id, quantity: 1 }],
      metadata: {
         listing_id: listingId,
         bid_id: bid.id,
         type: 'initial_bid'
      },
      return_url: `${appUrl}/checkout/${listingId}?status=success`
    });

    return { checkoutUrl: session.checkout_url };
  } catch (error) {
    console.error('Dodo error:', error);
    return { error: 'Failed to create checkout' };
  }
}
