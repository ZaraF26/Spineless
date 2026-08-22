import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import ePub from "epubjs";
import { Upload, BookOpen, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";

export default function Library() {
  const { toast } = useToast();
  const [books, setBooks] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.UserEpub.list("-last_read_date", 100);
      setBooks(list);
    } catch {
      setBooks([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isEpub = /\.epub$/i.test(file.name) || file.type === "application/epub+zip";
    const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
    if (!isEpub && !isPdf) {
      toast({ title: "Please choose an EPUB or PDF file", variant: "destructive" });
      e.target.value = "";
      return;
    }
    const fileType = isPdf ? "pdf" : "epub";
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract metadata + cover from the EPUB
      let title = file.name.replace(/\.(epub|pdf)$/i, "");
      let author = "";
      let cover_url = "";
      let book = null;
      try {
        book = ePub(file_url);
        await book.ready;
        const md = book.metadata || (await book.loaded.metadata);
        title = md?.title || title;
        author = (md?.creator || "").trim();
        const coverBlobUrl = await book.coverUrl();
        if (coverBlobUrl) {
          const res = await fetch(coverBlobUrl);
          const blob = await res.blob();
          const coverFile = new File([blob], "cover.jpg", { type: blob.type || "image/jpeg" });
          const up = await base44.integrations.Core.UploadFile({ file: coverFile });
          cover_url = up.file_url;
        }
      } catch {
        // metadata parsing is best-effort; keep filename fallback
      } finally {
        try {
          if (book) book.destroy();
        } catch {}
      }

      await base44.entities.UserEpub.create({ title, author, cover_url, file_url, file_type: fileType });
      toast({ title: "Added to your library 📚" });
      load();
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (book) => {
    try {
      await base44.entities.UserEpub.delete(book.id);
      if (book.session_id) {
        try {
          await Promise.allSettled([
            base44.entities.Chapter.deleteMany({ session_id: book.session_id }),
            base44.entities.Comment.deleteMany({ session_id: book.session_id }),
            base44.entities.UserBook.deleteMany({ session_id: book.session_id }),
            base44.entities.UserEpub.deleteMany({ session_id: book.session_id }),
            base44.entities.ReadingSession.delete(book.session_id),
          ]);
        } catch {}
      }
      setBooks((prev) => (prev || []).filter((b) => b.id !== book.id));
      toast({ title: "Removed from everywhere in the app" });
    } catch {
      toast({ title: "Could not remove book", variant: "destructive" });
    }
  };

  return (
    <div>
      <PageHeader title="Library" subtitle="Your uploaded books" />

      <div className="px-5 pb-4">
        <label
          className={`flex items-center justify-center gap-2 w-full h-12 rounded-xl border-2 border-dashed border-border bg-card text-sm font-medium transition-colors cursor-pointer ${
            uploading ? "opacity-60 pointer-events-none" : "hover:border-primary/40 hover:text-primary"
          }`}
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload EPUB or PDF</>
          )}
          <input type="file" accept=".epub,.pdf,application/epub+zip,application/pdf" onChange={handleUpload} className="hidden" />
        </label>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Add EPUB or PDF files from your device and read them right here.
        </p>
      </div>

      <div className="px-5 pb-28">
        {books === null ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/60 mb-3" />
            <p className="text-sm text-muted-foreground">No books yet. Upload your first EPUB or PDF above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {books.map((b) => (
              <div key={b.id} className="group relative">
                <Link to={`/read/${b.id}`} className="block">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary shadow-sm border border-border">
                    {b.cover_url ? (
                      <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                        <BookOpen className="w-5 h-5 text-muted-foreground/70 mb-1" />
                        <span className="text-[11px] leading-tight font-medium text-foreground line-clamp-3">{b.title}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-foreground mt-1.5 line-clamp-1">{b.title}</p>
                  {b.author && <p className="text-[11px] text-muted-foreground line-clamp-1">{b.author}</p>}
                  {b.progress > 0 && (
                    <div className="mt-1 h-1 rounded-full bg-border overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${b.progress}%` }} />
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => handleDelete(b)}
                  className="absolute top-1 right-1 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove book"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}