import React from "react";
import { Link } from "react-router-dom";
import { Users, Calendar } from "lucide-react";
import BookCover from "@/components/BookCover";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { relativeDate } from "@/lib/readi";

export default function SessionCard({ session, joined, onJoin, joining }) {
  return (
    <div className="w-64 shrink-0 rounded-2xl bg-card border border-border p-3 shadow-sm flex gap-3">
      <Link to={`/session/${session.id}`} className="shrink-0">
        <BookCover book={session} className="w-20 h-28 rounded-lg shrink-0" />
      </Link>
      <div className="flex-1 min-w-0 flex flex-col">
        <Link to={`/session/${session.id}`} className="block">
          <h3 className="font-heading text-base font-semibold leading-tight line-clamp-2">{session.book_title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{session.book_author}</p>
        </Link>
        <div className="flex items-center gap-1.5 mt-2">
          <Avatar user={{ profile_picture: session.creator_avatar, display_name: session.creator_name, username: session.creator_username }} size={18} />
          <span className="text-xs text-muted-foreground truncate">{session.creator_name}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{relativeDate(session.start_date) || "soon"}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{session.member_count || (session.members?.length || 0)}</span>
        </div>
        <div className="mt-auto pt-2">
          {joined ? (
            <Link to={`/session/${session.id}`}>
              <Button variant="secondary" size="sm" className="w-full h-8 text-xs">Open</Button>
            </Link>
          ) : (
            <Button size="sm" className="w-full h-8 text-xs" onClick={onJoin} disabled={joining}>
              {joining ? "Joining…" : "Join reading"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}