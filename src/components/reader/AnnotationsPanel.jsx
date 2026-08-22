import React, { useState } from "react";
import { X, Trash2, Bookmark as BookmarkIcon, Highlighter, StickyNote } from "lucide-react";

export default function AnnotationsPanel({
  open,
  onClose,
  bookmarks,
  highlights,
  onJumpBookmark,
  onJumpHighlight,
  onDeleteBookmark,
  onDeleteHighlight,
}) {
  const [tab, setTab] = useState("bookmarks");
  if (!open) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-card border-t border-border rounded-t-2xl shadow-xl flex flex-col" style={{ maxHeight: "72%" }}>
      <div className="flex items-center justify-between p-4 pb-2 shrink-0">
        <h3 className="font-heading text-base font-semibold">Bookmarks & notes</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 px-4 pb-3 shrink-0">
        <button
          onClick={() => setTab("bookmarks")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${tab === "bookmarks" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          Bookmarks
        </button>
        <button
          onClick={() => setTab("notes")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${tab === "notes" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          Highlights & notes
        </button>
      </div>

      <div className="overflow-y-auto px-4 pb-8 space-y-2 min-h-[120px]">
        {tab === "bookmarks" ? (
          bookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No bookmarks yet. Tap the bookmark icon while reading.</p>
          ) : (
            bookmarks.map((b, i) => (
              <div key={b.cfi + i} className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border">
                <BookmarkIcon className="w-4 h-4 text-primary shrink-0" />
                <button onClick={() => onJumpBookmark(b.cfi)} className="flex-1 text-left text-sm">
                  Bookmark at {b.pct || 0}%
                </button>
                <button onClick={() => onDeleteBookmark(b.cfi)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )
        ) : highlights.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Select text while reading to highlight or add a note.</p>
        ) : (
          highlights.map((h, i) => (
            <div key={h.cfi + i} className="p-3 rounded-lg bg-background border border-border">
              <div className="flex items-start gap-2">
                {h.note ? <StickyNote className="w-4 h-4 text-primary shrink-0 mt-0.5" /> : <Highlighter className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                <button onClick={() => onJumpHighlight(h.cfi)} className="flex-1 text-left">
                  <p className="text-sm text-foreground line-clamp-2">{h.text || "Highlight"}</p>
                  {h.note && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">Note: {h.note}</p>}
                </button>
                <button onClick={() => onDeleteHighlight(h.cfi)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="h-1 mt-2 rounded-full" style={{ background: h.color }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}