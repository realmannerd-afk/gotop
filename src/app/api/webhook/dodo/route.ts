import { NextRequest } from 'next/server';
import { Webhooks } from '@dodopayments/nextjs';
import { createClient } from '@supabase/supabase-js';

export const POST = async (req: NextRequest) => {
  const handler = Webhooks({
    webhookKey: process.env.DODO_WEBHOOK_KEY || 'dummy_secret_for_build_time',
    onPayload: async (payload: any) => {
      console.log(`Received Dodo Webhook: ${payload.type}`);
  
      if (payload.type === 'payment.succeeded') {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing service role key');
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );

        const paymentId = payload.data.payment_id;
        const actualAmountCents = payload.data.total_amount;
        const actualCurrency = payload.data.currency ? payload.data.currency.toUpperCase() : 'UNKNOWN';
        const actualAmountDollars = actualAmountCents / 100;
        
        const metadata = (payload.data.metadata as any) || {};
        const { listing_id, bid_id, type } = metadata;

        const { data: existingPayment, error: existingError } = await supabaseAdmin
          .from('payments')
          .select('id, processing_status')
          .eq('provider_payment_id', paymentId)
          .maybeSingle();

        if (existingError) throw new Error('Database error checking idempotency');
        if (existingPayment) {
          console.log(`Payment ${paymentId} already processed (status: ${existingPayment.processing_status}). Idempotent success.`);
          return; 
        }

        let isValid = true;
        let processingStatus = 'processed';

        let cleanListingId = null;
        let cleanBidId = null;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (listing_id && uuidRegex.test(listing_id)) cleanListingId = listing_id;
        if (bid_id && uuidRegex.test(bid_id)) cleanBidId = bid_id;

        if (!cleanListingId || !cleanBidId || !type) {
          console.error(`Payment ${paymentId} missing or invalid metadata IDs.`);
          isValid = false;
          processingStatus = 'reconciliation_required';
        }

        if (actualCurrency !== 'USD') {
          console.error(`Payment ${paymentId} invalid currency: ${actualCurrency}.`);
          isValid = false;
          processingStatus = 'reconciliation_required';
        }

        const expectedAmount = type === 'initial_bid' ? Number(metadata.amount) : (Number(metadata.new_amount) - Number(metadata.previous_amount));
        if (isValid && actualAmountDollars !== expectedAmount) {
           console.error(`Payment ${paymentId} amount mismatch. Expected: ${expectedAmount}, Got: ${actualAmountDollars}`);
           isValid = false;
           processingStatus = 'reconciliation_required';
        }
        
        if (isValid) {
          if (type === 'initial_bid') {
            const { error: listingError } = await supabaseAdmin
              .from('listings')
              .insert({
                id: cleanListingId,
                name: metadata.name,
                slug: metadata.slug,
                url: metadata.url,
                description: metadata.description,
                status: 'active',
                current_bid: Number(metadata.amount),
                category_id: metadata.category_id || null,
                bid_placed_at: new Date().toISOString()
              });

            if (listingError) {
              console.error(`Failed to insert listing for ${paymentId}: ${listingError.message}`);
              isValid = false;
              processingStatus = 'reconciliation_required';
            } else {
              await supabaseAdmin.from('bids').insert({
                id: cleanBidId,
                listing_id: cleanListingId,
                amount: Number(metadata.amount),
                amount_paid: actualAmountDollars,
                status: 'paid'
              });

              if (metadata.token_hash) {
                await supabaseAdmin.from('listing_access').insert({
                  listing_id: cleanListingId,
                  token_hash: metadata.token_hash
                });
              }
            }
            
          } else if (type === 'rebid') {
            const { data: updatedListing } = await supabaseAdmin.from('listings')
              .update({ 
                current_bid: Number(metadata.new_amount), 
                bid_placed_at: new Date().toISOString() 
              })
              .eq('id', cleanListingId)
              .eq('current_bid', Number(metadata.previous_amount))
              .select('id').maybeSingle();

            if (updatedListing) {
              await supabaseAdmin.from('bids').insert({
                id: cleanBidId,
                listing_id: cleanListingId,
                amount: Number(metadata.new_amount),
                previous_amount: Number(metadata.previous_amount),
                amount_paid: actualAmountDollars,
                status: 'paid'
              });
            } else {
              console.error(`OCC Loss on rebid for ${paymentId}. Leaderboard state changed before payment landed.`);
              isValid = false;
              processingStatus = 'reconciliation_required';
              
              await supabaseAdmin.from('bids').insert({
                id: cleanBidId,
                listing_id: cleanListingId,
                amount: Number(metadata.new_amount),
                previous_amount: Number(metadata.previous_amount),
                amount_paid: actualAmountDollars,
                status: 'failed'
              });
            }
          }
        }

        const { error: paymentInsertError } = await supabaseAdmin
          .from('payments')
          .insert({
            listing_id: cleanListingId,
            bid_id: cleanBidId,
            amount: actualAmountDollars,
            expected_amount: expectedAmount,
            currency: actualCurrency,
            provider: 'dodo',
            provider_payment_id: paymentId,
            status: 'completed',
            processing_status: processingStatus
          });

        if (paymentInsertError) {
          throw new Error(`Failed to insert payment ledger record: ${paymentInsertError.message}`);
        }
        
      } else if (payload.type === 'payment.failed') {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing service role key');
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );

        const { listing_id, bid_id, type } = (payload.data.metadata || {}) as any;
        if (type === 'rebid' && bid_id) {
           await supabaseAdmin.from('bids').insert({
                id: bid_id,
                listing_id: listing_id,
                amount: Number(payload.data.metadata?.new_amount || 0),
                previous_amount: Number(payload.data.metadata?.previous_amount || 0),
                amount_paid: 0,
                status: 'failed'
           });
        }

        await supabaseAdmin.from('payments').insert({
            listing_id: listing_id || null,
            bid_id: bid_id || null,
            amount: payload.data.total_amount / 100,
            expected_amount: payload.data.total_amount / 100,
            currency: payload.data.currency ? payload.data.currency.toUpperCase() : 'UNKNOWN',
            provider: 'dodo',
            provider_payment_id: payload.data.payment_id,
            status: 'failed',
            processing_status: 'processed'
        });
      }
    },
  });

  return handler(req);
};
