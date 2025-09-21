import type { SiteRec } from '@/app/page';

// Simple heuristic: .com gets +0.5; presence of company name +0.5; long TLDs get -0.2
export function brandWeight(r: SiteRec): number {
  const host = r.url ? new URL(r.url).host.toLowerCase() : '';
  let w = 0;
  if (host.endsWith('.com')) w += 0.5;
  if (r.company) w += 0.5;
  if (/\.io$|\.xyz$/.test(host)) w -= 0.2;
  return w;
}