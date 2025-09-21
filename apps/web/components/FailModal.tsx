"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { IconX, IconHourglass, IconArchive } from "@tabler/icons-react";
import { SiteRec } from "@/app/page";

export default function FailModal({
  site,
  isOpen,
  onClose
}: {
  site: SiteRec | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !site) return null;

  const current = new Date().getUTCFullYear();
  const wrong = site.detectedYears?.length ? Math.max(...site.detectedYears) : undefined;
  const yearsOff = wrong ? current - wrong : 0;

  // Calculate actual days since the footer should have been updated
  const today = new Date();
  const shouldHaveUpdatedDate = wrong ? new Date(`${wrong + 1}-01-01`) : null;
  const daysStale = shouldHaveUpdatedDate ? Math.floor((today.getTime() - shouldHaveUpdatedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const latestComment = site.posts?.[0]?.content || "Awaiting brutal commentary from our narrators. 280 characters of pure, unfiltered temporal mockery coming soon...";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <Card
        className="relative max-w-2xl w-full max-h-[90vh] overflow-auto bg-white/95 dark:bg-black/95 backdrop-blur-xl shadow-2xl border-0 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-10"
        >
          <IconX size={20} stroke={2} />
        </button>

        {/* Screenshot - Use zoomed version if available */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-black">
          {(site.screenshotZoom || site.screenshot) ? (
            <img
              src={site.screenshotZoom || site.screenshot}
              alt={`Footer screenshot for ${site.company || site.url}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              No screenshot available
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {wrong && (
            <div className="absolute bottom-4 left-4">
              <div className="bg-black/60 backdrop-blur-md rounded-lg px-4 py-3">
                <div className="text-red-500 font-thick text-3xl">{wrong}</div>
                <div className="text-red-400/80 text-sm font-thin uppercase tracking-wider">
                  {yearsOff} year{yearsOff !== 1 ? 's' : ''} behind
                </div>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Company Info */}
          <div>
            <h2 className="font-thick text-2xl text-black dark:text-white mb-2">
              {site.company || new URL(site.url).hostname.replace('www.', '')}
            </h2>
            <a
              href={site.url}
              target="_blank"
              rel="noreferrer"
              className="text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
            >
              {site.url}
            </a>
          </div>

          {/* AI Comment Section */}
          <div className="bg-gradient-to-r from-red-50 to-purple-50 dark:from-red-950/30 dark:to-purple-950/30 rounded-xl p-6 border border-red-200/50 dark:border-red-800/50">
            <h3 className="font-thick text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-3">
              Narrator Commentary
            </h3>
            <p className="text-lg leading-relaxed text-black dark:text-white font-thin italic">
              "{latestComment}"
            </p>
            {site.posts?.[0]?.author && (
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                — {site.posts[0].author}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Days of Lies</p>
              <p className="font-thick text-2xl">{daysStale.toLocaleString()}</p>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-4">
              <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Status</p>
              <p className="font-thick text-2xl capitalize">{site.status}</p>
            </div>
          </div>

          {/* Proof Links */}
          {(site.proof?.internetArchive || site.proof?.archiveToday) && (
            <div className="flex gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              {site.proof?.internetArchive && (
                <a
                  href={site.proof.internetArchive}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-full text-sm font-medium hover:scale-105 transition-transform"
                >
                  <IconHourglass size={16} stroke={2} />
                  Wayback Machine
                </a>
              )}
              {site.proof?.archiveToday && (
                <a
                  href={site.proof.archiveToday}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-full text-sm font-medium hover:scale-105 transition-transform"
                >
                  <IconArchive size={16} stroke={2} />
                  Archive.today
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}