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
          return;
        }

        // Verify currency is USD to prevent currency exploitation
        if (payload.data.currency && payload.data.currency.toUpperCase() !== 'USD') {
          console.error(`Invalid currency: ${payload.data.currency}`);
          return;
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing service role key');
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );

        // Verify the bid
        const { data: bid } = await supabaseAdmin
          .from('bids')
          .select('id, amount, previous_amount, amount_paid, status')
          .eq('id', bid_id)
          .eq('status', 'pending')
          .maybeSingle();

        if (!bid) {
          console.error(`Bid ${bid_id} not found or already paid`);
          return; // idempotency
        }

        // VERIFY AMOUNT (total_amount is in cents, amount_paid is in dollars)
        const amountPaidDollars = payload.data.total_amount / 100;
        if (amountPaidDollars !== bid.amount_paid) {
          console.error(`Amount mismatch: expected $${bid.amount_paid}, got $${amountPaidDollars}`);
          return;
        }

        if (type === 'initial_bid') {
          // Activate the listing and update current_bid
          const { error: listingError } = await supabaseAdmin
            .from('listings')
            .update({ 
              status: 'active',
              current_bid: bid.amount,
              bid_placed_at: new Date().toISOString()
            })
            .eq('id', listing_id)
            .eq('status', 'pending');

          if (listingError) {
            console.error('Failed to activate listing:', listingError);
            return;
          }
        } else if (type === 'rebid') {
          // Update the listing and apply OCC (Optimistic Concurrency Control)
          const { error: listingError, data: updatedListing } = await supabaseAdmin
            .from('listings')
            .update({ 
              current_bid: bid.amount,
              bid_placed_at: new Date().toISOString()
            })
            .eq('id', listing_id)
            .eq('status', 'active')
            .eq('current_bid', bid.previous_amount) // Only update if no one else has outbid them in the meantime
            .select('id')
            .maybeSingle();

          if (listingError || !updatedListing) {
            console.error(`OCC conflict for rebid ${bid_id}. The listing was modified before payment completed.`);
            // Mark bid as failed_occ to handle manually/refund later
            await supabaseAdmin.from('bids').update({ status: 'failed' }).eq('id', bid_id);
            
            // Still log the payment receipt because they did pay!
            await supabaseAdmin
              .from('payments')
              .insert({
                listing_id,
                bid_id: bid.id,
                amount: amountPaidDollars,
                provider: 'dodopayments',
                provider_id: payload.data.payment_id,
                status: 'completed'
              });
            return; // Stop execution
          }
        }

        // Update bid status to paid
        await supabaseAdmin
          .from('bids')
          .update({ status: 'paid' })
          .eq('id', bid_id);
          
        // Store the payment intent in canonical dollars! Include bid_id!
        await supabaseAdmin
          .from('payments')
          .insert({
            listing_id,
            bid_id: bid.id,
            amount: amountPaidDollars,
            provider: 'dodopayments',
            provider_id: payload.data.payment_id,
            status: 'completed'
          });

        console.log(`Successfully processed payment for listing ${listing_id}`);
      }
    },
  });
  
  return handler(req);
};
