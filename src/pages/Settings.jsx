import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, LogOut, ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Avatar from "@/components/Avatar";
import { GENRES, PREFERENCES, GOALS } from "@/lib/readi";

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
      }`}>{children}</button>
  );
}

export default function Settings() {
  const { user, logout, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || "",
    display_name: user?.display_name || "",
    bio: user?.bio || "",
    profile_picture: user?.profile_picture || "",
    favourite_genres: user?.favourite_genres || [],
    reading_preferences: user?.reading_preferences || [],
    goals: user?.goals || [],
    is_public: user?.is_public !== false,
    allow_follow: user?.allow_follow || "everyone",
    show_activity: user?.show_activity !== false,
    notify_joins: user?.notify_joins !== false,
    notify_comments: user?.notify_comments !== false,
    notify_follows: user?.notify_follows !== false,
  });

  const toggle = (key, val) => setForm((f) => {
    const arr = f[key] || [];
    return { ...f, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
  });

  const handlePicture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, profile_picture: file_url }));
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        username: form.username.trim().replace(/^@/, ""),
        display_name: form.display_name.trim(),
        bio: form.bio,
        profile_picture: form.profile_picture,
        favourite_genres: form.favourite_genres,
        reading_preferences: form.reading_preferences,
        goals: form.goals,
        is_public: form.is_public,
        allow_follow: form.allow_follow,
        show_activity: form.show_activity,
        notify_joins: form.notify_joins,
        notify_comments: form.notify_comments,
        notify_follows: form.notify_follows,
      });
      await checkUserAuth();
      toast({ title: "Settings saved" });
    } catch (e) {
      toast({ title: "Couldn't save", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const requestDeletion = async () => {
    if (!confirm("Request account deletion? A moderator will review and remove your account and data.")) return;
    try {
      await base44.auth.updateMe({ deletion_requested: true });
      toast({ title: "Deletion requested", description: "Our team will be in touch." });
    } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-2 px-4 pt-5 pb-2">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary/60">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading text-xl font-semibold">Settings</h1>
      </div>

      <div className="px-5 space-y-7 mt-2">
        {/* Profile */}
        <section>
          <h2 className="font-heading text-base font-semibold mb-3">Profile</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <Avatar user={{ ...user, ...form }} size={64} />
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePicture} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Tap the camera to change your picture.</p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Display name</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Bio</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          </div>
        </section>

        {/* Taste */}
        <section>
          <h2 className="font-heading text-base font-semibold mb-2">Favourite genres</h2>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => <Chip key={g} active={form.favourite_genres.includes(g)} onClick={() => toggle("favourite_genres", g)}>{g}</Chip>)}
          </div>
        </section>
        <section>
          <h2 className="font-heading text-base font-semibold mb-2">Reading preferences</h2>
          <div className="flex flex-wrap gap-2">
            {PREFERENCES.map((p) => <Chip key={p} active={form.reading_preferences.includes(p)} onClick={() => toggle("reading_preferences", p)}>{p}</Chip>)}
          </div>
        </section>
        <section>
          <h2 className="font-heading text-base font-semibold mb-2">Goals</h2>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => <Chip key={g} active={form.goals.includes(g)} onClick={() => toggle("goals", g)}>{g}</Chip>)}
          </div>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="font-heading text-base font-semibold mb-3">Privacy</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
              <div><p className="text-sm font-medium">Public profile</p><p className="text-xs text-muted-foreground">Others can view your profile.</p></div>
              <Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
              <div><p className="text-sm font-medium">Show reading activity</p><p className="text-xs text-muted-foreground">Share what you're reading.</p></div>
              <Switch checked={form.show_activity} onCheckedChange={(v) => setForm({ ...form, show_activity: v })} />
            </div>
            <div className="rounded-xl border border-border p-3.5">
              <p className="text-sm font-medium mb-2">Who can follow you</p>
              <div className="flex gap-2">
                {["everyone", "approval", "off"].map((o) => (
                  <button key={o} onClick={() => setForm({ ...form, allow_follow: o })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${form.allow_follow === o ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>{o}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="font-heading text-base font-semibold mb-3">Notifications</h2>
          <div className="space-y-2">
            {[["notify_joins", "When someone joins your read"], ["notify_comments", "When someone comments on your chapter"], ["notify_follows", "When someone follows you"]].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-xl border border-border p-3.5">
                <p className="text-sm font-medium">{label}</p>
                <Switch checked={form[key]} onCheckedChange={(v) => setForm({ ...form, [key]: v })} />
              </div>
            ))}
          </div>
        </section>

        <Button onClick={save} disabled={saving} className="w-full h-11">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save settings
        </Button>

        <div className="space-y-2 pt-2 border-t border-border">
          <Button variant="outline" className="w-full" onClick={() => logout()}><LogOut className="w-4 h-4 mr-2" /> Log out</Button>
          <Button variant="ghost" className="w-full text-destructive" onClick={requestDeletion}>Request account deletion</Button>
        </div>
      </div>
    </div>
  );
}