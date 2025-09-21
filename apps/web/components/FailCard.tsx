"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  IconExternalLink,
  IconArchive,
  IconWorldWww,
  IconAlertHexagon,
  IconHourglass,
  IconClock
} from "@tabler/icons-react";
import { SiteRec } from "@/app/page";

export default function FailCard({ rec, isClickable = false, compact = false }: { rec: SiteRec; isClickable?: boolean; compact?: boolean }) {
  const current = new Date().getUTCFullYear();
  const wrong = rec.detectedYears?.length ? Math.max(...rec.detectedYears) : undefined;
  const yearsOff = wrong ? current - wrong : 0;

  // Calculate actual days since the footer should have been updated
  const today = new Date();
  const shouldHaveUpdatedDate = wrong ? new Date(`${wrong + 1}-01-01`) : null;
  const daysStale = shouldHaveUpdatedDate ? Math.floor((today.getTime() - shouldHaveUpdatedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Get the latest AI comment if available
  const latestComment = rec.posts?.[0]?.content || "Awaiting brutal commentary from our narrators. 280 characters of pure, unfiltered temporal mockery coming soon...";

  // Generate brutally honest tags in the voice of our narrators
  const getTags = () => {
    const tags = [];

    // Time-based brutal honesty
    if (yearsOff >= 10) {
      tags.push({
        label: "FOSSIL RECORD",
        gradient: "from-stone-800 via-stone-600 to-amber-600",
        textColor: "text-white"
      });
    } else if (yearsOff >= 5) {
      tags.push({
        label: "DECOMPOSING",
        gradient: "from-emerald-900 via-green-700 to-lime-600",
        textColor: "text-white"
      });
    } else if (yearsOff >= 3) {
      tags.push({
        label: "ROTTING",
        gradient: "from-purple-900 via-purple-700 to-pink-600",
        textColor: "text-white"
      });
    } else if (yearsOff >= 2) {
      tags.push({
        label: "EXPIRED",
        gradient: "from-red-900 via-red-700 to-orange-600",
        textColor: "text-white"
      });
    } else if (yearsOff === 1) {
      tags.push({
        label: "LAZY",
        gradient: "from-blue-900 via-blue-700 to-cyan-600",
        textColor: "text-white"
      });
    }

    // System failure tags
    if (rec.status === 'stale') {
      tags.push({
        label: "SYSTEM FAILURE",
        gradient: "from-red-600 via-pink-600 to-purple-600",
        textColor: "text-white"
      });
    }

    // Corporate shame
    if (rec.company) {
      tags.push({
        label: "CORPORATE DECAY",
        gradient: "from-gray-900 via-gray-700 to-gray-500",
        textColor: "text-white"
      });
    }

    // Time calculation tags - use actual days stale
    if (daysStale > 0) {
      if (daysStale > 1000) {
        tags.push({
          label: `${daysStale.toLocaleString()} DAYS OF LIES`,
          gradient: "from-black via-red-900 to-red-600",
          textColor: "text-white"
        });
      } else {
        tags.push({
          label: `${daysStale} DAYS DEAD`,
          gradient: "from-indigo-900 via-purple-800 to-pink-700",
          textColor: "text-white"
        });
      }
    }

    return tags;
  };

  const tags = getTags();

  return (
    <Card className={`h-full flex flex-col rounded-2xl border-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_70px_-20px_rgba(0,0,0,0.7)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] overflow-hidden ${isClickable ? 'cursor-pointer' : ''}`}>
      <div className="relative aspect-[16/9] bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-black rounded-t-2xl overflow-hidden">
        {rec.screenshot ? (
          <img
            src={rec.screenshot}
            alt={`Footer screenshot for ${rec.company || rec.url}`}
            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-red-900/20 to-black/40">
            <IconAlertHexagon className="w-16 h-16 text-red-400" stroke={1.5} />
          </div>
        )}

        {/* Dark gradient overlay for drama */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Year badge with brutal positioning */}
        {wrong && (
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div className="bg-black/60 backdrop-blur-md rounded-lg px-3 py-2">
              <div className="text-red-500 font-thick text-2xl">{wrong}</div>
              <div className="text-red-400/80 text-xs font-thin uppercase tracking-wider">
                {yearsOff} year{yearsOff !== 1 ? 's' : ''} dead
              </div>
            </div>
          </div>
        )}
      </div>

      <CardContent className={`${compact ? 'p-3 space-y-2' : 'p-4 space-y-3'} flex-1 flex flex-col`}>
        {/* Company name with stark typography */}
        <div className="space-y-1">
          <h3 className={`font-thick ${compact ? 'text-sm truncate' : 'text-xl'} text-black dark:text-white`}>
            {rec.company || new URL(rec.url).hostname.replace('www.', '')}
          </h3>
          <a
            href={rec.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => isClickable && e.stopPropagation()}
            className={`${compact ? 'text-xs truncate' : 'text-sm'} text-neutral-500 hover:text-black dark:hover:text-white transition-colors inline-block`}
          >
            {new URL(rec.url).hostname}
          </a>
        </div>

        {/* Brutal tags with gradients */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <div
              key={i}
              className={`inline-flex items-center ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-full font-medium ${tag.textColor} bg-gradient-to-r ${tag.gradient} shadow-lg`}
            >
              <span className="font-thick tracking-wider uppercase">{tag.label}</span>
            </div>
          ))}
        </div>

        {/* AI Comment with dramatic styling - Fixed height for 2 lines */}
        {!compact && (
          <div className="border-l-4 border-gradient-to-b from-red-600 to-purple-600 pl-4 flex-1">
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 font-thin italic line-clamp-2 min-h-[2.5rem]">
              {latestComment}
            </p>
          </div>
        )}

        {/* Proof links with subtle styling - always at bottom */}
        {(rec.proof?.internetArchive || rec.proof?.archiveToday) && (
          <div className="flex gap-4 pt-2 border-t border-neutral-200/20 dark:border-neutral-700/20">
            {rec.proof?.internetArchive && (
              <a
                href={rec.proof.internetArchive}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-neutral-500 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center gap-1.5 transition-all group/proof uppercase tracking-wider font-medium"
              >
                <IconHourglass size={14} stroke={2} className="group-hover/proof:rotate-180 transition-transform duration-500" />
                <span>Wayback</span>
              </a>
            )}
            {rec.proof?.archiveToday && (
              <a
                href={rec.proof.archiveToday}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-neutral-500 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center gap-1.5 transition-all group/proof uppercase tracking-wider font-medium"
              >
                <IconArchive size={14} stroke={2} className="group-hover/proof:scale-110 transition-transform" />
                <span>Archive.today</span>
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}