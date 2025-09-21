'use client';
import { SiteRec } from '@/app/page';
import ShotCard from './ShotCard';

export default function Archive({ items }: { items: SiteRec[] }) {
  if (!items.length) return null;
  return (
    <section className="space-y-4 pt-6">
      <h2 className="text-2xl font-semibold">Archive</h2>
      <p className="text-sm text-neutral-500">Everything we’ve captured: once outdated (and often fixed soon after). Hidden below the fold to keep focus on today.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(rec => <ShotCard key={rec.slug} rec={rec} />)}
      </div>
    </section>
  );
}