"use client";

import { useCallback, useEffect, useState } from "react";

type Shot = { src: string; eyebrow: string; caption: string };

// The bar, in pictures — a wide hero over a triptych. Images are pre-cropped
// to these aspect ratios (see public/gallery) so object-cover stays clean.
const IMAGES: Shot[] = [
  { src: "/gallery/bar-hero.jpg", eyebrow: "The Bar", caption: "Spirits & glassware" },
  { src: "/gallery/bar-cabinet.jpg", eyebrow: "Sipping", caption: "The cabinet" },
  { src: "/gallery/bar-library.jpg", eyebrow: "Base & curios", caption: "The library bar" },
  { src: "/gallery/bar-collection.jpg", eyebrow: "Exclusives", caption: "Limited editions" },
];

export function Gallery() {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (dir: number) => setOpen((i) => (i === null ? i : (i + dir + IMAGES.length) % IMAGES.length)),
    []
  );

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, step]);

  return (
    <>
      <div className="space-y-2">
        {/* Hero */}
        <Tile shot={IMAGES[0]} ratio="aspect-[16/9]" onClick={() => setOpen(0)} large />

        {/* Triptych */}
        <div className="grid grid-cols-3 gap-2">
          {IMAGES.slice(1).map((im, i) => (
            <Tile key={im.src} shot={im} ratio="aspect-[3/4]" onClick={() => setOpen(i + 1)} />
          ))}
        </div>
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMAGES[open].src}
            alt={IMAGES[open].caption}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[82vh] w-auto rounded-lg border border-brass/40 shadow-2xl"
          />
          <div className="mt-3 text-center">
            <div className="font-body text-[10px] uppercase tracking-[0.25em] text-brass-light/80">
              {IMAGES[open].eyebrow}
            </div>
            <p className="font-display text-lg text-parchment">{IMAGES[open].caption}</p>
          </div>

          {/* Prev / next */}
          <button
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full border border-brass/40 bg-black/40 text-2xl text-parchment/90 hover:bg-black/70"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full border border-brass/40 bg-black/40 text-2xl text-parchment/90 hover:bg-black/70"
          >
            ›
          </button>

          <div className="absolute bottom-4 font-body text-xs text-parchment/50">
            {open + 1} / {IMAGES.length} · tap to close
          </div>
        </div>
      )}
    </>
  );
}

function Tile({
  shot,
  ratio,
  onClick,
  large = false,
}: {
  shot: Shot;
  ratio: string;
  onClick: () => void;
  large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative ${ratio} w-full overflow-hidden rounded-lg border border-brass/40 shadow-ledger`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shot.src}
        alt={shot.caption}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-racing-deep/85 via-racing-deep/10 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-2.5 text-left">
        <span className="block font-body text-[9px] uppercase tracking-[0.22em] text-brass-light/90">
          {shot.eyebrow}
        </span>
        <span className={`block font-display font-semibold text-parchment ${large ? "text-base" : "text-xs"}`}>
          {shot.caption}
        </span>
      </span>
    </button>
  );
}
