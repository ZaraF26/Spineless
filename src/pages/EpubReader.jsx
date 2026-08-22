import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ePub from "epubjs";
import { base44 } from "@/api/base44Client";
import { X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export default function EpubReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const renditionRef = useRef(null);
  const saveTimer = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let book = null;
    let ren = null;
    let cancelled = false;

    (async () => {
      try {
        const rec = await base44.entities.UserEpub.get(id);
        if (!rec) {
          setError("Book not found");
          setLoading(false);
          return;
        }
        setTitle(rec.title || "");

        book = ePub(rec.file_url);
        ren = book.renderTo(containerRef.current, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          spread: "none",
          allowScriptedContent: false,
        });
        await ren.display(rec.cfi || undefined);
        if (cancelled) return;

        renditionRef.current = ren;
        setLoading(false);

        // Generate locations for percentage progress
        book
          .locations
          .generate(800)
          .then(() => {
            ren.emit("relocated", ren.currentLocation());
          })
          .catch(() => {});

        ren.on("relocated", (location) => {
          if (!location?.start?.cfi) return;
          const cfi = location.start.cfi;
          let pct = 0;
          if (book.locations.length() > 0) {
            pct = Math.round((book.locations.percentageFrom(cfi) || 0) * 100);
            setProgress(pct);
          }
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(async () => {
            try {
              await base44.entities.UserEpub.update(id, {
                cfi,
                progress: pct || 0,
                last_read_date: new Date().toISOString(),
              });
            } catch {}
          }, 900);
        });

        // Tap zones: left third = prev, right third = next, middle = no-op
        ren.on("click", (e) => {
          const rect = containerRef.current.getBoundingClientRect();
          const x = (e.clientX ?? 0) - rect.left;
          const w = rect.width;
          if (x < w / 3) ren.prev();
          else if (x > (w * 2) / 3) ren.next();
        });
      } catch (e) {
        setError(e.message || "Could not open this book");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      try {
        if (ren) ren.destroy();
      } catch {}
      try {
        if (book) book.destroy();
      } catch {}
      renditionRef.current = null;
    };
  }, [id]);

  const next = () => renditionRef.current?.next();
  const prev = () => renditionRef.current?.prev();

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border bg-card/80 backdrop-blur">
        <button
          onClick={() => navigate("/library")}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary/60 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm font-medium text-foreground line-clamp-1">{title}</p>
          <p className="text-[11px] text-muted-foreground">{progress}% read</p>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-border">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Reader */}
      <div className="flex-1 min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background">
            <Loader2 className="w-7 h-7 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Opening book…</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center z-10 bg-background">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <button onClick={() => navigate("/library")} className="text-primary text-sm font-medium hover:underline">
              Back to library
            </button>
          </div>
        )}
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      {/* Footer nav */}
      {!loading && !error && (
        <div className="flex items-center justify-between px-6 h-14 border-t border-border bg-card/80 backdrop-blur safe-bottom">
          <button
            onClick={prev}
            className="w-11 h-11 rounded-full flex items-center justify-center text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-xs text-muted-foreground">Tap left / right to turn pages</span>
          <button
            onClick={next}
            className="w-11 h-11 rounded-full flex items-center justify-center text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}