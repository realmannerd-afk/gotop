import { NextRequest } from "next/server";
import { Webhooks } from "@dodopayments/nextjs";
import { createClient } from "@supabase/supabase-js";

export const POST = async (req: NextRequest) => {
  const handler = Webhooks({
    webhookKey: process.env.DODO_WEBHOOK_KEY || 'dummy_secret_for_build_time',
    onPayload: async (payload) => {
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
        
        const { listing_id, bid_id, type } = payload.data.metadata as any || {};

        // 1. Idempotency Check: Have we already completed this exact payment?
        const { data: existingPayment, error: existingError } = await supabaseAdmin
          .from('payments')
          .select('id, processing_status')
          .eq('provider_id', paymentId)
          .maybeSingle();

        if (existingError) throw new Error('Database error checking idempotency');
        if (existingPayment) {
          console.log(`Payment ${paymentId} already processed (status: ${existingPayment.processing_status}). Idempotent success.`);
          return; // Return 200, already done
        }

        // ==========================================
        // VALIDATION PHASE
        // ==========================================
        let isValid = true;
        let processingStatus = 'processed';

        // Validate Metadata UUIDs to prevent postgres crashes
        let cleanListingId = null;
        let cleanBidId = null;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (listing_id && uuidRegex.test(listing_id)) cleanListingId = listing_id;
        if (bid_id && uuidRegex.test(bid_id)) cleanBidId = bid_id;

        if (!cleanListingId || !cleanBidId || !type) {
          console.error(`Payment ${paymentId} missing or invalid metadata.`);
          isValid = false;
          processingStatus = 'reconciliation_required';
        }

        // Validate Currency
        if (actualCurrency !== 'USD') {
          console.error(`Payment ${paymentId} invalid currency: ${actualCurrency}.`);
          isValid = false;
          processingStatus = 'reconciliation_required';
        }

        // Fetch Bid for Amount Validation and State Transitions
        let bid = null;
        if (cleanBidId) {
          const { data: fetchedBid, error: bidFetchError } = await supabaseAdmin
            .from('bids')
            .select('id, amount, previous_amount, amount_paid, status')
            .eq('id', cleanBidId)
            .maybeSingle();

          if (bidFetchError) throw new Error('Database error fetching bid');
          if (fetchedBid) {
            bid = fetchedBid;
            
            // Validate Amount
            if (actualAmountDollars !== bid.amount_paid) {
              console.error(`Payment ${paymentId} amount mismatch: expected $${bid.amount_paid}, got $${actualAmountDollars}`);
              isValid = false;
              processingStatus = 'reconciliation_required';
            }
          } else {
             console.error(`Payment ${paymentId} references unknown bid_id: ${cleanBidId}`);
             isValid = false;
             processingStatus = 'reconciliation_required';
          }
        }

        // ==========================================
        // BUSINESS TRANSACTION PHASE
        // ==========================================
        
        // Only apply business transaction if VALID and bid is currently PENDING
        if (isValid && bid && bid.status === 'pending') {
          if (type === 'initial_bid') {
            const { error: listingError } = await supabaseAdmin
              .from('listings')
              .update({ 
                status: 'active',
                current_bid: bid.amount,
                bid_placed_at: new Date().toISOString()
              })
              .eq('id', cleanListingId)
              .eq('status', 'pending');

            if (listingError) throw new Error('Database error activating listing');
            
          } else if (type === 'rebid') {
            const { error: listingError, data: updatedListing } = await supabaseAdmin
              .from('listings')
              .update({ 
                current_bid: bid.amount,
                bid_placed_at: new Date().toISOString()
              })
              .eq('id', cleanListingId)
              .eq('status', 'active')
              .eq('current_bid', bid.previous_amount) // OCC
              .select('id')
              .maybeSingle();

            if (listingError) throw new Error('Database error applying OCC to listing');
            
            if (!updatedListing) {
              console.log(`OCC conflict for rebid ${cleanBidId}. Listing modified before payment completed.`);
              
              const { error: bidFailError } = await supabaseAdmin
                .from('bids')
                .update({ status: 'failed' })
                .eq('id', cleanBidId);
              if (bidFailError) throw new Error('Database error marking bid as failed due to OCC');
              
              processingStatus = 'reconciliation_required';
              isValid = false; // Prevents updating bid to 'paid'
            }
          }

          if (isValid) {
            // Mark bid as paid
            const { error: bidUpdateError } = await supabaseAdmin
              .from('bids')
              .update({ status: 'paid' })
              .eq('id', cleanBidId);
              
            if (bidUpdateError) throw new Error('Database error updating bid status');
          }
        }

        // ==========================================
        // FINANCIAL LEDGER COMMIT PHASE
        // ==========================================
        
        // Finalize by storing the successful payment intent no matter what!
        const { error: paymentInsertError } = await supabaseAdmin
          .from('payments')
          .insert({
            listing_id: cleanListingId, // Automatically null if invalid
            bid_id: cleanBidId, // Automatically null if invalid
            amount: actualAmountDollars,
            expected_amount: bid ? bid.amount_paid : null,
            currency: actualCurrency,
            provider: 'dodopayments',
            provider_payment_id: paymentId,
            status: 'completed', // The money was captured!
            processing_status: processingStatus
          });

        if (paymentInsertError) throw new Error(`Database error inserting payment ledger record: ${paymentInsertError.message}`);

        console.log(`Successfully logged payment ${paymentId} with status ${processingStatus}`);
      }
    },
  });
  
  return handler(req);
};
