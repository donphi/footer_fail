'use client';

import { useEffect, useRef, useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import FailCard from "./FailCard";
import { SiteRec } from "@/app/page";
import { IconChevronLeft, IconChevronRight, IconLoader2 } from "@tabler/icons-react";

interface InfiniteCarouselProps {
  category: 'fresh' | 'shame' | 'all';
  title?: string;
  autoplayDelay?: number;
  onCardClick?: (site: SiteRec) => void;
}

export default function InfiniteCarousel({
  category,
  title,
  autoplayDelay = 4000,
  onCardClick
}: InfiniteCarouselProps) {
  const [slides, setSlides] = useState<SiteRec[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: false, // Disable loop to prevent jumping
      align: "start",
      dragFree: true, // Enable free dragging for smoother experience
      containScroll: "trimSnaps",
      skipSnaps: false,
      slidesToScroll: 1,
      watchDrag: true
    }
  );

  // Load initial data
  useEffect(() => {
    loadMoreSlides();
  }, []);

  const loadMoreSlides = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/sites/paginated?page=${page}&limit=20&category=${category}`);
      const data = await response.json();

      // Append new slides without disrupting current view
      setSlides(prev => {
        // Avoid duplicates
        const existingSlugs = new Set(prev.map(s => s.slug));
        const newSlides = data.items.filter((item: SiteRec) => !existingSlugs.has(item.slug));
        return [...prev, ...newSlides];
      });

      setHasMore(data.hasMore);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading slides:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, hasMore, isLoading, category]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!emblaApi || isPaused || slides.length === 0) return;

    const autoScroll = () => {
      if (!emblaApi.canScrollNext()) {
        // If we can't scroll next and have more content, load it
        if (hasMore) {
          loadMoreSlides();
        } else if (slides.length > 5) {
          // Only loop back if we have enough slides
          emblaApi.scrollTo(0);
        }
      } else {
        emblaApi.scrollNext();
      }
    };

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set new interval
    intervalRef.current = setInterval(autoScroll, autoplayDelay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [emblaApi, isPaused, slides.length, hasMore, autoplayDelay, loadMoreSlides]);

  // Check if we need to load more slides when scrolling
  useEffect(() => {
    if (!emblaApi) return;

    const onScroll = () => {
      const progress = emblaApi.scrollProgress();

      // Load more when we're 70% through the carousel
      if (progress > 0.7 && hasMore && !isLoading) {
        loadMoreSlides();
      }
    };

    emblaApi.on('scroll', onScroll);
    return () => {
      emblaApi.off('scroll', onScroll);
    };
  }, [emblaApi, hasMore, isLoading, loadMoreSlides]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      // Check if we need to load more
      const progress = emblaApi.scrollProgress();
      if (progress > 0.7 && hasMore && !isLoading) {
        loadMoreSlides();
      }
    }
  }, [emblaApi, hasMore, isLoading, loadMoreSlides]);

  // Handle hover to pause/resume
  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  if (slides.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section className="relative py-3 overflow-visible">
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-thick text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="p-1.5 sm:p-2 rounded-full bg-white/60 dark:bg-neutral-800/60 backdrop-blur hover:bg-white dark:hover:bg-neutral-700 hover:scale-110 transition-all"
              aria-label="Previous slide"
            >
              <IconChevronLeft size={16} stroke={2.5} className="sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={scrollNext}
              className="p-1.5 sm:p-2 rounded-full bg-white/60 dark:bg-neutral-800/60 backdrop-blur hover:bg-white dark:hover:bg-neutral-700 hover:scale-110 transition-all"
              aria-label="Next slide"
            >
              <IconChevronRight size={16} stroke={2.5} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      <div
        className="embla relative"
        ref={emblaRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="embla__container">
          {slides.map((site, i) => (
            <div
              key={`${site.slug}-${i}`}
              className="embla__slide embla__slide--smaller"
              onClick={() => onCardClick?.(site)}
            >
              <FailCard rec={site} isClickable compact />
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="embla__slide embla__slide--smaller flex items-center justify-center min-h-[200px]">
              <div className="flex flex-col items-center gap-2 text-neutral-500">
                <IconLoader2 size={20} className="animate-spin" />
                <span className="text-xs">Loading more...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}