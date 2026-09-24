'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getActivity, type ActivityItem } from '@/lib/api';
import { txExplorerUrl } from '@/lib/network';

interface ActivityViewProps {
  initialActivities: ActivityItem[];
}

export function ActivityView({ initialActivities }: ActivityViewProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const { publicKey } = useWallet();

  const fetchActivity = useCallback(async () => {
    try {
      const wallet = publicKey ? publicKey.toBase58() : 'demo';
      const data = await getActivity(wallet);
      setActivities(data.activities);
      setError(null);
      setIsLive(true);
    } catch {
      setError('API unavailable — showing recent activity');
      setIsLive(false);
    }
  }, [publicKey]);

  useEffect(() => {
    void fetchActivity();
    const interval = setInterval(fetchActivity, 5000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  return (
    <>
      {error && <p style={{ color: 'var(--ink-muted)', fontSize: '0.82rem', marginBottom: '20px' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-subtle)', fontFamily: 'SF Mono, monospace' }}>
          {isLive ? '● Live — polling every 5s' : '○ Offline mode'}
        </span>
      </div>

      <div className="data-card">
        <div className="timeline">
          {activities.map((item) => (
            <div key={item.id} className="timeline-item">
              <div className="time">{formatTime(item.timestamp)}</div>
              <div className="desc">
                {item.description}
                {item.txSignature && (
                  <div>
                    <a
                      href={txExplorerUrl(item.txSignature)}
                      target="_blank"
                      rel="noreferrer"
                      className="sig"
                    >
                      {item.txSignature.slice(0, 10)}...{item.txSignature.slice(-6)}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function formatTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' });
}
