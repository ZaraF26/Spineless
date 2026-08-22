import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Sparkles, BookOpen, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Avatar from "@/components/Avatar";
import BookCover from "@/components/BookCover";
import EmptyState from "@/components/EmptyState";
import { timeAgo } from "@/lib/readi";

export default function Activity() {
  const { user } = useAuth();
  const [feed, setFeed] = useState(null);

  const load = useCallback(async () => {
    try {
      const follows = await base44.entities.Follow.filter({ created_by_id: user.id }, null, 200);
      const followingIds = new Set(follows.map((f) => f.following_id));
      const [sessions, reviews] = await Promise.all([
        base44.entities.ReadingSession.filter({ status: "active" }, "-created_date", 50),
        base44.entities.Review.list("-created_date", 30),
      ]);
      // When not following anyone yet, show the wider community activity.
      const scope = (x) => followingIds.size === 0 || followingIds.has(x.created_by_id);
      const items = [];
      sessions.filter((s) => scope(s)).forEach((s) => {
        items.push({
          id: s.id, type: "started", actor: { name: s.creator_name, avatar: s.creator_avatar, username: s.creator_username },
          text: `started reading`, book: s.book_title, cover: s.book_cover, link: `/session/${s.id}`, date: s.created_date
        });
      });
      reviews.filter((r) => scope(r)).forEach((r) => {
        items.push({
          id: r.id, type: "finished", actor: { name: r.reviewer_name, avatar: r.reviewer_avatar, username: r.reviewer_username },
          text: r.rating ? `finished and rated ${r.rating}★` : "finished", book: r.book_title, cover: r.book_cover, link: "#", date: r.created_date
        });
      });
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
      setFeed(items);
    } catch { setFeed([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="pb-4">
      <div className="px-5 pt-6 pb-2">
        <h1 className="font-heading text-2xl font-semibold">Activity</h1>
        <p className="text-sm text-muted-foreground">What your reading circle is up to.</p>
      </div>
      {feed === null ? (
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : feed.length === 0 ? (
        <EmptyState icon={Sparkles} title="No activity yet"
          message="Follow a few readers to see what they're reading and finishing here."
          action={<Link to="/discover" className="text-primary text-sm font-medium hover:underline">Discover readers →</Link>} />
      ) : (
        <div className="px-5 mt-4 space-y-3">
          {feed.map((item) => (
            <Link key={item.id + item.type} to={item.link} className="flex gap-3 rounded-2xl bg-card border border-border p-3 hover:border-primary/30 transition-colors">
              <Avatar user={{ profile_picture: item.actor.avatar, display_name: item.actor.name, username: item.actor.username }} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm"><span className="font-medium">{item.actor.name}</span> <span className="text-muted-foreground">{item.text}</span></p>
                <p className="text-sm font-heading font-medium text-foreground/90 line-clamp-1">{item.book}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(item.date)}</p>
              </div>
              {item.cover && <BookCover book={{ cover_url: item.cover }} className="w-10 h-14 rounded shrink-0" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}