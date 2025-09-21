import { SiteRec } from '@/app/page';
import YearBadge from './YearBadge';
import { ExternalLink } from 'lucide-react';

export default function ShotCard({ rec }: { rec: SiteRec }) {
  const current = new Date().getUTCFullYear();
  const wrong = (rec.detectedYears||[]).length ? Math.max(...rec.detectedYears) : undefined;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 shadow-sm hover:shadow-md transition">
      <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {rec.screenshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rec.screenshot} alt={`Footer screenshot for ${rec.url}`} className="h-full w-full object-cover"/>
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">No screenshot</div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 justify-between">
          <a href={rec.url} target="_blank" rel="noreferrer" className="font-medium hover:underline truncate max-w-[70%]">{rec.company || rec.url}</a>
          {wrong !== undefined && <YearBadge wrongYear={wrong} current={current} />}
        </div>
        <div className="flex gap-3 text-xs text-neutral-500">
          {rec.proof?.internetArchive && <a className="hover:underline inline-flex items-center gap-1" href={rec.proof.internetArchive} target="_blank" rel="noreferrer">Proof (IA) <ExternalLink size={12}/></a>}
          {rec.proof?.archiveToday && <a className="hover:underline inline-flex items-center gap-1" href={rec.proof.archiveToday} target="_blank" rel="noreferrer">Proof (AT) <ExternalLink size={12}/></a>}
        </div>
      </div>
    </div>
  );
}