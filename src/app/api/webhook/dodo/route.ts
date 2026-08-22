import { NextRequest } from "next/server";
import { Webhooks } from "@dodopayments/nextjs";
import { createClient } from "@supabase/supabase-js";

export const POST = async (req: NextRequest) => {
  const handler = Webhooks({
    webhookKey: process.env.DODO_WEBHOOK_KEY || 'dummy_secret_for_build_time',
    onPayload: async (payload) => {
      console.log(`Received Dodo Webhook: ${payload.type}`);

      if (payload.type === 'payment.succeeded') {
        const { listing_id, bid_id, type } = payload.data.metadata as any;
        
        if (!listing_id || !bid_id) {
          console.error('Missing metadata in payment payload');
          return; // Invalid payload, do not retry
        }

        if (payload.data.currency && payload.data.currency.toUpperCase() !== 'USD') {
          console.error(`Invalid currency: ${payload.data.currency}`);
          return; // Invalid payload, do not retry
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing service role key');
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );

        // 1. Idempotency Check: Have we already completed this exact payment?
        const { data: existingPayment, error: existingError } = await supabaseAdmin
          .from('payments')
          .select('id')
          .eq('provider_id', payload.data.payment_id)
          .maybeSingle();

        if (existingError) throw new Error('Database error checking idempotency');
        if (existingPayment) {
          console.log('Payment already processed. Idempotent success.');
          return; // Return 200, already done
        }

        // 2. Fetch Bid
        const { data: bid, error: bidFetchError } = await supabaseAdmin
          .from('bids')
          .select('id, amount, previous_amount, amount_paid, status')
          .eq('id', bid_id)
          .maybeSingle();

        if (bidFetchError) throw new Error('Database error fetching bid');
        if (!bid) {
          console.error(`Bid ${bid_id} not found`);
          return; // Invalid data
        }

        // 3. Verify Amount
        const amountPaidDollars = payload.data.total_amount / 100;
        if (amountPaidDollars !== bid.amount_paid) {
          console.error(`Amount mismatch: expected $${bid.amount_paid}, got $${amountPaidDollars}`);
          return; // Invalid data
        }

        // 4. State Transitions (if bid is still pending)
        // Note: If a previous webhook crashed right after updating the bid, bid.status might already be 'paid'.
        // That's fine, we skip step 4 and just insert the payment record in step 5.
        if (bid.status === 'pending') {
          if (type === 'initial_bid') {
            const { error: listingError } = await supabaseAdmin
              .from('listings')
              .update({ 
                status: 'active',
                current_bid: bid.amount,
                bid_placed_at: new Date().toISOString()
              })
              .eq('id', listing_id);

            if (listingError) throw new Error('Database error activating listing');
            
          } else if (type === 'rebid') {
            const { error: listingError, data: updatedListing } = await supabaseAdmin
              .from('listings')
              .update({ 
                current_bid: bid.amount,
                bid_placed_at: new Date().toISOString()
              })
              .eq('id', listing_id)
              .eq('status', 'active')
              .eq('current_bid', bid.previous_amount) // OCC
              .select('id')
              .maybeSingle();

            if (listingError) throw new Error('Database error applying OCC to listing');
            
            if (!updatedListing) {
              console.log(`OCC conflict for rebid ${bid_id}. Listing modified before payment completed.`);
              
              const { error: bidFailError } = await supabaseAdmin
                .from('bids')
                .update({ status: 'failed' })
                .eq('id', bid_id);
              if (bidFailError) throw new Error('Database error marking bid as failed due to OCC');
              
              const { error: paymentInsertError } = await supabaseAdmin
                .from('payments')
                .insert({
                  listing_id,
                  bid_id: bid.id,
                  amount: amountPaidDollars,
                  provider: 'dodopayments',
                  provider_id: payload.data.payment_id,
                  status: 'completed'
                });
              if (paymentInsertError) throw new Error('Database error inserting OCC failed payment');
              
              return; // We successfully processed the OCC failure, so we stop here and return 200.
            }
          }

          // Mark bid as paid
          const { error: bidUpdateError } = await supabaseAdmin
            .from('bids')
            .update({ status: 'paid' })
            .eq('id', bid_id);
            
          if (bidUpdateError) throw new Error('Database error updating bid status');
        }

        // 5. Finalize by storing the successful payment intent
        const { error: paymentInsertError } = await supabaseAdmin
          .from('payments')
          .insert({
            listing_id,
            bid_id: bid.id,
            amount: amountPaidDollars,
            provider: 'dodopayments',
            provider_id: payload.data.payment_id,
            status: 'completed'
          });

        if (paymentInsertError) throw new Error('Database error inserting payment record');

        console.log(`Successfully processed payment for listing ${listing_id}`);
      }
    },
  });
  
  return handler(req);
};
