'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { BookingStatus } from '@/types/marketplace';

export interface AdminBookingRow {
  id: string;
  client_id: string | null;
  menu_id: string | null;
  date_time: string;
  guests_count: number;
  total_price: number;
  status: string;
  address: string;
  created_at: string;
  menu?: { name: string; experience?: { name: string } } | null;
}

export function useAdminBookings() {
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from('bookings')
      .select(`
        id,
        client_id,
        menu_id,
        date_time,
        guests_count,
        total_price,
        status,
        address,
        created_at,
        menu:menus (
          name,
          experience:experiences (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (e) {
      setError(e.message ?? 'Failed to fetch bookings');
      setBookings([]);
    } else {
      setBookings((data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        client_id: r.client_id != null ? String(r.client_id) : null,
        menu_id: r.menu_id != null ? String(r.menu_id) : null,
        date_time: String(r.date_time),
        guests_count: Number(r.guests_count),
        total_price: Number(r.total_price),
        status: String(r.status),
        address: String(r.address),
        created_at: String(r.created_at),
        menu: r.menu as AdminBookingRow['menu'],
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateBookingStatus = useCallback(async (id: string, status: BookingStatus): Promise<boolean> => {
    setError(null);
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to update status');
      return false;
    }
    await fetchBookings();
    return true;
  }, [fetchBookings]);

  return { bookings, loading, error, fetchBookings, updateBookingStatus };
}
