import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Listing, ListingCategory } from '@/types';

export function useListings() {
  const { user } = useAuthStore();

  const fetchListings = useCallback(async (category?: ListingCategory, country?: string): Promise<Listing[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('listings') as any)
      .select('*, user:users(id, nickname, avatar_url, phase)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (category) query = query.eq('category', category);
    if (country) query = query.eq('country', country);

    const { data } = await query;
    if (!data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((l: any) => ({ ...l, user: l.user ?? undefined }));
  }, []);

  const fetchMyListings = useCallback(async (): Promise<Listing[]> => {
    if (!user) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('listings') as any)
      .select('*, user:users(id, nickname, avatar_url, phase)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((l: any) => ({ ...l, user: l.user ?? undefined }));
  }, [user]);

  const createListing = useCallback(async (params: {
    category: ListingCategory;
    title: string;
    description: string;
    city?: string;
    country?: string;
    priceAmount?: number;
    priceCurrency?: string;
    priceFrequency?: string;
  }): Promise<Listing | null> => {
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('listings') as any)
      .insert({
        user_id: user.id,
        category: params.category,
        title: params.title.trim(),
        description: params.description.trim(),
        city: params.city?.trim() || null,
        country: params.country?.trim() || null,
        price_amount: params.priceAmount ?? null,
        price_currency: params.priceCurrency ?? 'JPY',
        price_frequency: params.priceFrequency ?? null,
      })
      .select('*, user:users(id, nickname, avatar_url, phase)')
      .single();
    if (!data) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...(data as any), user: (data as any).user ?? undefined };
  }, [user]);

  const closeListing = useCallback(async (listingId: string) => {
    await supabase.from('listings').update({ status: 'closed' }).eq('id', listingId);
  }, []);

  const sendInquiry = useCallback(async (listingId: string, message: string): Promise<boolean> => {
    if (!user) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('listing_inquiries') as any).insert({
      listing_id: listingId,
      inquirer_id: user.id,
      message: message.trim(),
    });
    return !error;
  }, [user]);

  const checkInquired = useCallback(async (listingId: string): Promise<boolean> => {
    if (!user) return false;
    const { data } = await supabase
      .from('listing_inquiries')
      .select('id')
      .eq('listing_id', listingId)
      .eq('inquirer_id', user.id)
      .maybeSingle();
    return !!data;
  }, [user]);

  return { fetchListings, fetchMyListings, createListing, closeListing, sendInquiry, checkInquired };
}
