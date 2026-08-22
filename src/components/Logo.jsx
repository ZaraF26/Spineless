import React from "react";

export const LOGO_URL =
  "https://media.base44.com/images/public/6a89b990da6fea8b2eea3ba3/af06be972_spineless-3.jpg";

/**
 * Spineless brand logo (spine-book icon + "SPINELESS" wordmark).
 * size: "sm" (auth screens) | "lg" (welcome hero)
 */
export default function Logo({ size = "sm", className = "" }) {
  const dims = size === "lg" ? "w-28 h-28" : "w-16 h-16";
  return (
    <img
      src={LOGO_URL}
      alt="Spineless"
      className={`${dims} rounded-2xl object-cover ${className}`}
    />
  );
}