import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

export const GET = async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Delete all payments, bids, and listings. 
  // Because of foreign key constraints, we delete in order.
  // Actually, Supabase REST API deletes can be done by passing a filter that matches everything.
  // e.g. .neq('id', '00000000-0000-0000-0000-000000000000') or .not('id', 'is', null)

  const { error: e1 } = await supabase.from('clicks').delete().not('id', 'is', null);
  const { error: e2 } = await supabase.from('impressions').delete().not('id', 'is', null);
  const { error: e3 } = await supabase.from('payments').delete().not('id', 'is', null);
  const { error: e4 } = await supabase.from('listing_access').delete().not('id', 'is', null);
  const { error: e5 } = await supabase.from('bids').delete().not('id', 'is', null);
  const { error: e6 } = await supabase.from('listings').delete().not('id', 'is', null);

  if (e1 || e2 || e3 || e4 || e5 || e6) {
    return NextResponse.json({ success: false, errors: { e1, e2, e3, e4, e5, e6 } });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true, message: "All fake data wiped successfully! Your database is now a clean sheet." });
};
