import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StarRating from "@/components/StarRating";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { REVIEW_TAGS } from "@/lib/readi";
import { Loader2 } from "lucide-react";

export default function ReviewDialog({ open, onOpenChange, userBook, onDone }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(userBook?.rating || 0);
  const [text, setText] = useState("");
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open) { setRating(userBook?.rating || 0); setText(""); setTags([]); }
  }, [open, userBook]);

  const toggleTag = (t) => setTags((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t]);

  const submit = async () => {
    setSaving(true);
    try {
      const review = await base44.entities.Review.create({
        book_id: userBook.book_id, book_title: userBook.book_title, book_author: userBook.book_author,
        book_cover: userBook.book_cover, rating, text: text.trim(), tags,
        reviewer_name: user.display_name || user.username,
        reviewer_username: user.username, reviewer_avatar: user.profile_picture
      });
      await base44.entities.UserBook.update(userBook.id, {
        status: "completed", completed_date: new Date().toISOString().slice(0, 10), rating, review_id: review.id
      });
      toast({ title: "Added to your bookshelf 📚" });
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast({ title: "Couldn't save review", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>You finished {userBook?.book_title}</DialogTitle>
          <DialogDescription>What did you think? Your review joins your bookshelf.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Your rating</Label>
            <StarRating value={rating} onChange={setRating} size={28} />
          </div>
          <div>
            <Label className="mb-2 block">Your review</Label>
            <Textarea rows={4} placeholder="Share your thoughts…" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((t) => (
                <button key={t} onClick={() => toggleTag(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    tags.includes(t) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
                  }`}>{t}</button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Save to bookshelf
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}