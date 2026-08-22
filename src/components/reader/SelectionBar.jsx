import React, { useEffect, useState } from "react";
import { Highlighter, StickyNote, X } from "lucide-react";

export default function SelectionBar({ selection, onClose, onHighlight, onSaveNote }) {
  const [note, setNote] = useState("");
  useEffect(() => {
    setNote("");
  }, [selection?.cfi]);

  if (!selection) return null;
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 bg-card border-t border-border rounded-t-2xl shadow-xl p-4 pb-6">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm text-muted-foreground italic flex-1 line-clamp-3">“{selection.text}”</p>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/60 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)…"
        rows={2}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none mb-3 focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onHighlight(selection.cfi, selection.text)}
          className="flex-1 h-10 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary/80"
        >
          <Highlighter className="w-4 h-4" /> Highlight
        </button>
        <button
          onClick={() => onSaveNote(selection.cfi, selection.text, note)}
          className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90"
        >
          <StickyNote className="w-4 h-4" /> Save note
        </button>
      </div>
    </div>
  );
}