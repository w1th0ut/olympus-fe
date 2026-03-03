"use client";

interface PlaceholderSectionProps {
  title: string;
}

export function PlaceholderSection({ title }: PlaceholderSectionProps) {
  return (
    <div className="mt-8 font-manrope text-sm sm:text-base text-neutral-600">
      {title} content coming soon.
    </div>
  );
}
