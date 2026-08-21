import { NextResponse } from 'next/server';
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

  const { error: err0 } = await supabase.from('impressions').delete().not('id', 'is', null);
  const { error: err1 } = await supabase.from('payments').delete().not('id', 'is', null);
  const { error: err2 } = await supabase.from('bids').delete().not('id', 'is', null);
  const { error: err3 } = await supabase.from('listings').delete().not('id', 'is', null);

  if (err0 || err1 || err2 || err3) {
    return NextResponse.json({ success: false, errors: { err0, err1, err2, err3 } });
  }

  return NextResponse.json({ success: true, message: "All fake data wiped successfully! Your database is now a clean sheet." });
};
