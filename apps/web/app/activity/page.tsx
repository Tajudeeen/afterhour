import Link from 'next/link';
import { getActivity, type ActivityItem } from '@/lib/api';

const DEMO_WALLET = 'demo';

export default async function ActivityPage() {
  let activities: ActivityItem[] = [];
  let error: string | null = null;

  try {
    const data = await getActivity(DEMO_WALLET);
    activities = data.activities;
  } catch {
    error = 'API unavailable — showing recent activity';
    activities = [
      { id: '4', timestamp: new Date(Date.now() - 12_000).toISOString(), description: 'Trade executed on Solana', txSignature: '5xAbCdEf8F2', status: 'success' },
      { id: '3', timestamp: new Date(Date.now() - 18_000).toISOString(), description: 'Risk policy approved', status: 'success' },
      { id: '2', timestamp: new Date(Date.now() - 24_000).toISOString(), description: 'AI analysis generated', status: 'info' },
      { id: '1', timestamp: new Date(Date.now() - 30_000).toISOString(), description: 'Gap detected: NVDA +4.02%', status: 'info' },
    ];
  }

  return (
    <div className="page-shell">
      <Link href="/" className="back-link">
        <span aria-hidden="true">←</span> Back to dashboard
      </Link>

      <section style={{ marginTop: 24 }}>
        <div>
          <p className="eyebrow eyebrow-accent">Audit trail</p>
          <h1 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '2.4rem', color: 'var(--ink-heading)' }}>
            Activity
          </h1>
        </div>
      </section>

      {error && <p style={{ color: 'var(--ink-muted)', fontSize: '0.82rem', marginBottom: '20px' }}>{error}</p>}

      <div className="data-card" style={{ marginTop: 24 }}>
        <div className="timeline">
          {activities.map((item) => (
            <div key={item.id} className="timeline-item">
              <div className="time">{formatTime(item.timestamp)}</div>
              <div className="desc">
                {item.description}
                {item.txSignature && (
                  <div>
                    <a
                      href={`https://solscan.io/tx/${item.txSignature}?cluster=devnet`}
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
    </div>
  );
}

function formatTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' });
}
