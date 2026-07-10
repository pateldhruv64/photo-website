'use client';

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function BackendPing() {
  useEffect(() => {
    const ping = async () => {
      try {
        await fetch(`${API_URL.replace('/api', '')}/health`, {
          method: 'GET',
          cache: 'no-store',
        });
      } catch {
        // Silent fail — this is just a keep-alive
      }
    };

    // Ping immediately on load
    ping();

    // Then every 9 minutes (Render sleeps at 15 min)
    const interval = setInterval(ping, 9 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
