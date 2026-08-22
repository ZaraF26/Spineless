import React from "react";
import { Image } from "@/components/ui/image";
import { coverColor } from "@/lib/readi";

export default function BookCover({ book, className = "", title }) {
  const cover = book?.cover_url || book?.book_cover;
  const label = book?.title || book?.book_title || title || "";
  if (cover) {
    return (
      <Image
        src={cover}
        alt={label}
        fittingType="fill"
        className={`object-cover ring-1 ring-black/10 dark:ring-white/10 shadow-sm ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center p-2 text-center overflow-hidden ${className}`}
      style={{ background: coverColor(label) }}
    >
      <span className="font-heading text-white/95 text-sm leading-tight line-clamp-4 drop-shadow-sm">
        {label}
      </span>
    </div>
  );
}