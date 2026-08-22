import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { REPORT_REASONS } from "@/lib/readi";
import { useToast } from "@/components/ui/use-toast";

export default function ReportDialog({ open, onOpenChange, targetType, targetId }) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await base44.entities.Report.create({
        target_type: targetType,
        target_id: targetId,
        reason: detail ? `${reason} — ${detail}` : reason,
        status: "open"
      });
      toast({ title: "Report sent", description: "Thank you — our moderators will take a look." });
      setReason(""); setDetail(""); onOpenChange(false);
    } catch (e) {
      toast({ title: "Could not send report", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report content</DialogTitle>
          <DialogDescription>Help us keep Readi cosy and safe. Reports are reviewed by moderators.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={reason} onValueChange={setReason} className="gap-2">
          {REPORT_REASONS.map((r) => (
            <div key={r} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
              <RadioGroupItem value={r} id={r} />
              <Label htmlFor={r} className="text-sm font-normal cursor-pointer flex-1">{r}</Label>
            </div>
          ))}
        </RadioGroup>
        <Textarea placeholder="Add details (optional)" value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!reason || loading}>Send report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}