import { Badge } from "@/components/ui/badge";
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
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../../backend";
import type { UserAdminDetail } from "../../backend.d";

type SortKey = "coins" | "joined" | "activity";
const PAGE_SIZE = 20;

function AddCoinsModal({
  detail,
  onClose,
}: {
  detail: UserAdminDetail;
  onClose: () => void;
}) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.adminAddCoins(
        detail.profile.principal,
        BigInt(amount),
        reason,
      );
    },
    onSuccess: () => {
      toast.success(`Added ${amount} coins to ${detail.profile.username}`);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: () => toast.error("Failed to add coins"),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Coins — {detail.profile.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Amount (coins)</Label>
            <Input
              data-ocid="add-coins-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Reason (required)</Label>
            <Textarea
              data-ocid="add-coins-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Admin bonus, correction..."
              className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 resize-none"
              rows={2}
            />
          </div>
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
            data-ocid="add-coins-submit"
            onClick={() => mutation.mutate()}
            disabled={!amount || !reason.trim() || mutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-gray-950 font-bold"
          >
            {mutation.isPending ? "Adding…" : "Add Coins"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeductCoinsModal({
  detail,
  onClose,
}: {
  detail: UserAdminDetail;
  onClose: () => void;
}) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.adminDeductCoins(
        detail.profile.principal,
        BigInt(amount),
        reason,
      );
    },
    onSuccess: () => {
      toast.success(`Deducted ${amount} coins from ${detail.profile.username}`);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: () => toast.error("Failed to deduct coins"),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>Deduct Coins — {detail.profile.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Amount (coins)</Label>
            <Input
              data-ocid="deduct-coins-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 200"
              className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Reason (required)</Label>
            <Textarea
              data-ocid="deduct-coins-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Fraud penalty, correction..."
              className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 resize-none"
              rows={2}
            />
          </div>
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
            data-ocid="deduct-coins-submit"
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={!amount || !reason.trim() || mutation.isPending}
          >
            {mutation.isPending ? "Deducting…" : "Deduct Coins"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BlockReasonModal({
  detail,
  onClose,
}: {
  detail: UserAdminDetail;
  onClose: () => void;
}) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const targetBlocked = !detail.profile.isBlocked;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.adminToggleBlock(
        detail.profile.principal,
        targetBlocked,
        reason,
      );
    },
    onSuccess: () => {
      toast.success(targetBlocked ? "User blocked" : "User unblocked");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: () => toast.error("Failed to update user"),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {targetBlocked ? "Block" : "Unblock"} — {detail.profile.username}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-1.5">
          <Label className="text-gray-400 text-xs">Reason (required)</Label>
          <Textarea
            data-ocid="block-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              targetBlocked
                ? "Why are you blocking this user?"
                : "Reason for unblocking..."
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
            data-ocid="block-confirm"
            variant={targetBlocked ? "destructive" : "default"}
            onClick={() => mutation.mutate()}
            disabled={!reason.trim() || mutation.isPending}
            className={
              !targetBlocked ? "bg-green-600 hover:bg-green-700 text-white" : ""
            }
          >
            {mutation.isPending
              ? "Saving…"
              : targetBlocked
                ? "Block User"
                : "Unblock User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserDetailPanel({
  detail,
  onClose,
}: {
  detail: UserAdminDetail;
  onClose: () => void;
}) {
  const { actor, isFetching } = useActor(createActor);
  const { data: txData } = useQuery({
    queryKey: ["user-tx", detail.profile.principal.toText()],
    queryFn: async () => {
      if (!actor) return { total: BigInt(0), transactions: [] };
      return actor.adminGetAllTransactions(
        detail.profile.principal,
        null,
        null,
        null,
        BigInt(10),
        BigInt(0),
      );
    },
    enabled: !!actor && !isFetching,
  });

  const p = detail.profile;
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      data-ocid="user-detail-panel"
    >
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <span className="text-base font-bold text-orange-400">
                {p.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-100">{p.username}</p>
              <p className="text-xs text-gray-500">
                {p.isBlocked ? "🔴 Blocked" : "🟢 Active"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Coin Balance",
                val: Number(p.coinBalance).toLocaleString("en-IN"),
                color: "text-orange-400",
              },
              {
                label: "Total Earned",
                val: Number(detail.totalCoinsEarned).toLocaleString("en-IN"),
                color: "text-green-400",
              },
              {
                label: "Withdrawn",
                val: `₹${Number(detail.totalWithdrawnRupees)}`,
                color: "text-blue-400",
              },
              {
                label: "Fraud Flags",
                val: Number(detail.fraudFlagCount).toString(),
                color:
                  detail.fraudFlagCount > 0 ? "text-red-400" : "text-gray-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-gray-800 rounded-lg p-3 border border-gray-700"
              >
                <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Profile details */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-2.5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Profile
            </h4>
            {[
              {
                label: "Principal",
                val: `${p.principal.toText().slice(0, 28)}…`,
                mono: true,
              },
              {
                label: "Referral Code",
                val: p.referralCode,
                mono: true,
              },
              {
                label: "Streak",
                val: `🔥 ${Number(p.currentStreak)} days`,
                mono: false,
              },
              {
                label: "Joined",
                val: new Date(
                  Number(p.createdAt) / 1_000_000,
                ).toLocaleDateString("en-IN"),
                mono: false,
              },
              {
                label: "Last Active",
                val: new Date(
                  Number(p.lastLoginDate) / 1_000_000,
                ).toLocaleDateString("en-IN"),
                mono: false,
              },
            ].map((r) => (
              <div key={r.label} className="flex justify-between gap-2">
                <span className="text-xs text-gray-500 shrink-0">
                  {r.label}
                </span>
                <span
                  className={`text-xs text-gray-300 text-right break-all ${r.mono ? "font-mono" : ""}`}
                >
                  {r.val}
                </span>
              </div>
            ))}
          </div>

          {/* Block history */}
          {p.blockHistory.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Block History
              </h4>
              {p.blockHistory.slice(0, 5).map((entry) => (
                <div
                  key={`${entry.adminId.toText()}-${entry.timestamp.toString()}`}
                  className="flex items-start gap-2 text-xs border-b border-gray-700 pb-2 last:border-0 last:pb-0"
                >
                  <span
                    className={`mt-0.5 ${entry.blocked ? "text-red-400" : "text-green-400"}`}
                  >
                    {entry.blocked ? "Blocked" : "Unblocked"}
                  </span>
                  <span className="text-gray-400 flex-1">{entry.reason}</span>
                  <span className="text-gray-600 shrink-0">
                    {new Date(
                      Number(entry.timestamp) / 1_000_000,
                    ).toLocaleDateString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Recent transactions */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Recent Transactions (last 10)
            </h4>
            {!txData ? (
              <Skeleton className="h-12 bg-gray-700 rounded" />
            ) : txData.transactions.length === 0 ? (
              <p className="text-xs text-gray-500">No transactions</p>
            ) : (
              txData.transactions.map((tx) => (
                <div
                  key={tx.id.toString()}
                  className="flex items-center justify-between text-xs border-b border-gray-700 pb-1.5 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="rounded px-1.5 py-0.5 bg-gray-700 text-gray-300 text-[10px] font-mono shrink-0">
                      {tx.method}
                    </span>
                    <span className="text-gray-500 truncate">
                      {tx.note || "—"}
                    </span>
                  </div>
                  <span
                    className={`font-bold shrink-0 ml-2 ${tx.isCredit ? "text-green-400" : "text-red-400"}`}
                  >
                    {tx.isCredit ? "+" : "-"}
                    {Number(tx.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkBlockModal({
  userIds,
  onClose,
}: {
  userIds: string[];
  onClose: () => void;
}) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [blocking, setBlocking] = useState(true);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const { Principal } = await import("@icp-sdk/core/principal");
      const ids = userIds.map((id) => Principal.fromText(id));
      const result = await actor.adminBulkBlockUsers(ids, blocking, reason);
      return result;
    },
    onSuccess: (r) => {
      toast.success(
        `${blocking ? "Blocked" : "Unblocked"} ${Number(r.succeeded)} users (${Number(r.failed)} failed)`,
      );
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: () => toast.error("Bulk action failed"),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Bulk Action — {userIds.length} users selected
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBlocking(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${blocking ? "bg-red-500/20 border-red-500 text-red-300" : "bg-gray-800 border-gray-600 text-gray-400"}`}
            >
              Block All
            </button>
            <button
              type="button"
              onClick={() => setBlocking(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${!blocking ? "bg-green-500/20 border-green-500 text-green-300" : "bg-gray-800 border-gray-600 text-gray-400"}`}
            >
              Unblock All
            </button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Reason (required)</Label>
            <Textarea
              data-ocid="bulk-block-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for bulk action..."
              className="bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 resize-none"
              rows={3}
            />
          </div>
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
            data-ocid="bulk-block-confirm"
            variant={blocking ? "destructive" : "default"}
            onClick={() => mutation.mutate()}
            disabled={!reason.trim() || mutation.isPending}
            className={
              !blocking ? "bg-green-600 hover:bg-green-700 text-white" : ""
            }
          >
            {mutation.isPending
              ? "Processing…"
              : `Apply to ${userIds.length} users`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UsersTab() {
  const { actor, isFetching } = useActor(createActor);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("joined");
  const [page, setPage] = useState(0);
  const [addCoinsUser, setAddCoinsUser] = useState<UserAdminDetail | null>(
    null,
  );
  const [deductCoinsUser, setDeductCoinsUser] =
    useState<UserAdminDetail | null>(null);
  const [blockUser, setBlockUser] = useState<UserAdminDetail | null>(null);
  const [detailUser, setDetailUser] = useState<UserAdminDetail | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);

  const { data: users, isLoading } = useQuery<UserAdminDetail[]>({
    queryKey: ["admin-users"],
    queryFn: async () => (actor ? actor.adminGetAllUsers() : []),
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  const filtered = (users ?? [])
    .filter(
      (u) =>
        u.profile.username.toLowerCase().includes(search.toLowerCase()) ||
        u.profile.principal
          .toText()
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "coins")
        return Number(b.profile.coinBalance - a.profile.coinBalance);
      if (sort === "activity")
        return Number(b.profile.lastLoginDate - a.profile.lastLoginDate);
      return Number(b.profile.createdAt - a.profile.createdAt);
    });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(paginated.map((u) => u.profile.principal.toText())),
      );
    }
  };

  return (
    <div className="space-y-4" data-ocid="users-tab">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            data-ocid="user-search"
            placeholder="Search username or principal…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500"
          />
        </div>
        <select
          data-ocid="user-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-gray-800 border border-gray-600 text-gray-200 rounded-md px-3 py-2 text-sm"
        >
          <option value="joined">Sort: Join Date</option>
          <option value="coins">Sort: Coins</option>
          <option value="activity">Sort: Last Active</option>
        </select>
        {selectedIds.size > 0 && (
          <Button
            data-ocid="bulk-block-btn"
            size="sm"
            variant="outline"
            onClick={() => setShowBulkModal(true)}
            className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs"
          >
            <Ban className="w-3.5 h-3.5 mr-1.5" />
            Bulk Action ({selectedIds.size})
          </Button>
        )}
      </div>

      <div className="text-xs text-gray-500">
        {filtered.length} users{" "}
        {selectedIds.size > 0 && (
          <span className="text-orange-400 ml-1">
            • {selectedIds.size} selected
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size === paginated.length &&
                    paginated.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="accent-orange-500"
                  data-ocid="select-all"
                />
              </th>
              {[
                "User",
                "Coins",
                "₹ Value",
                "Earned",
                "Status",
                "Last Active",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider
                    ${["Coins", "₹ Value", "Actions"].includes(h) ? "text-right" : "text-left"}
                    ${["₹ Value", "Earned", "Last Active"].includes(h) ? "hidden lg:table-cell" : ""}`}
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
            ) : paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-12 text-gray-500 text-sm"
                  data-ocid="users-empty"
                >
                  {search ? "No users matching your search" : "No users yet"}
                </td>
              </tr>
            ) : (
              paginated.map((ud, i) => {
                const user = ud.profile;
                const id = user.principal.toText();
                return (
                  <tr
                    key={id}
                    data-ocid={`user-row-${i}`}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => setDetailUser(ud)}
                    onKeyDown={(e) => e.key === "Enter" && setDetailUser(ud)}
                    tabIndex={0}
                  >
                    <td
                      className="px-4 py-3 w-8"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(id)}
                        onChange={() => toggleSelect(id)}
                        className="accent-orange-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-orange-400">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-gray-200 block truncate">
                            {user.username}
                          </span>
                          <span className="font-mono text-[10px] text-gray-500 block truncate">
                            {user.principal.toText().slice(0, 14)}…
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-orange-400">
                      {Number(user.coinBalance).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-right text-gray-400 text-xs">
                      ₹{(Number(user.coinBalance) / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-right text-green-400 text-xs">
                      {Number(ud.totalCoinsEarned).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      {user.isBlocked ? (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                          Blocked
                        </span>
                      ) : (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                      {new Date(
                        Number(user.lastLoginDate) / 1_000_000,
                      ).toLocaleDateString("en-IN")}
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        <Button
                          data-ocid={`add-coins-btn-${i}`}
                          size="sm"
                          variant="outline"
                          onClick={() => setAddCoinsUser(ud)}
                          title="Add Coins"
                          className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10 text-xs h-7 w-7 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          data-ocid={`deduct-coins-btn-${i}`}
                          size="sm"
                          variant="outline"
                          onClick={() => setDeductCoinsUser(ud)}
                          title="Deduct Coins"
                          className="border-gray-600 text-gray-400 hover:bg-gray-700 text-xs h-7 w-7 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Button
                          data-ocid={`toggle-block-btn-${i}`}
                          size="sm"
                          variant={user.isBlocked ? "outline" : "ghost"}
                          onClick={() => setBlockUser(ud)}
                          title={user.isBlocked ? "Unblock" : "Block"}
                          className={
                            user.isBlocked
                              ? "border-gray-600 text-green-400 hover:bg-gray-700 text-xs h-7 w-7 p-0"
                              : "text-red-400 hover:bg-red-500/10 text-xs h-7 w-7 p-0"
                          }
                        >
                          {user.isBlocked ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Ban className="w-3 h-3" />
                          )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              data-ocid="users-prev-page"
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              data-ocid="users-next-page"
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {addCoinsUser && (
        <AddCoinsModal
          detail={addCoinsUser}
          onClose={() => setAddCoinsUser(null)}
        />
      )}
      {deductCoinsUser && (
        <DeductCoinsModal
          detail={deductCoinsUser}
          onClose={() => setDeductCoinsUser(null)}
        />
      )}
      {blockUser && (
        <BlockReasonModal
          detail={blockUser}
          onClose={() => setBlockUser(null)}
        />
      )}
      {detailUser && (
        <UserDetailPanel
          detail={detailUser}
          onClose={() => setDetailUser(null)}
        />
      )}
      {showBulkModal && (
        <BulkBlockModal
          userIds={Array.from(selectedIds)}
          onClose={() => {
            setShowBulkModal(false);
            setSelectedIds(new Set());
          }}
        />
      )}
    </div>
  );
}
