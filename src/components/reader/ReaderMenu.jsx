import React from "react";
import { X, Plus, Minus } from "lucide-react";
import { THEMES } from "@/lib/readerThemes";

export default function ReaderMenu({ open, onClose, fontScale, setFontScale, theme, setTheme }) {
  if (!open) return null;
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-card border-t border-border rounded-t-2xl shadow-xl p-5 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-semibold">Reading settings</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium">Text size</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setFontScale(Math.max(70, fontScale - 10))} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary/60">
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm w-10 text-center tabular-nums">{fontScale}%</span>
          <button onClick={() => setFontScale(Math.min(220, fontScale + 10))} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary/60">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-sm font-medium mb-2">Paper colour</p>
      <div className="flex gap-3 flex-wrap">
        {Object.keys(THEMES).map((k) => {
          const t = THEMES[k];
          const active = theme === k;
          return (
            <button key={k} onClick={() => setTheme(k)} className="flex flex-col items-center gap-1">
              <span
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold"
                style={{
                  background: t.paper,
                  color: t.ink,
                  borderColor: active ? "hsl(var(--primary))" : "hsl(var(--border))",
                  boxShadow: active ? "0 0 0 3px hsl(var(--primary) / 0.25)" : "none",
                }}
              >
                {t.label}
              </span>
              <span className="text-[11px] text-muted-foreground">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}