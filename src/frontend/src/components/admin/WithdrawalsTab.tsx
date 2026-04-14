import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  CreditCard,
  Search,
  StickyNote,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../../backend";
import type { WithdrawalRequestPublic } from "../../backend.d";
import { WithdrawalStatus } from "../../backend.d";

type FilterStatus = "all" | "pending" | "approved" | "rejected" | "paid";

const STATUS_BADGE: Record<WithdrawalStatus, { label: string; cls: string }> = {
  [WithdrawalStatus.pending]: {
    label: "Pending",
    cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  [WithdrawalStatus.approved]: {
    label: "Approved",
    cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  [WithdrawalStatus.rejected]: {
    label: "Rejected",
    cls: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  [WithdrawalStatus.paid]: {
    label: "Paid",
    cls: "bg-green-500/20 text-green-400 border-green-500/30",
  },
};

function ApproveModal({ id, onClose }: { id: bigint; onClose: () => void }) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.adminApproveWithdrawal(id, note);
    },
    onSuccess: () => {
      toast.success("Withdrawal approved ✓");
      qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      onClose();
    },
    onError: () => toast.error("Failed to approve"),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>Approve Withdrawal</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-1.5">
          <Label className="text-gray-400 text-xs">Note (optional)</Label>
          <Textarea
            data-ocid="approve-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Admin note..."
            className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 resize-none"
            rows={2}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            data-ocid="approve-submit"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {mutation.isPending ? "Approving…" : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectModal({ id, onClose }: { id: bigint; onClose: () => void }) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.adminRejectWithdrawal(id, note);
    },
    onSuccess: () => {
      toast.success("Withdrawal rejected");
      qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      onClose();
    },
    onError: () => toast.error("Failed to reject"),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>Reject Withdrawal</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-1.5">
          <Label className="text-gray-400 text-xs">Reason (required)</Label>
          <Textarea
            data-ocid="reject-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for rejection..."
            className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 resize-none"
            rows={3}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            data-ocid="reject-submit"
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={!note.trim() || mutation.isPending}
          >
            {mutation.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MarkPaidModal({ id, onClose }: { id: bigint; onClose: () => void }) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const [ref, setRef] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.adminMarkWithdrawalPaid(id, ref);
    },
    onSuccess: () => {
      toast.success("Marked as paid ✓");
      qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      onClose();
    },
    onError: () => toast.error("Failed to mark as paid"),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as Paid</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-1.5">
          <Label className="text-gray-400 text-xs">Payment Reference</Label>
          <Input
            data-ocid="payment-ref"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="UTR/Transaction ID..."
            className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            data-ocid="mark-paid-submit"
            onClick={() => mutation.mutate()}
            disabled={!ref.trim() || mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {mutation.isPending ? "Saving…" : "Mark Paid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddNoteModal({ id, onClose }: { id: bigint; onClose: () => void }) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const result = await actor.adminAddWithdrawalNote(id, note);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      toast.success("Note added");
      qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      onClose();
    },
    onError: (e) =>
      toast.error(`Failed: ${e instanceof Error ? e.message : "Error"}`),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-1.5">
          <Label className="text-gray-400 text-xs">Note</Label>
          <Textarea
            data-ocid="add-note-text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Admin note..."
            className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 resize-none"
            rows={3}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            data-ocid="add-note-submit"
            onClick={() => mutation.mutate()}
            disabled={!note.trim() || mutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-gray-950 font-bold"
          >
            {mutation.isPending ? "Saving…" : "Add Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkActionModal({
  ids,
  action,
  onClose,
}: {
  ids: bigint[];
  action: "approve" | "reject";
  onClose: () => void;
}) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      if (action === "approve") {
        return actor.adminBulkApproveWithdrawals(ids, note);
      }
      return actor.adminBulkRejectWithdrawals(ids, note || "Bulk rejection");
    },
    onSuccess: (r) => {
      toast.success(
        `${action === "approve" ? "Approved" : "Rejected"} ${Number(r.succeeded)} (${Number(r.failed)} failed)`,
      );
      qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      onClose();
    },
    onError: () => toast.error("Bulk action failed"),
  });

  const requireNote = action === "reject";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Bulk {action === "approve" ? "Approve" : "Reject"} — {ids.length}{" "}
            items
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-1.5">
          <Label className="text-gray-400 text-xs">
            {requireNote ? "Reason (required)" : "Note (optional)"}
          </Label>
          <Textarea
            data-ocid="bulk-action-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              action === "approve"
                ? "Optional approval note..."
                : "Reason for rejection..."
            }
            className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 resize-none"
            rows={3}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            data-ocid="bulk-action-confirm"
            variant={action === "reject" ? "destructive" : "default"}
            onClick={() => mutation.mutate()}
            disabled={(requireNote && !note.trim()) || mutation.isPending}
            className={
              action === "approve"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : ""
            }
          >
            {mutation.isPending
              ? "Processing…"
              : `${action === "approve" ? "Approve" : "Reject"} ${ids.length} items`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailPanel({
  req,
  onClose,
}: {
  req: WithdrawalRequestPublic;
  onClose: () => void;
}) {
  const badge = STATUS_BADGE[req.status];
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close panel"
      />
      <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-700 overflow-y-auto h-full flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div>
            <p className="font-bold text-gray-100">
              Withdrawal #{req.id.toString()}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium border ${badge.cls}`}
            >
              {badge.label}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 h-8 w-8 p-0"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 space-y-5">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Payment Details
            </h4>
            {[
              { label: "Method", val: req.method.toUpperCase() },
              {
                label: "Amount",
                val: `₹${Number(req.rupeeAmount).toLocaleString("en-IN")}`,
              },
              {
                label: "Coins Deducted",
                val: Number(req.coinsDeducted).toLocaleString("en-IN"),
              },
              { label: "Details", val: req.details },
              ...(req.paymentDetails
                ? [{ label: "Payment Details", val: req.paymentDetails }]
                : []),
            ].map((r) => (
              <div key={r.label} className="flex justify-between gap-2">
                <span className="text-xs text-gray-500">{r.label}</span>
                <span className="text-xs text-gray-200 font-mono text-right break-all">
                  {r.val}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Timeline
            </h4>
            {[
              {
                label: "Requested",
                val: new Date(Number(req.createdAt) / 1_000_000).toLocaleString(
                  "en-IN",
                ),
              },
              ...(req.resolvedAt
                ? [
                    {
                      label: "Resolved",
                      val: new Date(
                        Number(req.resolvedAt) / 1_000_000,
                      ).toLocaleString("en-IN"),
                    },
                  ]
                : []),
              ...(req.paidAt
                ? [
                    {
                      label: "Paid At",
                      val: new Date(
                        Number(req.paidAt) / 1_000_000,
                      ).toLocaleString("en-IN"),
                    },
                  ]
                : []),
              ...(req.resolvedBy
                ? [
                    {
                      label: "Resolved By",
                      val: `${req.resolvedBy.toText().slice(0, 20)}…`,
                    },
                  ]
                : []),
            ].map((r) => (
              <div key={r.label} className="flex justify-between gap-2">
                <span className="text-xs text-gray-500">{r.label}</span>
                <span className="text-xs text-gray-200 text-right">
                  {r.val}
                </span>
              </div>
            ))}
          </div>

          {req.adminNote && (
            <div className="bg-gray-800 rounded-lg p-4 border border-yellow-500/20">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Admin Note
              </h4>
              <p className="text-xs text-yellow-300">{req.adminNote}</p>
            </div>
          )}

          <div className="text-xs text-gray-500 font-mono">
            User: {req.userId.toText().slice(0, 30)}…
          </div>
        </div>
      </div>
    </div>
  );
}

export function WithdrawalsTab() {
  const { actor, isFetching } = useActor(createActor);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [approveId, setApproveId] = useState<bigint | null>(null);
  const [rejectId, setRejectId] = useState<bigint | null>(null);
  const [paidId, setPaidId] = useState<bigint | null>(null);
  const [noteId, setNoteId] = useState<bigint | null>(null);
  const [detailReq, setDetailReq] = useState<WithdrawalRequestPublic | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(
    null,
  );

  const { data: withdrawals, isLoading } = useQuery<WithdrawalRequestPublic[]>({
    queryKey: ["admin-withdrawals"],
    queryFn: async () =>
      actor
        ? actor.adminGetAllWithdrawals(null, null, null, null, null, null)
        : [],
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  const all = withdrawals ?? [];
  const counts = {
    all: all.length,
    pending: all.filter((w) => w.status === WithdrawalStatus.pending).length,
    approved: all.filter((w) => w.status === WithdrawalStatus.approved).length,
    rejected: all.filter((w) => w.status === WithdrawalStatus.rejected).length,
    paid: all.filter((w) => w.status === WithdrawalStatus.paid).length,
  };

  const filtered = all
    .filter(
      (w) => filter === "all" || w.status === (filter as WithdrawalStatus),
    )
    .filter(
      (w) =>
        !search ||
        w.userId.toText().toLowerCase().includes(search.toLowerCase()) ||
        w.details.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => Number(b.createdAt - a.createdAt));

  const selectedBigInts = Array.from(selectedIds).map((id) => BigInt(id));

  const toggleSelect = (id: bigint) => {
    const key = id.toString();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const FILTERS: { id: FilterStatus; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "paid", label: "Paid" },
  ];

  return (
    <div className="space-y-4" data-ocid="withdrawals-tab">
      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              data-ocid={`filter-${f.id}`}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filter === f.id
                  ? "bg-orange-500 border-orange-500 text-gray-950"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  filter === f.id
                    ? "bg-gray-950/30 text-orange-200"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            data-ocid="withdrawal-search"
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 text-sm w-48"
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center gap-3">
          <span className="text-xs text-gray-300">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              data-ocid="bulk-approve-btn"
              size="sm"
              onClick={() => setBulkAction("approve")}
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Bulk Approve
            </Button>
            <Button
              data-ocid="bulk-reject-btn"
              size="sm"
              variant="destructive"
              onClick={() => setBulkAction("reject")}
              className="text-xs"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Bulk Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="text-gray-500 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  className="accent-orange-500"
                  checked={
                    selectedIds.size === filtered.length && filtered.length > 0
                  }
                  onChange={() => {
                    if (selectedIds.size === filtered.length) {
                      setSelectedIds(new Set());
                    } else {
                      setSelectedIds(
                        new Set(filtered.map((w) => w.id.toString())),
                      );
                    }
                  }}
                />
              </th>
              {[
                "User",
                "Method",
                "Details",
                "Amount",
                "Status",
                "Date",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider
                    ${["Amount", "Actions"].includes(h) ? "text-right" : "text-left"}
                    ${["Method", "Details", "Date"].includes(h) ? "hidden md:table-cell" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1, 2, 3, 4].map((k) => (
                <tr key={k} className="border-b border-gray-800">
                  <td colSpan={8} className="px-4 py-3">
                    <Skeleton className="h-5 rounded bg-gray-800" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-12 text-gray-500 text-sm"
                  data-ocid="withdrawals-empty"
                >
                  No withdrawal requests
                </td>
              </tr>
            ) : (
              filtered.map((req, i) => {
                const badge = STATUS_BADGE[req.status];
                const key = req.id.toString();
                return (
                  <tr
                    key={key}
                    data-ocid={`withdrawal-row-${i}`}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => setDetailReq(req)}
                    onKeyDown={(e) => e.key === "Enter" && setDetailReq(req)}
                    tabIndex={0}
                  >
                    <td
                      className="px-4 py-3 w-8"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(key)}
                        onChange={() => toggleSelect(req.id)}
                        className="accent-orange-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[120px]">
                      <span className="truncate block">
                        {req.userId.toText().slice(0, 16)}…
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="uppercase text-xs font-bold text-cyan-400">
                        {req.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs max-w-[140px]">
                      <span className="truncate block">{req.details}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-orange-400">
                      ₹{Number(req.rupeeAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium border ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">
                      {new Date(
                        Number(req.createdAt) / 1_000_000,
                      ).toLocaleDateString("en-IN")}
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        {req.status === WithdrawalStatus.pending && (
                          <>
                            <Button
                              data-ocid={`approve-btn-${i}`}
                              size="sm"
                              onClick={() => setApproveId(req.id)}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-2"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-0.5" />
                              Approve
                            </Button>
                            <Button
                              data-ocid={`reject-btn-${i}`}
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectId(req.id)}
                              className="text-xs h-7 px-2"
                            >
                              <XCircle className="w-3 h-3 mr-0.5" />
                              Reject
                            </Button>
                          </>
                        )}
                        {req.status === WithdrawalStatus.approved && (
                          <Button
                            data-ocid={`mark-paid-btn-${i}`}
                            size="sm"
                            onClick={() => setPaidId(req.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-2"
                          >
                            <CreditCard className="w-3 h-3 mr-0.5" />
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          data-ocid={`note-btn-${i}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => setNoteId(req.id)}
                          title="Add Note"
                          className="text-gray-500 hover:text-gray-300 h-7 w-7 p-0"
                        >
                          <StickyNote className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {approveId !== null && (
        <ApproveModal id={approveId} onClose={() => setApproveId(null)} />
      )}
      {rejectId !== null && (
        <RejectModal id={rejectId} onClose={() => setRejectId(null)} />
      )}
      {paidId !== null && (
        <MarkPaidModal id={paidId} onClose={() => setPaidId(null)} />
      )}
      {noteId !== null && (
        <AddNoteModal id={noteId} onClose={() => setNoteId(null)} />
      )}
      {detailReq && (
        <DetailPanel req={detailReq} onClose={() => setDetailReq(null)} />
      )}
      {bulkAction && (
        <BulkActionModal
          ids={selectedBigInts}
          action={bulkAction}
          onClose={() => {
            setBulkAction(null);
            setSelectedIds(new Set());
          }}
        />
      )}
    </div>
  );
}
