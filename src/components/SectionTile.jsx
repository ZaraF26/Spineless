import React from "react";

const TONES = {
  primary: "bg-primary/12 text-primary",
  accent: "bg-accent/20 text-accent-foreground",
  secondary: "bg-secondary/70 text-secondary-foreground",
  neutral: "bg-muted text-muted-foreground",
};

export default function SectionTile({ icon: Icon, title, tone = "primary" }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-[88px] shrink-0">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${TONES[tone]}`}>
        <Icon className="w-7 h-7" />
      </div>
      <span className="font-heading text-[13px] font-semibold text-center leading-tight line-clamp-2">
        {title}
      </span>
    </div>
  );
}