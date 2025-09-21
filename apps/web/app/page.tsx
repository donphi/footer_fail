'use client';
import { useEffect, useMemo, useState } from 'react';
import FailCarousel from '@/components/FailCarousel';
import FailModal from '@/components/FailModal';
import Link from 'next/link';
import { IconArrowRight, IconDatabase, IconSparkles } from '@tabler/icons-react';

export type SiteRec = {
  url: string; slug: string; company?: string; industry?: string; country?: string;
  detectedYears: number[]; currentYear: number; status: 'ok'|'stale'|'inconclusive'|'future';
  firstIncorrectAt?: string; lastIncorrectAt?: string; lastCorrectAt?: string; correctedAt?: string;
  verifiedAt?: string; lastCheckedAt?: string; commentedAt?: string; verified_at?: string;
  proof?: { internetArchive?: string; archiveToday?: string };
  screenshot?: string;
  screenshotZoom?: string;
  posts?: Array<{ id: string; author: string; content: string; timestamp: string; }>;
};

export default function Page() {
  const [data, setData] = useState<SiteRec[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteRec | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { fetch('/api/sites').then(r => r.json()).then(setData); }, []);

  const handleCardClick = (site: SiteRec) => {
    setSelectedSite(site);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSite(null);
  };

  const today = useMemo(() => new Date(), []);
  const todayKey = today.toISOString().slice(0,10);

  // Fresh catches - sites found TODAY to be outdated
  const freshCatches = useMemo(() => {
    const found = data.filter(r =>
      r.status === 'stale' &&
      (r.verifiedAt || r.lastCheckedAt || '').startsWith(todayKey)
    );
    // Sort by brand weight/importance
    found.sort((a,b) => {
      const aw = (a.company?2:0) + (a.url.includes('.com')?1:0);
      const bw = (b.company?2:0) + (b.url.includes('.com')?1:0);
      return bw - aw;
    });
    return found;
  }, [data, todayKey]);

  // Hall of shame - persistently outdated sites
  const hallOfShame = useMemo(() => {
    const stale = data.filter(r =>
      r.status === 'stale' &&
      (!r.verifiedAt || !r.verifiedAt.startsWith(todayKey))
    );
    // Sort by years behind (most outdated first)
    stale.sort((a, b) => {
      const aYears = a.detectedYears?.length ? a.currentYear - Math.max(...a.detectedYears) : 0;
      const bYears = b.detectedYears?.length ? b.currentYear - Math.max(...b.detectedYears) : 0;
      return bYears - aYears;
    });
    return stale;
  }, [data, todayKey]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-black overflow-hidden">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16 overflow-visible">
        {/* Header */}
        <header className="space-y-4 text-center">
          <h1 className="text-5xl sm:text-6xl font-thick tracking-tighter bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
            Lazy Fers
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 font-thin text-lg max-w-2xl mx-auto">
            A daily hall of shame for companies whose footers are trapped in time.
            Immutable proof attached. No mercy given.
          </p>
        </header>

        {/* Today's Fresh Catches - Top Carousel */}
        {freshCatches.length > 0 && (
          <section className="space-y-1">
            <FailCarousel
              slides={freshCatches}
              title="FRESH CATCHES"
              autoplayDelay={3000}
              onCardClick={handleCardClick}
            />
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-thin -mt-2">
              Found today. Shamed forever.
            </p>
          </section>
        )}

        {/* Hall of Shame - Bottom Carousel */}
        {hallOfShame.length > 0 && (
          <section className="space-y-1">
            <FailCarousel
              slides={hallOfShame}
              title="HALL OF SHAME"
              autoplayDelay={4000}
              onCardClick={handleCardClick}
            />
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-thin -mt-2">
              Persistent failures. Years of negligence.
            </p>
          </section>
        )}

        {/* Archive Link */}
        <section className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <Link
            href="/archive"
            className="group inline-flex items-center gap-3 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:scale-105 hover:shadow-2xl transition-all"
          >
            <IconDatabase size={20} stroke={2} />
            <span className="font-thick uppercase tracking-wider">View Full Archive</span>
            <IconArrowRight size={20} stroke={2} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            Browse the complete collection of temporal failures, sorted by incompetence.
          </p>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-neutral-400 border-t border-neutral-200 dark:border-neutral-800">
          <p className="font-thin">
            Built with Next.js 15, Tailwind, and the bitter tears of temporal precision.
          </p>
          <p className="mt-2 font-thick uppercase tracking-wider">
            © {new Date().getFullYear()} - Yes, we update our footer
          </p>
        </footer>
      </main>

      {/* Modal */}
      <FailModal
        site={selectedSite}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}