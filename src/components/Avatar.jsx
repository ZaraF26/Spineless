import React from "react";
import { Image } from "@/components/ui/image";
import { initials } from "@/lib/readi";

export default function Avatar({ user, size = 40, className = "" }) {
  const pic = user?.profile_picture;
  const name = user?.display_name || user?.username || user?.full_name || user?.email || "";
  const dim = { width: size, height: size };
  if (pic) {
    return (
      <div className={`relative overflow-hidden rounded-full shrink-0 ${className}`} style={dim}>
        <Image src={pic} alt={name} fittingType="fill" className="w-full h-full" />
      </div>
    );
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center bg-secondary text-secondary-foreground font-medium shrink-0 ${className}`}
      style={{ ...dim, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
}