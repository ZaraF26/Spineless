import React, { useState, useEffect, useCallback } from "react";
import { Flag, Trash2, AlertTriangle, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "@/components/Avatar";
import ReportDialog from "@/components/ReportDialog";
import { timeAgo, maskProfanity, containsProfanity } from "@/lib/readi";

export default function ChapterDiscussion({ chapter, session, userBook, onProgress }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState(null);
  const [text, setText] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [posting, setPosting] = useState(false);
  const [revealed, setRevealed] = useState(new Set());
  const [reportTarget, setReportTarget] = useState(null);

  const load = useCallback(async () => {
    try {
      const c = await base44.entities.Comment.filter({ chapter_id: chapter.id }, "created_date", 200);
      setComments(c);
    } catch { setComments([]); }
  }, [chapter.id]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!text.trim()) return;
    if (containsProfanity(text)) {
      toast({ title: "Mind your language", description: "Please keep the reading corner kind.", variant: "destructive" });
      return;
    }
    setPosting(true);
    try {
      await base44.entities.Comment.create({
        chapter_id: chapter.id, session_id: session.id,
        text: text.trim(), is_spoiler: isSpoiler,
        author_name: user.display_name || user.username,
        author_username: user.username, author_avatar: user.profile_picture
      });
      // notify session creator if not self
      if (session.created_by_id && session.created_by_id !== user.id) {
        try {
          await base44.entities.Notification.create({
            user_id: session.created_by_id, type: "chapter_comment",
            text: `${user.display_name || user.username} commented on ${session.book_title} — ${chapter.title || `Chapter ${chapter.number}`}`,
            link: `/session/${session.id}`, actor_id: user.id, is_read: false
          });
        } catch {}
      }
      setText(""); setIsSpoiler(false);
      load();
    } catch (e) {
      toast({ title: "Couldn't post", description: e.message, variant: "destructive" });
    } finally { setPosting(false); }
  };

  const remove = async (id) => {
    try {
      await base44.entities.Comment.delete(id);
      setComments((cs) => cs.filter((c) => c.id !== id && c.parent_id !== id));
      toast({ title: "Comment removed" });
    } catch (e) {
      toast({ title: "Couldn't delete", description: e.message, variant: "destructive" });
    }
  };

  const toggleReveal = (id) => setRevealed((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const topLevel = (comments || []).filter((c) => !c.parent_id);
  const repliesOf = (id) => (comments || []).filter((c) => c.parent_id === id);

  return (
    <div>
      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">Chapter discussion — spoilers for this chapter may appear below.</p>
      </div>

      {/* New comment */}
      <div className="space-y-2 mb-5">
        <Textarea placeholder="Share your thoughts on this chapter…" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={isSpoiler} onChange={(e) => setIsSpoiler(e.target.checked)} className="accent-primary" />
            Mark as spoiler
          </label>
          <Button size="sm" onClick={submit} disabled={posting || !text.trim()}>
            {posting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            Post
          </Button>
        </div>
      </div>

      {/* Comments */}
      {comments === null ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Start the conversation.</p>
      ) : (
        <div className="space-y-4">
          {topLevel.map((c) => {
            const showSpoiler = !c.is_spoiler || revealed.has(c.id);
            const mine = c.created_by_id === user.id;
            return (
              <div key={c.id} className="space-y-2">
                <div className="flex gap-2.5">
                  <Avatar user={{ profile_picture: c.author_avatar, display_name: c.author_name, username: c.author_username }} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.author_name}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(c.created_date)}</span>
                    </div>
                    {showSpoiler ? (
                      <p className="text-sm text-foreground/85 mt-1 leading-relaxed whitespace-pre-wrap">{maskProfanity(c.text)}</p>
                    ) : (
                      <button onClick={() => toggleReveal(c.id)}
                        className="mt-1 block w-full text-left rounded-lg bg-secondary/70 border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">
                        🔒 This comment contains a spoiler — tap to reveal
                      </button>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <button onClick={() => setReportTarget(c.id)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Flag className="w-3 h-3" /> Report
                      </button>
                      {mine && (
                        <button onClick={() => remove(c.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {repliesOf(c.id).map((r) => (
                  <div key={r.id} className="flex gap-2.5 pl-10">
                    <Avatar user={{ profile_picture: r.author_avatar, display_name: r.author_name, username: r.author_username }} size={26} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{r.author_name}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(r.created_date)}</span>
                      </div>
                      <p className="text-sm text-foreground/85 mt-0.5 leading-relaxed whitespace-pre-wrap">{maskProfanity(r.text)}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <ReportDialog open={!!reportTarget} onOpenChange={setReportTarget} targetType="comment" targetId={reportTarget} />
    </div>
  );
}