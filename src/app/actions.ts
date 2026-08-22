'use server';

import { createClient } from '@supabase/supabase-js';
import DodoPayments from 'dodopayments';
import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';

function normalizeUrl(url: string) {
  let normalized = url.toLowerCase().trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  return normalized;
}

async function isSafeUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('127.')) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

import { fetchMetadata } from '@/lib/metadata';
export async function fetchUrlMetadata(url: string) {
  let targetUrl = url;
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }
  const safe = await isSafeUrl(targetUrl);
  if (!safe) return { error: 'Invalid or unsafe URL' };
  const meta = await fetchMetadata(targetUrl);
  return { data: meta, targetUrl };
}

export async function getCategories() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const { data } = await supabaseAdmin.from('categories').select('*').order('name');
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function fetchCategories() {
  return await getCategories();
}

export async function submitListing(data: {
  url: string;
  name: string;
  description: string;
  category: string;
  bid: number;
}) {
  try {
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
    
    const safe = await isSafeUrl(data.url);
    if (!safe) return { error: 'Invalid or unsafe URL' };
    
    const normalizedUrl = normalizeUrl(data.url);
    if (data.name.length < 1 || data.name.length > 200) return { error: 'Name is invalid' };
    if (data.description.length < 5 || data.description.length > 1500) return { error: 'Description is invalid' };
    if (data.bid < 1 || !Number.isInteger(data.bid)) return { error: 'Minimum bid is $1, whole numbers only' };

    const categories = await getCategories();
    const cat = categories.find(c => c.name === data.category);
    if (!cat) return { error: 'Invalid category' };

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing service role key');
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Duplicate Check
    const { data: existing } = await supabaseAdmin
      .from('listings')
      .select('id, status')
      .eq('url', normalizedUrl)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return { error: 'This website is already on the leaderboard. Go to its management page to rebid.' };
    }

    const listingId = crypto.randomUUID();
    const bidId = crypto.randomUUID();
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const safeDescription = data.description.substring(0, 450);

    const dodo = new DodoPayments({ bearerToken: process.env.DODO_BEARER_TOKEN, environment: 'test_mode' /* FORCED TEST MODE */ });
    
    const product = await dodo.products.create({
      name: `Gotop Leaderboard: ${data.name.substring(0, 50)}`,
      tax_category: 'digital_products',
      price: {
         type: 'one_time_price',
         currency: 'USD',
         price: data.bid * 100, // Cents
         discount: 0,
         purchasing_power_parity: false,
      }
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gotop.lol';
    
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: product.product_id, quantity: 1 }],
      return_url: `${appUrl}/success/${listingId}`,
      metadata: {
        type: 'initial_bid',
        listing_id: listingId,
        bid_id: bidId,
        url: normalizedUrl,
        name: data.name.substring(0, 200),
        slug: slug.substring(0, 100),
        description: safeDescription,
        token_hash: tokenHash,
        amount: data.bid.toString(),
        category_id: cat.id
      }
    });

    return { 
      success: true, 
      listingId,
      token: rawToken,
      checkoutUrl: session.checkout_url || (session as any).payment_link 
    };

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return { error: 'Failed to create checkout: ' + errMsg };
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
    return { success: false };
  }
}

export async function getCheckoutData(listingId: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { data: listing } = await supabaseAdmin.from('listings').select('*').eq('id', listingId).maybeSingle();
    return { data: { listing }, isAlreadyActive: listing?.status === 'active' };
  } catch (error) {
    return { error: 'Database error' };
  }
}

export async function getListingById(listingId: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const { data } = await supabaseAdmin.from('listings').select('id, name, url, logo_url').eq('id', listingId).maybeSingle();
    return data;
  } catch(err) {
    return null;
  }
}
