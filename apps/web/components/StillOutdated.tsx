'use client';
import { useMemo, useState, useEffect } from 'react';
import { SiteRec } from '@/app/page';
import ShotCard from './ShotCard';
import SectorTabs from './SectorTabs';

export default function StillOutdated({ items }: { items: SiteRec[] }) {
  const [page, setPage] = useState(0);
  const [sector, setSector] = useState<string>('All');

  // sector filter exposed via SectorTabs (we lift simple setter via props or use context)
  const perPage = 6;
  const filtered = useMemo(() => items.filter(i => sector==='All' || i.industry===sector), [items, sector]);
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const slice = filtered.slice(page*perPage, page*perPage+perPage);

  // Reset pagination when sector changes
  useEffect(() => {
    setPage(0);
  }, [sector]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Still outdated… ticking</h2>
        <div className="text-sm text-neutral-500">{filtered.length} sites</div>
      </div>

      <SectorTabs items={items} active={sector} onChange={setSector} />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {slice.map(rec => <ShotCard key={rec.slug} rec={rec} />)}
      </div>

      {/* Horizontal pager for mobile */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={()=> setPage(p => Math.max(0, p-1))} className="rounded-full border px-3 py-1 text-sm" disabled={page === 0}>Prev</button>
        <div className="text-xs text-neutral-500">Page {page+1} / {pages}</div>
        <button onClick={()=> setPage(p => Math.min(pages-1, p+1))} className="rounded-full border px-3 py-1 text-sm" disabled={page >= pages - 1}>Next</button>
      </div>
    </section>
  );
}