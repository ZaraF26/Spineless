import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Settings, BookOpen, Users, BookMarked, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Avatar from "@/components/Avatar";
import BookCover from "@/components/BookCover";
import EmptyState from "@/components/EmptyState";
import StarRating from "@/components/StarRating";
import { formatDate } from "@/lib/readi";

export default function Profile() {
  const { user } = useAuth();
  const [books, setBooks] = useState(null);
  const [sessions, setSessions] = useState(null);

  const load = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([
        base44.entities.UserBook.filter({}, "-updated_date", 100),
        base44.entities.ReadingSession.filter({ status: "active" }, "-created_date", 50),
      ]);
      setBooks(b);
      setSessions(s.filter((x) => x.members?.includes(user.id)));
    } catch { setBooks([]); setSessions([]); }
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  if (books === null) return <div className="flex justify-center py-24"><div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;

  const reading = books.filter((b) => b.status === "reading");
  const completed = books.filter((b) => b.status === "completed");
  const yearCount = completed.filter((b) => b.completed_date && new Date(b.completed_date).getFullYear() === new Date().getFullYear()).length;
  const avgRating = completed.length ? (completed.reduce((s, b) => s + (b.rating || 0), 0) / completed.length).toFixed(1) : "—";

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-secondary/50 to-background px-5 pt-6 pb-5">
        <div className="flex justify-end mb-3">
          <Link to="/settings" className="w-9 h-9 rounded-full flex items-center justify-center bg-card/70 hover:bg-card">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
        <div className="flex flex-col items-center text-center">
          <Avatar user={user} size={88} className="mb-3" />
          <h1 className="font-heading text-2xl font-semibold">{user.display_name || user.username}</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.bio && <p className="text-sm text-foreground/80 mt-2 max-w-xs leading-relaxed">{user.bio}</p>}
          {user.favourite_genres?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {user.favourite_genres.slice(0, 5).map((g) => (
                <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{g}</span>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-5">
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="font-heading text-xl font-semibold">{yearCount}</p>
            <p className="text-xs text-muted-foreground">read this year</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="font-heading text-xl font-semibold">{avgRating}</p>
            <p className="text-xs text-muted-foreground">avg rating</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="font-heading text-xl font-semibold">{reading.length}</p>
            <p className="text-xs text-muted-foreground">reading</p>
          </div>
        </div>
      </div>

      {/* Currently Reading */}
      <section className="px-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Currently reading</h2>
        </div>
        {reading.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your reading nook is looking a little empty.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {reading.map((b) => (
              <Link key={b.id} to={b.session_id ? `/session/${b.session_id}` : "#"} className="w-24 shrink-0">
                <BookCover book={b} className="w-24 h-32 rounded-lg mb-1.5" />
                <p className="text-xs font-medium line-clamp-2">{b.book_title}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Reading With */}
      <section className="px-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-accent-foreground" />
          <h2 className="font-heading text-lg font-semibold">Reading with</h2>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't joined any reading circles.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {sessions.map((s) => (
              <Link key={s.id} to={`/session/${s.id}`} className="w-24 shrink-0">
                <BookCover book={s} className="w-24 h-32 rounded-lg mb-1.5" />
                <p className="text-xs font-medium line-clamp-2">{s.book_title}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Books Read */}
      <section className="px-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <BookMarked className="w-4 h-4 text-secondary-foreground" />
          <h2 className="font-heading text-lg font-semibold">Books read</h2>
        </div>
        {completed.length === 0 ? (
          <EmptyState title="Your bookshelf is waiting" message="Finish a book to start your collection." />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {completed.map((b) => (
              <div key={b.id} className="text-center">
                <BookCover book={b} className="w-full aspect-[3/4] rounded-lg mb-1.5" />
                <p className="text-xs font-medium line-clamp-2 leading-tight">{b.book_title}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(b.completed_date)}</p>
                {b.rating > 0 && <StarRating value={b.rating} readOnly size={11} />}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}