import { Linking } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { AffiliateProvider } from '@/lib/affiliate/providers';
import type { Booking, BookingType } from '@/types';

export function useBookings() {
  const { user } = useAuthStore();

  const fetchBookings = async (planId?: string): Promise<Booking[]> => {
    if (!user) return [];
    let query = (supabase as any).from('bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (planId) query = query.eq('plan_id', planId);
    const { data } = await query;
    return (data ?? []) as Booking[];
  };

  const addBooking = async (params: {
    plan_id?: string;
    provider: string;
    type: BookingType;
    title: string;
    amount_jpy?: number;
    booked_at?: string;
    notes?: string;
  }): Promise<Booking | null> => {
    if (!user) return null;
    const { data, error } = await (supabase as any)
      .from('bookings')
      .insert({ user_id: user.id, ...params })
      .select()
      .single();
    if (error) return null;
    return data as Booking;
  };

  const updateBookingStatus = async (bookingId: string, status: Booking['status']): Promise<void> => {
    await (supabase as any).from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', bookingId);
  };

  const deleteBooking = async (bookingId: string): Promise<void> => {
    await (supabase as any).from('bookings').delete().eq('id', bookingId);
  };

  const openAffiliate = async (provider: AffiliateProvider, planId?: string): Promise<void> => {
    if (user) {
      await (supabase as any).from('affiliate_clicks').insert({
        user_id: user.id,
        plan_id: planId ?? null,
        provider: provider.id,
      });
    }
    await Linking.openURL(provider.url);
  };

  return { fetchBookings, addBooking, updateBookingStatus, deleteBooking, openAffiliate };
}
