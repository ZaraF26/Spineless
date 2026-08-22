import React from "react";

const TONES = {
  primary: "bg-primary/12 text-primary",
  accent: "bg-accent/20 text-accent-foreground",
  secondary: "bg-secondary/70 text-secondary-foreground",
  neutral: "bg-muted text-muted-foreground",
};

export default function SectionTile({ icon: Icon, title, tone = "primary" }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ring-1 ring-black/5 dark:ring-white/10 ${TONES[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-heading text-lg font-semibold leading-tight">
        {title}
      </span>
    </div>
  );
}