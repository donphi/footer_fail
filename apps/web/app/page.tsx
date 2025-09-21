'use client';
import { useEffect, useMemo, useState } from 'react';
import InfiniteCarousel from '@/components/InfiniteCarousel';
import TopFeatured from '@/components/TopFeatured';
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
  footerScreenshot?: string;
  zoomYearCoordinates?: { x: number; y: number; width: number; height: number };
  posts?: Array<{ id: string; author: string; content: string; timestamp: string; }>;
};

export default function Page() {
  const [selectedSite, setSelectedSite] = useState<SiteRec | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (site: SiteRec) => {
    setSelectedSite(site);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSite(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-black overflow-hidden">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 space-y-8 sm:space-y-12 overflow-visible">
        {/* Header */}
        <header className="space-y-3 sm:space-y-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-thick tracking-tighter bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
            LAZYFERS
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 font-thin text-base sm:text-lg max-w-2xl mx-auto px-4">
            A daily hall of shame for companies whose footers are trapped in time.
            Immutable proof attached. No mercy given.
          </p>
        </header>

        {/* Top 2 Featured Section - Responsive on all devices */}
        <TopFeatured onCardClick={handleCardClick} />

        {/* Today's Fresh Catches - Infinite Carousel */}
        <section className="space-y-1">
          <InfiniteCarousel
            category="fresh"
            title="FRESH CATCHES"
            autoplayDelay={2500}
            onCardClick={handleCardClick}
          />
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-thin px-1">
            Found today. Shamed forever.
          </p>
        </section>

        {/* Hall of Shame - Infinite Carousel */}
        <section className="space-y-1">
          <InfiniteCarousel
            category="shame"
            title="HALL OF SHAME"
            autoplayDelay={3000}
            onCardClick={handleCardClick}
          />
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-thin px-1">
            Persistent failures. Years of negligence.
          </p>
        </section>

        {/* Archive Link */}
        <section className="border-t border-neutral-200 dark:border-neutral-800 pt-6 text-center sm:text-left">
          <Link
            href="/archive"
            className="group inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:scale-105 hover:shadow-2xl transition-all text-sm sm:text-base"
          >
            <IconDatabase size={18} stroke={2} className="sm:w-5 sm:h-5" />
            <span className="font-thick uppercase tracking-wider">View Full Archive</span>
            <IconArrowRight size={18} stroke={2} className="group-hover:translate-x-1 transition-transform sm:w-5 sm:h-5" />
          </Link>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 px-1">
            Browse the complete collection of temporal failures, sorted by incompetence.
          </p>
        </section>

        {/* Footer */}
        <footer className="py-6 sm:py-8 text-center text-xs text-neutral-400 border-t border-neutral-200 dark:border-neutral-800">
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