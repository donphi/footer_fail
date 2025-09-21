"use client";

import { useEffect, useRef, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import FailCard from "./FailCard";
import { SiteRec } from "@/app/page";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

export default function FailCarousel({
  slides,
  title,
  autoplayDelay = 4000,
  onCardClick
}: {
  slides: SiteRec[];
  title?: string;
  autoplayDelay?: number;
  onCardClick?: (site: SiteRec) => void;
}) {
  const autoplayPlugin = useRef(
    Autoplay({ delay: autoplayDelay, stopOnInteraction: false, stopOnMouseEnter: false })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      dragFree: false,
      containScroll: false,
      skipSnaps: false,
      slidesToScroll: 1
    },
    [autoplayPlugin.current]
  );

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  // Handle hover to pause/resume
  const handleMouseEnter = useCallback(() => {
    autoplayPlugin.current.stop();
  }, []);

  const handleMouseLeave = useCallback(() => {
    autoplayPlugin.current.play();
  }, []);

  return (
    <section className="relative py-4 overflow-visible">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-thick text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="p-2 rounded-full bg-white/60 dark:bg-neutral-800/60 backdrop-blur hover:bg-white dark:hover:bg-neutral-700 hover:scale-110 transition-all"
              aria-label="Previous slide"
            >
              <IconChevronLeft size={20} stroke={2.5} />
            </button>
            <button
              onClick={scrollNext}
              className="p-2 rounded-full bg-white/60 dark:bg-neutral-800/60 backdrop-blur hover:bg-white dark:hover:bg-neutral-700 hover:scale-110 transition-all"
              aria-label="Next slide"
            >
              <IconChevronRight size={20} stroke={2.5} />
            </button>
          </div>
        </div>
      )}

      <div
        className="embla"
        ref={emblaRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="embla__container">
          {slides.map((site, i) => (
            <div
              key={`${site.slug}-${i}`}
              className="embla__slide"
              onClick={() => onCardClick?.(site)}
            >
              <FailCard rec={site} isClickable />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}