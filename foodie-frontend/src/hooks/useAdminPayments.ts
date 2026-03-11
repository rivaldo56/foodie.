'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface EscrowTransaction {
  id: string;
  booking_id: string;
  total_amount: number;
  deposit_amount: number;
  remaining_amount: number;
  platform_fee: number;
  escrow_status: string;
  deposit_paid_at: string | null;
  remainder_paid_at: string | null;
  created_at: string;
}

export interface ChefPayout {
  id: string;
  booking_id: string;
  chef_id: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  payout_method: string;
  status: string;
  initiated_at: string;
  completed_at: string | null;
}

export function useAdminPayments() {
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [payouts, setPayouts] = useState<ChefPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [escrowRes, payoutRes] = await Promise.all([
        supabase.from('escrow_transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('chef_payouts').select('*').order('initiated_at', { ascending: false })
      ]);

      if (escrowRes.error) throw escrowRes.error;
      if (payoutRes.error) throw payoutRes.error;

      setEscrowTransactions(escrowRes.data || []);
      setPayouts(payoutRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { escrowTransactions, payouts, loading, error, fetchPayments };
}
