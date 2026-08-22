import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Search, Camera, ChevronLeft, Check, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import BookCover from "@/components/BookCover";
import { notify } from "@/lib/readi";

export default function CreateSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const prebook = location.state?.book;

  const [step, setStep] = useState(prebook ? 1 : 0);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [book, setBook] = useState(prebook || null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [settings, setSettings] = useState({
    start_date: new Date().toISOString().slice(0, 10),
    planned_finish_date: "",
    is_public: true,
    description: "",
  });
  const [bookFile, setBookFile] = useState(null);
  const [bookFileType, setBookFileType] = useState("epub");

  const doSearch = async (q) => {
    if (!q.trim()) { setResults(null); return; }
    setSearching(true);
    try {
      const res = await base44.functions.invoke("searchBooks", { query: q });
      setResults(res.data?.books || []);
    } catch (e) {
      toast({ title: "Search failed", description: e.message, variant: "destructive" });
    } finally { setSearching(false); }
  };

  const handleCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBook((b) => ({ ...b, cover_url: file_url }));
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally { setCoverUploading(false); }
  };

  const handleBookFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
    const isEpub = /\.epub$/i.test(file.name) || file.type === "application/epub+zip";
    if (!isPdf && !isEpub) {
      toast({ title: "Choose an EPUB or PDF file", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setBookFile(file);
    setBookFileType(isPdf ? "pdf" : "epub");
    e.target.value = "";
  };

  const create = async () => {
    if (!book?.title) { toast({ title: "Add a book title", variant: "destructive" }); return; }
    setCreating(true);
    try {
      // Ensure a Book record exists
      let bookId;
      const existing = book.external_id
        ? await base44.entities.Book.filter({ external_id: book.external_id }, null, 1)
        : [];
      if (existing && existing.length > 0) {
        bookId = existing[0].id;
      } else {
        const created = await base44.entities.Book.create({
          title: book.title, author: book.author || "", cover_url: book.cover_url || "",
          description: book.description || "", isbn: book.isbn || "", external_id: book.external_id || "",
          publication_date: book.publication_date || "", genres: book.genres || [],
          page_count: book.page_count || 0, source: book.source || "manual"
        });
        bookId = created.id;
      }

      let bookFileUrl = "";
      if (bookFile) {
        try {
          const up = await base44.integrations.Core.UploadFile({ file: bookFile });
          bookFileUrl = up.file_url;
        } catch {
          toast({ title: "Book file upload failed", variant: "destructive" });
        }
      }

      const member_profiles = [{
        id: user.id, name: user.display_name || user.username, username: user.username, avatar: user.profile_picture
      }];
      const session = await base44.entities.ReadingSession.create({
        book_id: bookId,
        book_title: book.title, book_author: book.author || "", book_cover: book.cover_url || "",
        book_description: book.description || "",
        start_date: settings.start_date, planned_finish_date: settings.planned_finish_date || null,
        is_public: settings.is_public, description: settings.description,
        status: "active", members: [user.id], member_count: 1, member_profiles,
        creator_name: user.display_name || user.username,
        creator_username: user.username, creator_avatar: user.profile_picture,
        book_file_url: bookFileUrl, book_file_type: bookFileType
      });

      await base44.entities.UserBook.create({
        book_id: bookId, book_title: book.title, book_author: book.author || "",
        book_cover: book.cover_url || "", session_id: session.id, status: "reading",
        started_date: settings.start_date
      });

      if (bookFileUrl) {
        try {
          await base44.entities.UserEpub.create({
            title: book.title, author: book.author || "", cover_url: book.cover_url || "",
            file_url: bookFileUrl, file_type: bookFileType, session_id: session.id, progress: 0
          });
        } catch { /* best-effort */ }
      }

      toast({ title: "Your little reading circle is ready ✨" });
      navigate(`/session/${session.id}`, { replace: true });
    } catch (e) {
      toast({ title: "Couldn't create session", description: e.message, variant: "destructive" });
    } finally { setCreating(false); }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-2">
        <button onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary/60">
          {step > 0 ? <ChevronLeft className="w-5 h-5" /> : <span className="text-sm">Cancel</span>}
        </button>
        <div className="flex gap-1.5 ml-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary" : "w-1.5 bg-border"}`} />
          ))}
        </div>
      </div>

      {/* Step 0: pick a book */}
      {step === 0 && (
        <div className="px-5 pt-2">
          <h1 className="font-heading text-2xl font-semibold mb-1">Start reading something</h1>
          <p className="text-sm text-muted-foreground mb-4">Search for a book, or add one manually.</p>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search books…" value={query} onChange={(e) => { setQuery(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && doSearch(query)} className="pl-10 h-11" />
          </div>
          {searching && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
          {results && !searching && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {results.map((b) => (
                <button key={b.external_id} onClick={() => { setBook(b); setStep(1); }}
                  className="text-left rounded-2xl bg-card border border-border p-3 hover:border-primary/40">
                  <BookCover book={b} className="w-full aspect-[3/4] rounded-lg mb-2" />
                  <h3 className="text-sm font-semibold line-clamp-2">{b.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{b.author}</p>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => { setBook({ title: "", author: "", cover_url: "", description: "", source: "manual" }); setStep(1); }}
            className="w-full rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground">
            + Add a book manually
          </button>
        </div>
      )}

      {/* Step 1: confirm details */}
      {step === 1 && book && (
        <div className="px-5 pt-2 pb-24">
          <h1 className="font-heading text-2xl font-semibold mb-1">Confirm the book</h1>
          <p className="text-sm text-muted-foreground mb-4">Edit any details that aren't quite right.</p>
          <div className="flex gap-4 mb-5">
            <div className="relative">
              <BookCover book={book} className="w-24 h-32 rounded-lg" />
              <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md">
                {coverUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleCover} />
              </label>
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input value={book.title || ""} onChange={(e) => setBook({ ...book, title: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Author</Label>
                <Input value={book.author || ""} onChange={(e) => setBook({ ...book, author: e.target.value })} className="h-9" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5 mb-4">
            <Label className="text-xs">Description</Label>
            <Textarea rows={4} value={book.description || ""} onChange={(e) => setBook({ ...book, description: e.target.value })} />
          </div>
          <Button onClick={() => setStep(2)} className="w-full h-11" disabled={!book.title?.trim()}>
            Continue
          </Button>
        </div>
      )}

      {/* Step 2: settings */}
      {step === 2 && book && (
        <div className="px-5 pt-2 pb-24">
          <h1 className="font-heading text-2xl font-semibold mb-1">Set up your circle</h1>
          <p className="text-sm text-muted-foreground mb-4">When are you starting, and who can join?</p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={settings.start_date} onChange={(e) => setSettings({ ...settings, start_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Planned finish date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="date" value={settings.planned_finish_date} onChange={(e) => setSettings({ ...settings, planned_finish_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>A note for readers <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea rows={3} placeholder="What are you hoping to get out of this read?" value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} />
            </div>
            <div>
              <Label>Book file <span className="text-muted-foreground font-normal">(optional — EPUB or PDF)</span></Label>
              <p className="text-xs text-muted-foreground mb-2">Upload it so everyone in the circle can read along from their library.</p>
              <label className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border-2 border-dashed border-border bg-card text-sm font-medium cursor-pointer hover:border-primary/40 hover:text-primary transition-colors">
                <Upload className="w-4 h-4" />
                {bookFile ? <span className="truncate max-w-[60%]">{bookFile.name} · {bookFileType.toUpperCase()}</span> : "Choose EPUB or PDF"}
                <input type="file" accept=".epub,.pdf,application/epub+zip,application/pdf" onChange={handleBookFile} className="hidden" />
              </label>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="font-medium text-sm">Public reading circle</p>
                <p className="text-xs text-muted-foreground">Others can discover and join this read.</p>
              </div>
              <Switch checked={settings.is_public} onCheckedChange={(v) => setSettings({ ...settings, is_public: v })} />
            </div>
          </div>
          <Button onClick={create} disabled={creating} className="w-full h-11 mt-5">
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create reading circle
          </Button>
        </div>
      )}
    </div>
  );
}