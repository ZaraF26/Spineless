import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import BookCover from "@/components/BookCover";
import SessionCard from "@/components/SessionCard";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { notify } from "@/lib/readi";

export default function Discover() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [joiningId, setJoiningId] = useState(null);

  const loadSessions = useCallback(async () => {
    try {
      const s = await base44.entities.ReadingSession.filter({ status: "active", is_public: true }, "-created_date", 30);
      setSessions(s);
    } catch { setSessions([]); }
  }, []);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const doSearch = async (q) => {
    if (!q.trim()) { setResults(null); return; }
    setSearching(true);
    try {
      const res = await base44.functions.invoke("searchBooks", { query: q });
      setResults(res.data?.books || []);
    } catch (e) {
      toast({ title: "Search failed", description: e.message, variant: "destructive" });
      setResults([]);
    } finally { setSearching(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 450);
    return () => clearTimeout(t);
  }, [query]);

  const join = async (session) => {
    setJoiningId(session.id);
    try {
      await base44.functions.invoke("sessionMembership", { sessionId: session.id, action: "join" });
      toast({ title: "You're reading along 📖" });
      loadSessions();
    } catch (e) {
      toast({ title: "Couldn't join", description: e.message, variant: "destructive" });
    } finally { setJoiningId(null); }
  };

  const mineIds = new Set((sessions || []).filter((s) => s.members?.includes(user?.id)).map((s) => s.id));

  return (
    <div>
      <div className="px-5 pt-6 pb-3 sticky top-0 bg-background/90 backdrop-blur-md z-20">
        <h1 className="font-heading text-2xl font-semibold mb-3">Discover</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for a book or author…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>

      {query.trim() ? (
        <section className="px-5 pt-2">
          <h2 className="font-heading text-base font-semibold mb-3 flex items-center gap-2">
            {searching && <Loader2 className="w-4 h-4 animate-spin" />} Book results
          </h2>
          {results === null ? null : results.length === 0 ? (
            <EmptyState title="No books found" message="Try a different title, or add the book manually." />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {results.map((b) => (
                <button key={b.external_id || b.isbn} onClick={() => navigate("/create-session", { state: { book: b } })}
                  className="text-left rounded-2xl bg-card border border-border p-3 hover:border-primary/40 transition-colors">
                  <BookCover book={b} className="w-full aspect-[3/4] rounded-lg mb-2" />
                  <h3 className="text-sm font-semibold leading-tight line-clamp-2">{b.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{b.author}</p>
                </button>
              ))}
            </div>
          )}
          <div className="mt-4">
            <button onClick={() => navigate("/create-session", { state: { book: null } })}
              className="text-sm text-primary font-medium hover:underline">
              Can't find it? Add a book manually →
            </button>
          </div>
        </section>
      ) : (
        <section className="px-5 pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="font-heading text-lg font-semibold">Open reading circles</h2>
          </div>
          {sessions === null ? (
            <div className="flex justify-center py-10"><div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
          ) : sessions.length === 0 ? (
            <EmptyState title="No open circles yet" message="Start one and invite others to read along." />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sessions.map((s) => (
                <SessionCard key={s.id} session={s} joined={mineIds.has(s.id)} onJoin={() => join(s)} joining={joiningId === s.id} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}