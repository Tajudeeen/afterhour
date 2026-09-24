import Link from 'next/link';
import { getActivity, type ActivityItem } from '@/lib/api';
import { ActivityView } from '@/components/ActivityView';

export const metadata = {
  title: 'Activity — AfterHours',
  description: 'Real-time on-chain activity and risk policy audit trail.',
};

const DEMO_WALLET = 'demo';

export default async function ActivityPage() {
  let initialActivities: ActivityItem[] = [];
  try {
    const data = await getActivity(DEMO_WALLET);
    initialActivities = data.activities;
  } catch {
    // Fallback is handled in the client component
  }

  return (
    <div className="page-shell">
      <Link href="/" className="back-link">
        <span aria-hidden="true">←</span> Back to dashboard
      </Link>

      <section style={{ marginTop: 24 }}>
        <div>
          <p className="eyebrow eyebrow-accent">
            <span className="eyebrow-accent">Audit trail</span>
          </p>
          <h1 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '2.4rem', color: 'var(--ink-heading)' }}>
            Activity
          </h1>
        </div>

        <ActivityView initialActivities={initialActivities} />
      </section>
    </div>
  );
}
