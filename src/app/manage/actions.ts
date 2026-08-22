'use server';

import { createClient } from '@supabase/supabase-js';
import DodoPayments from 'dodopayments';
import { createHash, randomBytes } from 'crypto';

export async function createRebidCheckout(listingId: string, newBid: number, rawToken: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    // Verify token
    const { data: access } = await supabaseAdmin
      .from('listing_access')
      .select('id')
      .eq('listing_id', listingId)
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (!access) return { error: 'Invalid or expired token.' };

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('id, name, status, current_bid')
      .eq('id', listingId)
      .maybeSingle();

    if (!listing) return { error: 'Listing not found.' };
    if (listing.status !== 'active') return { error: 'Listing is not active.' };

    const bidDifference = newBid - listing.current_bid;
    if (bidDifference <= 0) return { error: 'New bid must be strictly greater than the current bid.' };

    const bidId = crypto.randomUUID();

    const dodo = new DodoPayments({
      bearerToken: process.env.DODO_BEARER_TOKEN,
      environment: 'test_mode' /* FORCED TEST MODE */
    });

    const product = await dodo.products.create({
      name: `Gotop Rebid: ${listing.name}`,
      tax_category: 'digital_products',
      price: {
         type: 'one_time_price',
         currency: 'USD',
         price: bidDifference * 100, // Cents
         discount: 0,
         purchasing_power_parity: false,
      }
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gotop.lol';
    
    // Checkout-First: NO DB INSERT HERE
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: product.product_id, quantity: 1 }],
      metadata: {
         type: 'rebid',
         listing_id: listingId,
         bid_id: bidId,
         previous_amount: listing.current_bid.toString(),
         new_amount: newBid.toString()
      },
      return_url: `${appUrl}/manage/${listingId}/${rawToken}?status=success`
    });

    return { checkoutUrl: session.checkout_url || (session as any).payment_link };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return { error: 'Failed to create checkout: ' + errMsg };
  }
}
