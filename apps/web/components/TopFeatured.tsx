'use client';

import { useEffect, useState } from 'react';
import { SiteRec } from '@/app/page';
import Image from 'next/image';

interface TopFeaturedProps {
  onCardClick?: (site: SiteRec) => void;
}

export default function TopFeatured({ onCardClick }: TopFeaturedProps) {
  const [topSites, setTopSites] = useState<SiteRec[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageType, setImageType] = useState<'zoom' | 'footer'>('zoom');

  useEffect(() => {
    fetch('/api/sites/top-featured')
      .then(r => r.json())
      .then(setTopSites);
  }, []);

  // Cycle between the two featured sites
  useEffect(() => {
    if (topSites.length < 2) return;

    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % 2);
    }, 8000); // Switch every 8 seconds

    return () => clearInterval(interval);
  }, [topSites]);

  // Fade between zoom and footer images
  useEffect(() => {
    const interval = setInterval(() => {
      setImageType(prev => prev === 'zoom' ? 'footer' : 'zoom');
    }, 4000); // Switch every 4 seconds

    return () => clearInterval(interval);
  }, []);

  if (topSites.length === 0) return null;

  const activeSite = topSites[activeIndex];
  const inactiveSite = topSites[1 - activeIndex];

  return (
    <section className="relative w-full mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl sm:text-2xl font-thick text-neutral-900 dark:text-neutral-100">
          TODAY'S TOP OFFENDERS
        </h2>
        <div className="flex gap-2">
          {topSites.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === activeIndex
                  ? 'w-8 bg-red-600'
                  : 'bg-neutral-400'
              }`}
              aria-label={`View featured site ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Active Featured Card */}
        <div
          onClick={() => onCardClick?.(activeSite)}
          className="relative group cursor-pointer rounded-xl overflow-hidden bg-gradient-to-br from-red-50 to-purple-50 dark:from-red-950/20 dark:to-purple-950/20 border border-neutral-200 dark:border-neutral-800 transition-all hover:scale-[1.02] hover:shadow-xl"
        >
          <div className="aspect-[4/3] relative overflow-hidden">
            {activeSite.screenshotZoom && (
              <div className={`absolute inset-0 transition-opacity duration-1000 ${imageType === 'zoom' ? 'opacity-100' : 'opacity-0'}`}>
                <Image
                  src={activeSite.screenshotZoom}
                  alt={`${activeSite.company || activeSite.url} year display`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority
                />
              </div>
            )}
            {activeSite.footerScreenshot && (
              <div className={`absolute inset-0 transition-opacity duration-1000 ${imageType === 'footer' ? 'opacity-100' : 'opacity-0'}`}>
                <Image
                  src={activeSite.footerScreenshot}
                  alt={`${activeSite.company || activeSite.url} footer`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Rank Badge */}
            <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              #1 WORST
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              {activeSite.company || activeSite.url}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-600 font-bold">
                {activeSite.currentYear - Math.max(...(activeSite.detectedYears || [activeSite.currentYear]))} years behind
              </span>
              {activeSite.industry && (
                <span className="text-neutral-600 dark:text-neutral-400">
                  • {activeSite.industry}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Second Featured Card (if exists) */}
        {inactiveSite && (
          <div
            onClick={() => onCardClick?.(inactiveSite)}
            className="relative group cursor-pointer rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20 border border-neutral-200 dark:border-neutral-800 transition-all hover:scale-[1.02] hover:shadow-xl"
          >
            <div className="aspect-[4/3] relative overflow-hidden">
              {inactiveSite.screenshotZoom && (
                <Image
                  src={inactiveSite.screenshotZoom}
                  alt={`${inactiveSite.company || inactiveSite.url} display`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Rank Badge */}
              <div className="absolute top-3 left-3 bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                #2 WORST
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {inactiveSite.company || inactiveSite.url}
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-orange-600 font-bold">
                  {inactiveSite.currentYear - Math.max(...(inactiveSite.detectedYears || [inactiveSite.currentYear]))} years behind
                </span>
                {inactiveSite.industry && (
                  <span className="text-neutral-600 dark:text-neutral-400">
                    • {inactiveSite.industry}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}