import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getCategories } from '@/data/db'; // Ensure we can get categories

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gotop.lol';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: listings } = await supabase
    .from('listings')
    .select('slug, updated_at')
    .eq('status', 'active');

  const categories = await getCategories();

  const routes = [
    '',
    '/leaderboard',
    '/trending',
    '/new',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 1,
  }));

  const categoryRoutes = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.name.toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const productRoutes = (listings || []).map((listing) => ({
    url: `${baseUrl}/product/${listing.slug}`,
    lastModified: new Date(listing.updated_at || Date.now()),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [...routes, ...categoryRoutes, ...productRoutes];
}
