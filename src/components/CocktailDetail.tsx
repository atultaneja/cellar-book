"use client";

import type { Recipe } from "@/lib/cocktails";

// The full recipe — ingredients, method steps, glass, garnish. Works for both
// the built-in canon and drinks the sommelier invents on the fly.
export function CocktailDetail({ recipe }: { recipe: Recipe }) {
  return (
    <div className="mt-2 border-t border-brass/20 pt-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 font-body text-[11px] uppercase tracking-widest text-brass-dark">
            Ingredients
          </div>
          <ul className="space-y-0.5">
            {recipe.ingredients.map((ing, i) => (
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
            {recipe.steps.map((step, i) => (
              <li key={i} className="font-body text-sm text-ink">
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
      {(recipe.glass || recipe.garnish) && (
        <div className="mt-2 font-body text-xs text-ink-soft">
          {recipe.glass && (
            <>
              <span className="font-semibold">Glass:</span> {recipe.glass}
            </>
          )}
          {recipe.garnish ? (
            <>
              {recipe.glass ? " · " : ""}
              <span className="font-semibold">Garnish:</span> {recipe.garnish}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
