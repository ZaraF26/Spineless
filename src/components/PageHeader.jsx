import React from "react";
import { Link } from "react-router-dom";
import { Search, Bell, Sparkles } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function PageHeader({ title, subtitle, showActions = true }) {
  return (
    <div className="flex items-start justify-between px-5 pt-6 pb-2">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {showActions && (
        <div className="flex items-center gap-1">
          <Link to="/discover" className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-secondary/60 transition-colors" aria-label="Search">
            <Search className="w-5 h-5" />
          </Link>
          <Link to="/activity" className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-secondary/60 transition-colors" aria-label="Activity">
            <Sparkles className="w-5 h-5" />
          </Link>
          <Link to="/notifications" className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-secondary/60 transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5" />
          </Link>
          <ThemeToggle />
        </div>
      )}
    </div>
  );
}