import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { GENRES, PREFERENCES, GOALS } from "@/lib/readi";
import { Loader2, Camera, Check } from "lucide-react";

const STEPS = ["profile", "genres", "preferences", "goals"];

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-card text-foreground border-border hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

export default function Onboarding() {
  const { user, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || "",
    display_name: user?.display_name || user?.full_name || "",
    bio: user?.bio || "",
    profile_picture: user?.profile_picture || "",
    favourite_genres: user?.favourite_genres || [],
    reading_preferences: user?.reading_preferences || [],
    goals: user?.goals || [],
  });

  if (!user) return <Navigate to="/login" replace />;

  const toggle = (key, val) => {
    setForm((f) => {
      const arr = f[key] || [];
      return {
        ...f,
        [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });
  };

  const handlePicture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, profile_picture: file_url }));
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      const username = form.username.trim().replace(/^@/, "");
      if (!username) {
        setStep(0);
        toast({ title: "Please choose a username", variant: "destructive" });
        setSaving(false);
        return;
      }
      await base44.auth.updateMe({
        username,
        display_name: form.display_name.trim() || username,
        bio: form.bio,
        profile_picture: form.profile_picture,
        favourite_genres: form.favourite_genres,
        reading_preferences: form.reading_preferences,
        goals: form.goals,
        onboarded: true,
      });
      await checkUserAuth();
      toast({ title: "Welcome to your reading nook 📖" });
      navigate("/home", { replace: true });
    } catch (e) {
      toast({ title: "Could not save profile", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish());
  const skipToEnd = () => finish();

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-6 py-8 flex flex-col">
      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors ${i <= step ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-5 flex-1">
          <div>
            <h1 className="font-heading text-3xl text-foreground mb-1">Create your profile</h1>
            <p className="text-muted-foreground text-sm">Let others recognise you in the reading corner.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
                {form.profile_picture ? (
                  <img src={form.profile_picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePicture} />
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="reader123" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <p className="text-xs text-muted-foreground">This is your unique handle on Readi.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input id="display_name" placeholder="Sarah" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Short bio <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea id="bio" placeholder="A little about you and your reading..." rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5 flex-1">
          <div>
            <h1 className="font-heading text-3xl text-foreground mb-1">Your reading taste</h1>
            <p className="text-muted-foreground text-sm">What genres do you love? Pick as many as you like.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <Chip key={g} active={form.favourite_genres.includes(g)} onClick={() => toggle("favourite_genres", g)}>{g}</Chip>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 flex-1">
          <div>
            <h1 className="font-heading text-3xl text-foreground mb-1">What kind of reader are you?</h1>
            <p className="text-muted-foreground text-sm">This helps us understand your rhythm.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PREFERENCES.map((p) => (
              <Chip key={p} active={form.reading_preferences.includes(p)} onClick={() => toggle("reading_preferences", p)}>{p}</Chip>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 flex-1">
          <div>
            <h1 className="font-heading text-3xl text-foreground mb-1">What are you hoping for?</h1>
            <p className="text-muted-foreground text-sm">Why have you joined the reading corner?</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <Chip key={g} active={form.goals.includes(g)} onClick={() => toggle("goals", g)}>{g}</Chip>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-6 space-y-2">
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="flex-1">Back</Button>
          )}
          <Button onClick={next} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {step === STEPS.length - 1 ? "Finish" : "Continue"}
          </Button>
        </div>
        <button onClick={skipToEnd} className="w-full text-center text-sm text-muted-foreground py-2 hover:text-foreground">
          Skip for now
        </button>
      </div>
    </div>
  );
}