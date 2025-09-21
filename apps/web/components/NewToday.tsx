'use client';
import { SiteRec } from '@/app/page';
import ShotCard from './ShotCard';
import { motion } from 'framer-motion';

export default function NewToday({ hero, overflow }: { hero: SiteRec[]; overflow: SiteRec[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">New today</h2>
        {overflow.length > 0 && (
          <a href="#more-today" className="text-sm text-neutral-500 hover:underline">More finds</a>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hero.map((rec, i) => (
          <motion.div key={rec.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <ShotCard rec={rec} />
          </motion.div>
        ))}
      </div>
      {overflow.length > 0 && (
        <div id="more-today" className="pt-2">
          <details className="group">
            <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700">Show others</summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {overflow.map((rec) => <ShotCard key={rec.slug} rec={rec} />)}
            </div>
          </details>
        </div>
      )}
    </section>
  );
}