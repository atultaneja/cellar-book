"use client";

import { CATEGORIES_BY_FAMILY } from "@/lib/categories";

// A category picker whose options are grouped under their broad family
// (Whiskey, Gin, Wine, …) so the long list stays navigable.
export function CategorySelect({
  value,
  onChange,
  className = "club-input",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      {CATEGORIES_BY_FAMILY.map((group) => (
        <optgroup key={group.family} label={group.family}>
          {group.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
