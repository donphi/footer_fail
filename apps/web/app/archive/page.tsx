'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import FailCard from '@/components/FailCard';
import {
  IconArrowLeft,
  IconClock24,
  IconTrendingDown3,
  IconAlertTriangleFilled,
  IconHeartBroken,
  IconCalendarOff,
  IconBug
} from '@tabler/icons-react';
import { SiteRec } from '@/app/page';

export default function ArchivePage() {
  const [data, setData] = useState<SiteRec[]>([]);
  const [filter, setFilter] = useState<'all' | 'stale' | 'ok' | 'inconclusive'>('all');

  useEffect(() => {
    fetch('/api/sites').then(r => r.json()).then(setData);
  }, []);

  const filteredData = useMemo(() => {
    if (filter === 'all') return data;
    return data.filter(r => r.status === filter);
  }, [data, filter]);

  const stats = useMemo(() => {
    const stale = data.filter(r => r.status === 'stale').length;
    const ok = data.filter(r => r.status === 'ok').length;
    const inconclusive = data.filter(r => r.status === 'inconclusive').length;

    const totalYearsWasted = data.reduce((acc, r) => {
      if (r.detectedYears?.length) {
        const yearsOff = r.currentYear - Math.max(...r.detectedYears);
        return acc + yearsOff;
      }
      return acc;
    }, 0);

    return { stale, ok, inconclusive, totalYearsWasted };
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-black">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <header className="space-y-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-all"
          >
            <IconArrowLeft size={20} stroke={2} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Hall of Shame</span>
          </Link>

          <div>
            <h1 className="text-4xl sm:text-5xl font-thick tracking-tighter">
              The Complete Archive
            </h1>
            <p className="mt-3 text-neutral-600 dark:text-neutral-400 font-thin text-lg">
              Every temporal failure we've captured. Forever preserved. Never forgiven.
            </p>
          </div>
        </header>

        {/* Stats Bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="group bg-white/60 dark:bg-neutral-900/60 backdrop-blur rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-800/50 hover:scale-105 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <IconAlertTriangleFilled size={24} className="group-hover:animate-pulse" />
              <span className="font-thick text-2xl">{stats.stale}</span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Currently Failing</p>
          </div>

          <div className="group bg-white/60 dark:bg-neutral-900/60 backdrop-blur rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-800/50 hover:scale-105 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <IconHeartBroken size={24} className="group-hover:rotate-12 transition-transform" />
              <span className="font-thick text-2xl">{stats.ok}</span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Fixed (Finally)</p>
          </div>

          <div className="group bg-white/60 dark:bg-neutral-900/60 backdrop-blur rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-800/50 hover:scale-105 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <IconBug size={24} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="font-thick text-2xl">{stats.inconclusive}</span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Inconclusive</p>
          </div>

          <div className="group bg-white/60 dark:bg-neutral-900/60 backdrop-blur rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-800/50 hover:scale-105 hover:shadow-xl transition-all">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <IconCalendarOff size={24} className="group-hover:scale-110 transition-transform" />
              <span className="font-thick text-2xl">{stats.totalYearsWasted}</span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Total Years Wasted</p>
          </div>
        </section>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
          {(['all', 'stale', 'ok', 'inconclusive'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 font-medium uppercase tracking-wider transition-all ${
                filter === status
                  ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {status === 'all' ? `All (${data.length})` :
               status === 'stale' ? `Failing (${stats.stale})` :
               status === 'ok' ? `Fixed (${stats.ok})` :
               `Unknown (${stats.inconclusive})`}
            </button>
          ))}
        </div>

        {/* Grid of Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map(site => (
            <FailCard key={site.slug} rec={site} />
          ))}
        </section>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-20">
            <p className="text-neutral-500 dark:text-neutral-400">
              No sites found with status: {filter}
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-neutral-400 border-t border-neutral-200 dark:border-neutral-800">
          <p className="font-thin">
            Every failure documented. Every year counted. Every excuse ignored.
          </p>
        </footer>
      </main>
    </div>
  );
}