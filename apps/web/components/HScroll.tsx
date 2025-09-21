'use client';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HScroll({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 340; // card width + gap
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative group">
      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Scroll left"
      >
        <ChevronLeft size={20} />
      </button>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 pb-2 no-scrollbar hscroll"
      >
        {children}
      </div>
      
      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Scroll right"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}