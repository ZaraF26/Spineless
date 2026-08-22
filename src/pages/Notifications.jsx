import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { timeAgo } from "@/lib/readi";

export default function Notifications() {
  const [items, setItems] = useState(null);

  const load = useCallback(async () => {
    try {
      const n = await base44.entities.Notification.filter({}, "-created_date", 50);
      setItems(n);
    } catch { setItems([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const markAll = async () => {
    const unread = (items || []).filter((n) => !n.is_read);
    if (unread.length === 0) return;
    await base44.entities.Notification.bulkUpdate(unread.map((n) => ({ id: n.id, is_read: true })));
    load();
  };

  return (
    <div className="pb-4">
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Little nudges from your reading corner.</p>
        </div>
        {items && items.some((n) => !n.is_read) && (
          <Button size="sm" variant="ghost" onClick={markAll}><CheckCheck className="w-4 h-4 mr-1" /> Mark all read</Button>
        )}
      </div>
      {items === null ? (
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="All quiet" message="You'll be notified when someone joins your reads or replies to you." />
      ) : (
        <div className="px-5 mt-4 space-y-2">
          {items.map((n) => (
            <Link key={n.id} to={n.link || "#"} onClick={() => { if (!n.is_read) base44.entities.Notification.update(n.id, { is_read: true }); }}
              className={`flex gap-3 rounded-2xl border p-3.5 transition-colors ${n.is_read ? "bg-card border-border" : "bg-primary/5 border-primary/20"}`}>
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.is_read ? "bg-transparent" : "bg-primary"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/90 leading-snug">{n.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_date)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}