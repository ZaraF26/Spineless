import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ePub from "epubjs";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import {
  X, Loader2, Settings, Bookmark, BookMarked, ChevronLeft, ChevronRight,
} from "lucide-react";
import { THEMES, DEFAULT_THEME, HIGHLIGHT, NOTE, applyTheme } from "@/lib/readerThemes";
import ReaderMenu from "@/components/reader/ReaderMenu";
import AnnotationsPanel from "@/components/reader/AnnotationsPanel";
import SelectionBar from "@/components/reader/SelectionBar";

export default function EpubReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const containerRef = useRef(null);
  const renditionRef = useRef(null);
  const saveTimer = useRef(null);
  const highlightsRef = useRef([]);
  const bookmarksRef = useRef([]);
  const spineRef = useRef([]);
  const currentHrefRef = useRef("");
  const lastPctRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);

  const [pdfMode, setPdfMode] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [fontScale, setFontScale] = useState(100);
  const [paper, setPaper] = useState(THEMES[DEFAULT_THEME].paper);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selection, setSelection] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [highlights, setHighlights] = useState([]);

  const persist = async (partial) => {
    try { await base44.entities.UserEpub.update(id, partial); } catch {}
  };

  useEffect(() => {
    const ren = renditionRef.current;
    if (!ren || pdfMode) return;
    applyTheme(ren, theme, fontScale);
    setPaper(THEMES[theme]?.paper || THEMES.light.paper);
    persist({ theme, font_scale: fontScale });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, fontScale]);

  useEffect(() => {
    let book = null;
    let ren = null;
    let cancelled = false;
    let scrollT = null;
    let onScroll = () => {};

    (async () => {
      try {
        const rec = await base44.entities.UserEpub.get(id);
        if (!rec) { setError("Book not found"); setLoading(false); return; }
        setTitle(rec.title || "");
        setBookmarks(rec.bookmarks || []);
        setHighlights(rec.highlights || []);
        highlightsRef.current = rec.highlights || [];
        bookmarksRef.current = rec.bookmarks || [];
        setTheme(rec.theme || DEFAULT_THEME);
        setFontScale(rec.font_scale || 100);
        setPaper(THEMES[rec.theme || DEFAULT_THEME]?.paper);

        // PDF: render natively in an iframe; mark as started
        if ((rec.file_type || "").toLowerCase() === "pdf") {
          setPdfMode(true);
          setPdfUrl(rec.file_url);
          setLoading(false);
          setProgress((p) => p || 1);
          persist({ progress: 1, last_read_date: new Date().toISOString() });
          return;
        }
        setPdfMode(false);

        book = ePub(rec.file_url);
        ren = book.renderTo(containerRef.current, {
          width: "100%", height: "100%", flow: "scrolled-doc", spread: "none",
          allowScriptedContent: false, manager: "default",
        });
        await ren.display(rec.cfi || undefined);
        if (cancelled) return;
        renditionRef.current = ren;
        setLoading(false);

        applyTheme(ren, rec.theme || DEFAULT_THEME, rec.font_scale || 100);
        spineRef.current = book.spine.spineItems || [];

        // Live progress: emit a "relocated" as the user scrolls within a chapter
        onScroll = () => {
          if (scrollT) return;
          scrollT = setTimeout(() => {
            scrollT = null;
            try { ren.emit("relocated", ren.currentLocation()); } catch {}
          }, 200);
        };
        containerRef.current?.addEventListener("scroll", onScroll, true);

        (rec.highlights || []).forEach((h) => {
          try {
            ren.annotations.add("highlight", h.cfi, {}, undefined, "spineless-hl", {
              fill: h.color, "fill-opacity": "0.45", "mix-blend-mode": "multiply",
            });
          } catch {}
        });

        book.locations.generate(800).then(() => {
          try { ren.emit("relocated", ren.currentLocation()); } catch {}
        }).catch(() => {});

        ren.on("relocated", (location) => {
          if (!location?.start?.cfi) return;
          const cfi = location.start.cfi;
          currentHrefRef.current = location.start.href || "";
          const pct = book.locations.length() > 0 ? Math.round((book.locations.percentageFrom(cfi) || 0) * 100) : 0;
          lastPctRef.current = pct;
          setProgress(pct);
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => {
            persist({ cfi, progress: pct || 0, last_read_date: new Date().toISOString() });
          }, 900);
        });

        ren.on("selected", (cfiRange, contents) => {
          if (!cfiRange) return;
          let text = "";
          try { text = contents?.window?.getSelection?.()?.toString() || ""; } catch {}
          if (!text.trim()) return;
          setSelection({ cfi: cfiRange, text });
        });
      } catch (e) {
        setError(e.message || "Could not open this book");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      try { containerRef.current?.removeEventListener("scroll", onScroll, true); } catch {}
      try { if (ren) ren.destroy(); } catch {}
      try { if (book) book.destroy(); } catch {}
      renditionRef.current = null;
    };
  }, [id]);

  const clearSelection = () => {
    setSelection(null);
    try {
      const c = renditionRef.current?.getContents?.()?.[0];
      c?.window?.getSelection?.()?.removeAllRanges?.();
    } catch {}
  };

  const addHighlight = (cfi, text, color, note) => {
    const ren = renditionRef.current;
    try {
      ren.annotations.add("highlight", cfi, {}, undefined, "spineless-hl", {
        fill: color, "fill-opacity": "0.45", "mix-blend-mode": "multiply",
      });
    } catch {}
    const updated = [...highlightsRef.current, { cfi, color, text, note: note || "" }];
    highlightsRef.current = updated;
    setHighlights(updated);
    persist({ highlights: updated });
  };

  const removeHighlight = (cfi) => {
    try { renditionRef.current.annotations.remove(cfi, "highlight"); } catch {}
    const updated = highlightsRef.current.filter((h) => h.cfi !== cfi);
    highlightsRef.current = updated;
    setHighlights(updated);
    persist({ highlights: updated });
  };

  const addBookmark = () => {
    const loc = renditionRef.current?.currentLocation?.();
    const cfi = loc?.start?.cfi;
    if (!cfi) return;
    const pct = lastPctRef.current || 0;
    const updated = [...bookmarksRef.current, { cfi, pct }];
    bookmarksRef.current = updated;
    setBookmarks(updated);
    persist({ bookmarks: updated });
    toast({ title: "Bookmarked 📌" });
  };

  const removeBookmark = (cfi) => {
    const updated = bookmarksRef.current.filter((b) => b.cfi !== cfi);
    bookmarksRef.current = updated;
    setBookmarks(updated);
    persist({ bookmarks: updated });
  };

  const jump = (cfi) => {
    renditionRef.current?.display(cfi);
    setPanelOpen(false);
  };

  const goChapter = (dir) => {
    const ren = renditionRef.current;
    if (!ren) return;
    try { if (dir > 0) ren.next(); else ren.prev(); } catch {}
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50 max-w-md mx-auto">
      <div className="flex items-center gap-1 px-3 h-14 border-b border-border bg-card/80 backdrop-blur shrink-0">
        <button onClick={() => navigate("/library")} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary/60" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm font-medium text-foreground line-clamp-1">{title}</p>
          <p className="text-[11px] text-muted-foreground">{progress}% read</p>
        </div>
        {!pdfMode && (
          <>
            <button onClick={addBookmark} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary/60" aria-label="Bookmark page">
              <Bookmark className="w-5 h-5" />
            </button>
            <button onClick={() => { setPanelOpen((v) => !v); setMenuOpen(false); }} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary/60" aria-label="Bookmarks & notes">
              <BookMarked className="w-5 h-5" />
            </button>
            <button onClick={() => { setMenuOpen((v) => !v); setPanelOpen(false); }} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary/60" aria-label="Reading settings">
              <Settings className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <div className="h-0.5 bg-border shrink-0">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 min-h-0 relative" style={{ background: pdfMode ? "#ffffff" : paper }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-background">
            <Loader2 className="w-7 h-7 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Opening book…</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center z-20 bg-background">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <button onClick={() => navigate("/library")} className="text-primary text-sm font-medium hover:underline">Back to library</button>
          </div>
        )}
        {pdfMode && pdfUrl && (
          <iframe src={pdfUrl} title={title} className="absolute inset-0 w-full h-full border-0 bg-white" />
        )}
        <div ref={containerRef} className="absolute inset-0" style={{ display: pdfMode ? "none" : "block" }} />
      </div>

      {!loading && !error && !pdfMode && (
        <>
          <button onClick={() => goChapter(-1)} className="absolute left-3 bottom-5 w-11 h-11 rounded-full bg-card border border-border shadow-lg flex items-center justify-center z-20 hover:bg-secondary/60" aria-label="Previous chapter">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => goChapter(1)} className="absolute right-3 bottom-5 w-11 h-11 rounded-full bg-card border border-border shadow-lg flex items-center justify-center z-20 hover:bg-secondary/60" aria-label="Next chapter">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {!pdfMode && (
        <>
          <ReaderMenu open={menuOpen} onClose={() => setMenuOpen(false)} fontScale={fontScale} setFontScale={setFontScale} theme={theme} setTheme={setTheme} />
          <AnnotationsPanel
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
            bookmarks={bookmarks}
            highlights={highlights}
            onJumpBookmark={jump}
            onJumpHighlight={jump}
            onDeleteBookmark={removeBookmark}
            onDeleteHighlight={removeHighlight}
          />
          <SelectionBar
            selection={selection}
            onClose={clearSelection}
            onHighlight={(cfi, text) => { addHighlight(cfi, text, HIGHLIGHT, ""); toast({ title: "Highlighted" }); clearSelection(); }}
            onSaveNote={(cfi, text, note) => { addHighlight(cfi, text, NOTE, (note || "").trim()); toast({ title: "Note saved" }); clearSelection(); }}
          />
        </>
      )}
    </div>
  );
}