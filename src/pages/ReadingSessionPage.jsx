import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Users, Calendar, ChevronLeft, Plus, Lock, BookOpen, CheckCircle2, Circle, PlayCircle, LogOut, X, Loader2, Settings2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import BookCover from "@/components/BookCover";
import Avatar from "@/components/Avatar";
import ChapterDiscussion from "@/components/ChapterDiscussion";
import EmptyState from "@/components/EmptyState";
import { formatDate, notify } from "@/lib/readi";

export default function ReadingSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState(null);
  const [chapters, setChapters] = useState(null);
  const [userBook, setUserBook] = useState(null);
  const [openChapter, setOpenChapter] = useState(null);
  const [revealedChapters, setRevealedChapters] = useState(new Set());
  const [adding, setAdding] = useState(false);
  const [newCh, setNewCh] = useState({ number: "", title: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ start_date: "", planned_finish_date: "", is_public: true });
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await base44.entities.ReadingSession.get(id);
      setSession(s);
      setEditForm({ start_date: s.start_date || "", planned_finish_date: s.planned_finish_date || "", is_public: s.is_public });
      const ch = await base44.entities.Chapter.filter({ session_id: id }, "number", 100);
      setChapters(ch);
      const ub = await base44.entities.UserBook.filter({ session_id: id, created_by_id: user.id }, null, 1);
      setUserBook(ub[0] || null);
    } catch (e) {
      setSession(false);
    }
  }, [id, user.id]);

  useEffect(() => { load(); }, [load]);

  if (session === null) {
    return <div className="flex justify-center py-24"><div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }
  if (session === false) {
    return <EmptyState title="Reading circle not found" message="This session may have been removed." action={<Button onClick={() => navigate("/home")}>Back home</Button>} />;
  }

  const isMember = session.members?.includes(user.id);
  const isCreator = session.created_by_id === user.id;
  const currentChapter = userBook?.current_chapter || 0;

  const join = async () => {
    setActing(true);
    try {
      await base44.functions.invoke("sessionMembership", { sessionId: session.id, action: "join" });
      toast({ title: "You're reading along 📖" });
      load();
    } catch (e) { toast({ title: "Couldn't join", description: e.message, variant: "destructive" }); }
    finally { setActing(false); }
  };

  const leave = async () => {
    setActing(true);
    try {
      await base44.functions.invoke("sessionMembership", { sessionId: session.id, action: "leave" });
      toast({ title: "You left the reading circle" });
      navigate("/home");
    } catch (e) { toast({ title: "Couldn't leave", description: e.message, variant: "destructive" }); }
    finally { setActing(false); }
  };

  const removeMember = async (mid) => {
    try {
      const members = (session.members || []).filter((m) => m !== mid);
      const member_profiles = (session.member_profiles || []).filter((m) => m.id !== mid);
      await base44.entities.ReadingSession.update(session.id, { members, member_count: members.length, member_profiles });
      toast({ title: "Reader removed" });
      load();
    } catch (e) { toast({ title: "Couldn't remove", description: e.message, variant: "destructive" }); }
  };

  const endSession = async () => {
    await base44.entities.ReadingSession.update(session.id, { status: "ended" });
    toast({ title: "Reading circle ended" });
    load();
  };

  const addChapter = async () => {
    if (!newCh.title.trim() && !newCh.number) return;
    setActing(true);
    try {
      const num = newCh.number ? Number(newCh.number) : (chapters?.length || 0) + 1;
      await base44.entities.Chapter.create({
        session_id: session.id, number: num,
        title: newCh.title.trim() || `Chapter ${num}`, description: ""
      });
      setNewCh({ number: "", title: "" }); setAdding(false);
      load();
    } catch (e) { toast({ title: "Couldn't add chapter", description: e.message, variant: "destructive" }); }
    finally { setActing(false); }
  };

  const saveEdit = async () => {
    setActing(true);
    try {
      await base44.entities.ReadingSession.update(session.id, {
        start_date: editForm.start_date, planned_finish_date: editForm.planned_finish_date || null, is_public: editForm.is_public
      });
      setEditOpen(false); load();
      toast({ title: "Reading circle updated" });
    } catch (e) { toast({ title: "Couldn't save", description: e.message, variant: "destructive" }); }
    finally { setActing(false); }
  };

  const markChapter = async (ch, status) => {
    let newCurrent = currentChapter;
    if (status === "finished") newCurrent = ch.number;
    else if (status === "reading") newCurrent = ch.number - 1;
    else if (status === "not_started") newCurrent = Math.max(0, ch.number - 1);
    if (userBook) {
      await base44.entities.UserBook.update(userBook.id, { current_chapter: newCurrent });
    } else {
      const ub = await base44.entities.UserBook.create({
        book_id: session.book_id, book_title: session.book_title, book_author: session.book_author,
        book_cover: session.book_cover, session_id: session.id, status: "reading",
        started_date: session.start_date || new Date().toISOString().slice(0, 10), current_chapter: newCurrent
      });
      setUserBook(ub);
    }
    setUserBook((u) => ({ ...u, current_chapter: newCurrent }));
  };

  const chapterStatus = (ch) => {
    if (ch.number <= currentChapter) return "finished";
    if (ch.number === currentChapter + 1) return "reading";
    return "not_started";
  };

  const revealChapter = (num) => setRevealedChapters((s) => new Set(s).add(num));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 flex justify-between px-4 pt-5 z-10">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {isCreator && (
            <button onClick={() => setEditOpen(true)} className="w-9 h-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-sm">
              <Settings2 className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="bg-gradient-to-b from-secondary/50 to-background px-5 pt-20 pb-6">
          <div className="flex gap-4">
            <BookCover book={session} className="w-28 h-40 rounded-xl shadow-md" />
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="font-heading text-xl font-semibold leading-tight">{session.book_title}</h1>
              <p className="text-sm text-muted-foreground">{session.book_author}</p>
              <div className="flex items-center gap-2 mt-3">
                <Avatar user={{ profile_picture: session.creator_avatar, display_name: session.creator_name, username: session.creator_username }} size={22} />
                <span className="text-xs text-muted-foreground">Led by {session.creator_name}</span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(session.start_date) || "—"}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{session.member_count} reading</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            {session.status === "ended" ? (
              <div className="rounded-xl bg-secondary/60 px-4 py-2 text-sm text-muted-foreground text-center">This reading circle has ended.</div>
            ) : isMember ? (
              <Button variant="outline" className="w-full h-10" onClick={leave} disabled={acting}>
                <LogOut className="w-4 h-4 mr-2" /> Leave reading circle
              </Button>
            ) : (
              <Button className="w-full h-10" onClick={join} disabled={acting}>Join reading</Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <Tabs defaultValue="about">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="readers">Readers</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4 space-y-4">
            {session.book_description && (
              <div>
                <h3 className="font-heading text-sm font-semibold mb-1.5">About this book</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{session.book_description}</p>
              </div>
            )}
            {session.description && (
              <div>
                <h3 className="font-heading text-sm font-semibold mb-1.5">A note from {session.creator_name}</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{session.description}</p>
              </div>
            )}
            <div className="rounded-xl bg-card border border-border p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Start date</span><span>{formatDate(session.start_date) || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Planned finish</span><span>{formatDate(session.planned_finish_date) || "Open-ended"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Visibility</span><span>{session.is_public ? "Public" : "Private"}</span></div>
            </div>
          </TabsContent>

          <TabsContent value="readers" className="mt-4">
            <div className="space-y-2">
              {(session.member_profiles || []).map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl bg-card border border-border p-3">
                  <Avatar user={{ profile_picture: m.avatar, display_name: m.name, username: m.username }} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">@{m.username}</p>
                  </div>
                  {m.id === session.created_by_id && <span className="text-xs text-primary font-medium">Host</span>}
                  {isCreator && m.id !== user.id && (
                    <button onClick={() => removeMember(m.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chapters" className="mt-4">
            {isCreator && session.status === "active" && (
              <div className="mb-4">
                {adding ? (
                  <div className="rounded-xl bg-card border border-border p-3 space-y-2">
                    <div className="flex gap-2">
                      <Input type="number" placeholder="#" className="w-16" value={newCh.number} onChange={(e) => setNewCh({ ...newCh, number: e.target.value })} />
                      <Input placeholder="Chapter title" value={newCh.title} onChange={(e) => setNewCh({ ...newCh, title: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
                      <Button size="sm" onClick={addChapter} disabled={acting}>Add chapter</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="w-full">
                    <Plus className="w-4 h-4 mr-1" /> Add a chapter
                  </Button>
                )}
              </div>
            )}

            {chapters === null ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : chapters.length === 0 ? (
              <EmptyState icon={BookOpen} title="No chapters yet" message={isCreator ? "Add chapters so readers can discuss as they go." : "The host hasn't added chapters yet."} />
            ) : (
              <div className="space-y-3">
                {chapters.map((ch) => {
                  const status = chapterStatus(ch);
                  const open = openChapter === ch.id;
                  const locked = ch.number > currentChapter + 1 && !revealedChapters.has(ch.number) && isMember;
                  return (
                    <div key={ch.id} className="rounded-2xl bg-card border border-border overflow-hidden">
                      <button onClick={() => setOpenChapter(open ? null : ch.id)} className="w-full flex items-center gap-3 p-3 text-left">
                        <div className="shrink-0">
                          {status === "finished" ? <CheckCircle2 className="w-5 h-5 text-accent-foreground" /> :
                           status === "reading" ? <PlayCircle className="w-5 h-5 text-primary" /> :
                           <Circle className="w-5 h-5 text-muted-foreground/40" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-tight">{ch.title || `Chapter ${ch.number}`}</p>
                          <p className="text-xs text-muted-foreground">Chapter {ch.number}</p>
                        </div>
                      </button>
                      {open && (
                        <div className="px-3 pb-3">
                          {isMember && (
                            <div className="flex gap-1.5 mb-3">
                              <Button size="sm" variant={status === "not_started" ? "default" : "outline"} onClick={() => markChapter(ch, "not_started")} className="h-7 text-xs">Not started</Button>
                              <Button size="sm" variant={status === "reading" ? "default" : "outline"} onClick={() => markChapter(ch, "reading")} className="h-7 text-xs">Reading</Button>
                              <Button size="sm" variant={status === "finished" ? "default" : "outline"} onClick={() => markChapter(ch, "finished")} className="h-7 text-xs">Finished</Button>
                            </div>
                          )}
                          {locked ? (
                            <div className="rounded-xl bg-secondary/50 border border-dashed border-border p-4 text-center">
                              <Lock className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground mb-2">You haven't reached this chapter yet. Discussions may contain spoilers.</p>
                              <Button size="sm" variant="ghost" onClick={() => revealChapter(ch.number)}>Show discussion anyway</Button>
                            </div>
                          ) : (
                            <ChapterDiscussion chapter={ch} session={session} userBook={userBook} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {isCreator && session.status === "active" && (
              <Button variant="ghost" size="sm" onClick={endSession} className="w-full mt-4 text-muted-foreground">End reading circle</Button>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit reading circle</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Planned finish date</Label>
              <Input type="date" value={editForm.planned_finish_date} onChange={(e) => setEditForm({ ...editForm, planned_finish_date: e.target.value })} />
            </div>
            <label className="flex items-center justify-between rounded-xl border border-border p-3">
              <span className="text-sm">Public</span>
              <input type="checkbox" checked={editForm.is_public} onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })} className="accent-primary" />
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={acting}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}