import React, { useEffect, useState, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { Shield, Users, Flag, BarChart3, Check, X, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/Avatar";
import { timeAgo } from "@/lib/readi";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState(null);
  const [reports, setReports] = useState(null);
  const [stats, setStats] = useState(null);
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    try {
      const [u, r, s, b, rv] = await Promise.all([
        base44.entities.User.list("-created_date", 100),
        base44.entities.Report.filter({ status: "open" }, "-created_date", 50),
        base44.entities.ReadingSession.list(null, 1),
        base44.entities.Book.list(null, 1),
        base44.entities.Review.list(null, 1),
      ]);
      setUsers(u); setReports(r);
      setStats({ users: u.length, sessions: s.length, books: b.length, reviews: rv.length });
    } catch { setUsers([]); setReports([]); setStats({}); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (user?.role !== "admin") return <Navigate to="/home" replace />;

  const toggleSuspend = async (u) => {
    setActing(u.id);
    try {
      await base44.entities.User.update(u.id, { suspended: !u.suspended });
      toast({ title: u.suspended ? "User reinstated" : "User suspended" });
      load();
    } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setActing(null); }
  };

  const resolveReport = async (r, remove) => {
    setActing(r.id);
    try {
      if (remove) {
        if (r.target_type === "comment") await base44.entities.Comment.delete(r.target_id);
        else if (r.target_type === "review") await base44.entities.Review.delete(r.target_id);
      }
      await base44.entities.Report.update(r.id, { status: remove ? "resolved" : "dismissed" });
      toast({ title: remove ? "Content removed" : "Report dismissed" });
      load();
    } catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setActing(null); }
  };

  const statCards = [
    { label: "Users", value: stats?.users ?? "—", icon: Users },
    { label: "Sessions", value: stats?.sessions ?? "—", icon: BarChart3 },
    { label: "Books", value: stats?.books ?? "—", icon: BarChart3 },
    { label: "Reviews", value: stats?.reviews ?? "—", icon: BarChart3 },
  ];

  return (
    <div className="pb-4">
      <div className="px-5 pt-6 pb-2 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <div>
          <h1 className="font-heading text-2xl font-semibold">Admin</h1>
          <p className="text-sm text-muted-foreground">Keeping the corner cosy.</p>
        </div>
      </div>

      <div className="px-5 mt-4">
        <Tabs defaultValue="stats">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {statCards.map((s) => (
                <div key={s.label} className="rounded-2xl bg-card border border-border p-4">
                  <p className="font-heading text-3xl font-semibold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-4 space-y-2">
            {users === null ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div> :
              users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl bg-card border border-border p-3">
                  <Avatar user={u} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{u.display_name || u.username} {u.id === user.id && <span className="text-xs text-muted-foreground">(you)</span>}</p>
                    <p className="text-xs text-muted-foreground">@{u.username} · {u.role}{u.suspended && " · suspended"}</p>
                  </div>
                  {u.id !== user.id && (
                    <Button size="sm" variant={u.suspended ? "outline" : "ghost"} onClick={() => toggleSuspend(u)} disabled={acting === u.id}>
                      {u.suspended ? "Reinstate" : "Suspend"}
                    </Button>
                  )}
                </div>
              ))}
          </TabsContent>

          <TabsContent value="reports" className="mt-4 space-y-2">
            {reports === null ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div> :
             reports.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No open reports. All cosy.</p> :
              reports.map((r) => (
                <div key={r.id} className="rounded-xl bg-card border border-border p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Flag className="w-4 h-4 text-destructive" />
                    <span className="text-xs font-medium uppercase text-muted-foreground">{r.target_type}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{timeAgo(r.created_date)}</span>
                  </div>
                  <p className="text-sm text-foreground/90">{r.reason}</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="destructive" onClick={() => resolveReport(r, true)} disabled={acting === r.id}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove content
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => resolveReport(r, false)} disabled={acting === r.id}>
                      <X className="w-3.5 h-3.5 mr-1" /> Dismiss
                    </Button>
                  </div>
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}