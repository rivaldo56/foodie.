'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/types/marketplace';

export interface BookingWithDetails extends Booking {
  menu: {
    name: string;
    image_url: string | null;
  } | null;
  experience: {
    name: string;
  } | null;
}

function mapBookingRow(r: any): BookingWithDetails {
  return {
    id: String(r.id),
    client_id: String(r.client_id),
    menu_id: r.menu_id != null ? String(r.menu_id) : null,
    experience_id: r.experience_id != null ? String(r.experience_id) : null,
    chef_id: r.chef_id != null ? String(r.chef_id) : null,
    date_time: String(r.date_time),
    address: String(r.address),
    guests_count: Number(r.guests_count),
    status: (r.status as Booking['status']) ?? 'pending',
    total_price: Number(r.total_price),
    special_requests: r.special_requests != null ? String(r.special_requests) : null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
    menu: r.menu ? {
      name: String(r.menu.name),
      image_url: r.menu.image_url
    } : null,
    experience: r.experience ? {
      name: String(r.experience.name)
    } : null
  };
}

export function useClientBookings() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const { data, error: e } = await supabase
      .from('bookings')
      .select(`
        *,
        menu:menus (
          name,
          image_url
        ),
        experience:experiences (
          name
        )
      `)
      .eq('client_id', user.id)
      .order('date_time', { ascending: false });

    if (e) {
      setError(e.message ?? 'Failed to fetch bookings');
      setBookings([]);
    } else {
      setBookings((data ?? []).map(mapBookingRow));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const cancelBooking = async (id: string) => {
    const { error: e } = await supabase
      .from('bookings')
      .update({ status: 'canceled' })
      .eq('id', id);

    if (e) return false;
    await fetchBookings();
    return true;
  };

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    cancelBooking
  };
}
