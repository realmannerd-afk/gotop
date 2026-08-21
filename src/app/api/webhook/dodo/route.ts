import { Webhooks } from "@dodopayments/nextjs";
import { createClient } from "@supabase/supabase-js";

export const POST = async (req: Request) => {
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

      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing service role key');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      );

      // Verify the bid
      const { data: bid } = await supabaseAdmin
        .from('bids')
        .select('id, amount, status')
        .eq('id', bid_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (!bid) {
        console.error(`Bid ${bid_id} not found or already paid`);
        return;
      }

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

      // Update bid status
      await supabaseAdmin
        .from('bids')
        .update({ status: 'paid' })
        .eq('id', bid_id);
        
      // Store the payment intent
      await supabaseAdmin
        .from('payments')
        .insert({
          listing_id,
          amount: payload.data.total_amount,
          provider: 'dodopayments',
          provider_id: payload.data.payment_id,
          status: 'completed'
        
  });
  return handler(req);
};

      console.log(`Successfully activated listing ${listing_id}`);
    }
  },
});
