import { cn } from '@/lib/utils';
export default function YearBadge({ wrongYear, current }: { wrongYear: number; current: number }) {
  const age = current - wrongYear;
  const tone = age >= 2 ? 'bg-red-600' : 'bg-amber-500';
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white', tone)}>
      © {wrongYear} · {age}y late
    </span>
  );
}