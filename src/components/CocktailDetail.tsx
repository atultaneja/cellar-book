"use client";

import type { Cocktail } from "@/lib/cocktails";

// The full recipe — ingredients, method steps, glass, garnish.
export function CocktailDetail({ cocktail }: { cocktail: Cocktail }) {
  return (
    <div className="mt-2 border-t border-brass/20 pt-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 font-body text-[11px] uppercase tracking-widest text-brass-dark">
            Ingredients
          </div>
          <ul className="space-y-0.5">
            {cocktail.ingredients.map((ing, i) => (
              <li key={i} className="font-body text-sm text-ink">
                {ing}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 font-body text-[11px] uppercase tracking-widest text-brass-dark">
            Method
          </div>
          <ol className="list-decimal space-y-0.5 pl-4">
            {cocktail.steps.map((step, i) => (
              <li key={i} className="font-body text-sm text-ink">
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="mt-2 font-body text-xs text-ink-soft">
        <span className="font-semibold">Glass:</span> {cocktail.glass}
        {cocktail.garnish ? (
          <>
            {" · "}
            <span className="font-semibold">Garnish:</span> {cocktail.garnish}
          </>
        ) : null}
      </div>
    </div>
  );
}
