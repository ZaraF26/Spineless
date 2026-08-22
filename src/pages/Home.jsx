import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Sparkles, Coffee, BookMarked } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";
import SectionTile from "@/components/SectionTile";
import SessionCard from "@/components/SessionCard";
import ReviewCard from "@/components/ReviewCard";
import EmptyState from "@/components/EmptyState";
import { notify } from "@/lib/readi";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [joiningId, setJoiningId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([
        base44.entities.ReadingSession.filter({ status: "active" }, "-created_date", 30),
        base44.entities.Review.list("-created_date", 8),
      ]);
      setSessions(s);
      setReviews(r);
    } catch (e) {
      setSessions([]); setReviews([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (user?.display_name || user?.username || user?.full_name || "").split(" ")[0] || "reader";

  const mine = (sessions || []).filter((s) => s.members?.includes(user?.id));
  const mineIds = new Set(mine.map((s) => s.id));
  const publicSessions = (sessions || []).filter((s) => s.is_public);
  const discover = publicSessions.filter((s) => !mineIds.has(s.id)).slice(0, 10);
  const currentlyReading = publicSessions.slice(0, 10);

  const join = async (session) => {
    setJoiningId(session.id);
    try {
      await base44.functions.invoke("sessionMembership", { sessionId: session.id, action: "join" });
      toast({ title: "You're reading along 📖" });
      load();
    } catch (e) {
      toast({ title: "Couldn't join", description: e.message, variant: "destructive" });
    } finally { setJoiningId(null); }
  };

  const loading = sessions === null;

  return (
    <div>
      <PageHeader title={`${greeting}, ${firstName}`} subtitle="What's happening in your reading corner?" />

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-8 pb-4">
          {/* Currently Reading */}
          <section>
            <div className="px-3 mb-3"><SectionTile icon={Coffee} title="Currently reading" tone="primary" /></div>
            {currentlyReading.length === 0 ? (
              <div className="px-5">
                <p className="text-sm text-muted-foreground">No one is reading right now. Be the first to start a session.</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
                {currentlyReading.map((s) => (
                  <SessionCard key={s.id} session={s} joined={mineIds.has(s.id)} onJoin={() => join(s)} joining={joiningId === s.id} />
                ))}
              </div>
            )}
          </section>

          {/* Reading With Friends */}
          <section>
            <div className="px-3 mb-3"><SectionTile icon={BookMarked} title="Reading with you" tone="accent" /></div>
            {mine.length === 0 ? (
              <div className="px-5">
                <p className="text-sm text-muted-foreground">You haven't joined any reading circles yet.</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
                {mine.map((s) => (
                  <SessionCard key={s.id} session={s} joined={true} />
                ))}
              </div>
            )}
          </section>

          {/* Find Your Next Read */}
          <section>
            <div className="px-3 mb-3"><SectionTile icon={Sparkles} title="Find your next read" tone="primary" /></div>
            {discover.length === 0 ? (
              <div className="px-5">
                <p className="text-sm text-muted-foreground">You're caught up on everything. Try searching for a book.</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
                {discover.map((s) => (
                  <SessionCard key={s.id} session={s} joined={false} onJoin={() => join(s)} joining={joiningId === s.id} />
                ))}
              </div>
            )}
          </section>

          {/* Recently Finished */}
          <section>
            <div className="px-3 mb-3"><SectionTile icon={BookOpen} title="Recently finished" tone="secondary" /></div>
            {(!reviews || reviews.length === 0) ? (
              <div className="px-5">
                <p className="text-sm text-muted-foreground">No reviews yet. Finish a book to share your thoughts.</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
                {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}