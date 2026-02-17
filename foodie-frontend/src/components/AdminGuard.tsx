'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import type { ReactNode } from 'react';

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'allowed' | 'forbidden'>('loading');
  
  // Memoize client to prevent recreation on every render
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      try {
        console.log('[AdminGuard] Checking session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error || !session) {
            console.log('[AdminGuard] No valid session', { error });
            setStatus('forbidden');
            return;
        }

        const user = session.user;
        const role = user.app_metadata?.role;
        
        console.log('[AdminGuard] User found:', { 
            userId: user.id, 
            role,
        });

        if (role === 'admin') {
           setStatus('allowed');
        } else {
           console.warn('[AdminGuard] Access denied', { role });
           setStatus('forbidden');
        }
      } catch (err) {
        console.error('[AdminGuard] Unexpected error:', err);
        if (mounted) setStatus('forbidden');
      }
    }

    checkUser();
    
    // Auth listener removed temporarily to isolate recursion issue. 
    // The session check on mount is sufficient for immediate protection.

    return () => {
      mounted = false;
    };
  }, [supabase]); // Safe dependency as supabase is memoized

  // Separate effect for redirection to avoid blocking the main logic
  useEffect(() => {
    if (status === 'forbidden') {
        const timer = setTimeout(() => {
             router.replace('/');
        }, 100); // Small delay to ensure render completes and avoids sync loops
        return () => clearTimeout(timer);
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0f1012]">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#ff7642]" />
            <p className="text-sm text-[#9ca3af] animate-pulse">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (status === 'forbidden') {
    // Render a "Unauthorized" screen instead of null to keep React tree stable during redirect
    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0f1012]">
            <div className="flex flex-col items-center gap-4">
                <p className="text-[#ff7642] font-semibold">Access Denied</p>
                <p className="text-sm text-[#9ca3af]">Redirecting you...</p>
            </div>
        </div>
    );
  }

  return <>{children}</>;
}
