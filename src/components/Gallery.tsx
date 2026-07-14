"use client";

import { useState } from "react";

const IMAGES = [
  { src: "/gallery/bar-4.jpg", caption: "The main bar" },
  { src: "/gallery/bar-1.jpg", caption: "Spirits & glassware" },
  { src: "/gallery/bar-2.jpg", caption: "The library bar" },
  { src: "/gallery/bar-3.jpg", caption: "The collection" },
];

export function Gallery() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {IMAGES.map((im, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-brass/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={im.src}
              alt={im.caption}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-racing-deep/85 to-transparent px-2 py-1.5 text-left font-body text-xs text-parchment">
              {im.caption}
            </span>
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMAGES[open].src}
            alt={IMAGES[open].caption}
            className="max-h-[85vh] w-auto rounded-lg border border-brass/40"
          />
          <p className="mt-3 font-body text-sm italic text-parchment/90">{IMAGES[open].caption}</p>
          <p className="mt-1 font-body text-xs text-parchment/50">tap anywhere to close</p>
        </div>
      )}
    </>
  );
}
