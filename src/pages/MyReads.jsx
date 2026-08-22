import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Bookmark, CheckCircle2, CircleOff, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import BookCover from "@/components/BookCover";
import StarRating from "@/components/StarRating";
import EmptyState from "@/components/EmptyState";
import ReviewDialog from "@/components/ReviewDialog";
import { formatDate } from "@/lib/readi";
import ProfileAvatar from "@/components/ProfileAvatar";

const STATUSES = [
  { key: "reading", label: "Reading", icon: BookOpen },
  { key: "want_to_read", label: "Want to Read", icon: Bookmark },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
  { key: "abandoned", label: "Abandoned", icon: CircleOff },
];

export default function MyReads() {
  const { toast } = useToast();
  const [books, setBooks] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [moving, setMoving] = useState(null);

  const load = useCallback(async () => {
    try {
      const b = await base44.entities.UserBook.filter({}, "-updated_date", 200);
      setBooks(b);
    } catch { setBooks([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const move = async (book, status) => {
    setMoving(book.id);
    try {
      const patch = { status };
      if (status === "completed" && !book.completed_date) patch.completed_date = new Date().toISOString().slice(0, 10);
      if (status === "reading" && !book.started_date) patch.started_date = new Date().toISOString().slice(0, 10);
      await base44.entities.UserBook.update(book.id, patch);
      toast({ title: status === "completed" ? "Marked as finished 📚" : "Updated your shelf" });
      load();
    } catch (e) { toast({ title: "Couldn't update", description: e.message, variant: "destructive" }); }
    finally { setMoving(null); }
  };

  const byStatus = (s) => (books || []).filter((b) => b.status === s);

  const renderBook = (b) => (
    <div key={b.id} className="flex gap-3 rounded-2xl bg-card border border-border p-3">
      <BookCover book={b} className="w-16 h-24 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <Link to={b.session_id ? `/session/${b.session_id}` : "#"}>
          <h3 className="font-heading text-sm font-semibold leading-tight line-clamp-2">{b.book_title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{b.book_author}</p>
        </Link>
        {b.status === "completed" && (
          <div className="flex items-center gap-2 mt-1.5">
            {b.rating > 0 && <StarRating value={b.rating} readOnly size={12} />}
            <span className="text-xs text-muted-foreground">{formatDate(b.completed_date)}</span>
          </div>
        )}
        {b.status === "reading" && b.started_date && (
          <p className="text-xs text-muted-foreground mt-1">Started {formatDate(b.started_date)}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {b.status !== "reading" && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => move(b, "reading")} disabled={moving === b.id}>Reading</Button>
          )}
          {b.status !== "want_to_read" && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => move(b, "want_to_read")} disabled={moving === b.id}>Want</Button>
          )}
          {b.status === "reading" && (
            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => setReviewTarget(b)}>
              <Check className="w-3 h-3 mr-1" /> Finish
            </Button>
          )}
          {b.status !== "completed" && b.status !== "reading" && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setReviewTarget(b)}>Finish & review</Button>
          )}
          {b.status !== "abandoned" && (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => move(b, "abandoned")} disabled={moving === b.id}>Abandon</Button>
          )}
        </div>
      </div>
    </div>
  );

  if (books === null) return <div className="flex justify-center py-24"><div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="pb-4">
      <div className="px-5 pt-6 pb-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">My Reads</h1>
          <p className="text-sm text-muted-foreground">Your personal reading nook.</p>
        </div>
        <ProfileAvatar />
      </div>
      <div className="px-5">
        <Tabs defaultValue="reading">
          <TabsList className="w-full grid grid-cols-4 h-auto">
            {STATUSES.map((s) => <TabsTrigger key={s.key} value={s.key} className="text-xs py-2">{s.label}</TabsTrigger>)}
          </TabsList>
          {STATUSES.map((s) => (
            <TabsContent key={s.key} value={s.key} className="mt-4 space-y-3">
              {byStatus(s.key).length === 0 ? (
                <EmptyState icon={s.icon}
                  title={s.key === "reading" ? "Nothing in progress" : s.key === "completed" ? "Your bookshelf is waiting" : "Nothing here yet"}
                  message={s.key === "reading" ? "Start a book and invite someone to read along." : "Books you add will show up here."} />
              ) : byStatus(s.key).map(renderBook)}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <ReviewDialog open={!!reviewTarget} onOpenChange={setReviewTarget} userBook={reviewTarget} onDone={load} />
    </div>
  );
}