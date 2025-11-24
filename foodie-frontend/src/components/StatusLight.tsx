'use client';

import { useEffect, useState } from 'react';
import { checkHealth } from '@/lib/api';

export default function StatusLight() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkStatus = async () => {
      const response = await checkHealth();
      setStatus(response.data ? 'online' : 'offline');
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const styles: Record<typeof status, { color: string; label: string }> = {
    checking: {
      color: 'bg-warning',
      label: 'Calibrating service…',
    },
    online: {
      color: 'bg-success',
      label: 'Kitchen running hot',
    },
    offline: {
      color: 'bg-danger',
      label: 'Service paused',
    },
  } as const;

  return (
    <div className="flex items-center gap-3 rounded-full bg-surface-highlight px-3 py-1.5 text-xs text-muted">
      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${styles[status].color} animate-pulse`} />
      <span className="font-medium tracking-wide">{styles[status].label}</span>
    </div>
  );
}
