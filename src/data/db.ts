import { supabase } from '@/lib/supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string; // We'll map category_id to name
  currentBid: number;
  bidTimestamp: string;
  logoUrl: string;
  createdAt: string;
  websiteUrl: string;
}

// Convert db row to Product
function mapRowToProduct(row: Record<string, unknown> | { [key: string]: unknown }): Product {
  const r = row as {
    id: string;
    slug: string;
    name: string;
    description: string;
    categories?: { name: string };
    current_bid: number;
    bid_placed_at: string;
    logo_url: string;
    created_at: string;
    url: string;
  };
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    category: r.categories?.name || 'Other',
    currentBid: r.current_bid,
    bidTimestamp: r.bid_placed_at,
    logoUrl: r.logo_url,
    createdAt: r.created_at,
    websiteUrl: r.url,
  };
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name');
    
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

export async function getLeaderboard(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*, categories(name)')
    .eq('status', 'active')
    .order('current_bid', { ascending: false })
    .order('bid_placed_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
  
  return (data || []).map(mapRowToProduct);
}

export async function getTrending(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*, categories(name)')
    .eq('status', 'active')
    .order('bid_placed_at', { ascending: false })
    .limit(50);
    
  if (error) {
    console.error('Error fetching trending:', error);
    return [];
  }
  
  return (data || []).map(mapRowToProduct);
}

export async function getNewest(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*, categories(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching newest:', error);
    return [];
  }
  
  return (data || []).map(mapRowToProduct);
}

export async function getByCategory(categorySlug: string): Promise<Product[]> {
  const { data: categoryData } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (!categoryData) return [];

  const { data, error } = await supabase
    .from('listings')
    .select('*, categories(name)')
    .eq('status', 'active')
    .eq('category_id', categoryData.id)
    .order('current_bid', { ascending: false })
    .order('bid_placed_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching by category:', error);
    return [];
  }
  
  return (data || []).map(mapRowToProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*, categories(name)')
    .eq('slug', slug)
    .single();
    
  if (error || !data) {
    return null;
  }
  
  return mapRowToProduct(data);
}
