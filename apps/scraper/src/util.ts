import crypto from 'node:crypto';

export const yearRegex = /\b(19\d{2}|20\d{2})\b/g;
export const isYear = (n: number, current: number) => n >= 1990 && n <= current + 1;

// Extract years from any text (HTML or OCR results)
export const pickYears = (text: string, currentYear: number): number[] => {
  const y = (text.match(yearRegex)||[]).map(Number).filter(n => isYear(n, currentYear));
  return [...new Set(y)].sort((a,b)=>a-b);
};

export const slugOf = (url: string) => new URL(url).host.replace(/\./g,'-');
export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
export const todayKey = () => new Date().toISOString().slice(0,10);

// Helper to get the most problematic year (oldest that's not current)
export const getMostProblematicYear = (years: number[], currentYear: number): number | null => {
  const staleYears = years.filter(y => y < currentYear);
  return staleYears.length > 0 ? Math.min(...staleYears) : null;
};