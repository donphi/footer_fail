'use client';
import { useMemo, useState } from 'react';
import { SiteRec } from '@/app/page';

export default function SectorTabs({ items, active, onChange }: { items: SiteRec[]; active: string; onChange: (sector: string) => void }) {
  const sectors = useMemo(() => {
    const s = new Set<string>();
    items.forEach(i => { if (i.industry) s.add(i.industry); });
    return ['All', ...Array.from(s).sort()];
  }, [items]);

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {sectors.map(sec => (
        <button key={sec} onClick={() => onChange(sec)} className={`shrink-0 rounded-full border px-3 py-1 text-sm ${active===sec? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border-neutral-300 dark:border-neutral-700'}`}>{sec}</button>
      ))}
    </div>
  );
}