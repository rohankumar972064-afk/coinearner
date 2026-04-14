import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  type AppSettings,
  type Transaction,
  TransactionMethod,
  WithdrawalMethod,
  type WithdrawalRequestPublic,
  WithdrawalStatus,
  createActor,
} from "../backend";
import { useAuth } from "../hooks/useAuth";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { COINS_TO_RUPEES, formatCoins, formatRupees } from "../types";

const COINS_PER_RUPEE = 100;

function rupeesToCoins(r: number) {
  return Math.ceil(r * COINS_PER_RUPEE);
}

function formatDate(nanos: bigint) {
  try {
    return new Date(Number(nanos ?? BigInt(0)) / 1_000_000).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    );
  } catch {
    return "";
  }
}

function txMethodIcon(method: TransactionMethod) {
  switch (method) {
    case TransactionMethod.ad:
      return "📺";
    case TransactionMethod.referral:
      return "👥";
    case TransactionMethod.daily:
      return "🔥";
    case TransactionMethod.task:
      return "✅";
    case TransactionMethod.withdrawal:
      return "💸";
    case TransactionMethod.admin:
      return "🎁";
    default:
      return "🪙";
  }
}

function txMethodLabel(method: TransactionMethod) {
  switch (method) {
    case TransactionMethod.ad:
      return "Watch Ad";
    case TransactionMethod.referral:
      return "Referral Bonus";
    case TransactionMethod.daily:
      return "Daily Streak";
    case TransactionMethod.task:
      return "Task Reward";
    case TransactionMethod.withdrawal:
      return "Withdrawal";
    case TransactionMethod.admin:
      return "Admin Grant";
    default:
      return "Transaction";
  }
}

function withdrawalMethodLabel(method: WithdrawalMethod) {
  switch (method) {
    case WithdrawalMethod.upi:
      return "UPI";
    case WithdrawalMethod.paytm:
      return "Paytm";
    case WithdrawalMethod.bank:
      return "Bank Transfer";
    default:
      return String(method ?? "");
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Clock; className: string; label: string }
> = {
  [WithdrawalStatus.pending]: {
    icon: Clock,
    className: "text-primary border-primary/30 bg-primary/10",
    label: "Pending",
  },
  [WithdrawalStatus.approved]: {
    icon: CheckCircle2,
    className: "text-secondary border-secondary/30 bg-secondary/10",
    label: "Approved",
  },
  [WithdrawalStatus.rejected]: {
    icon: XCircle,
    className: "text-destructive border-destructive/30 bg-destructive/10",
    label: "Rejected",
  },
  [WithdrawalStatus.paid]: {
    icon: CheckCircle2,
    className: "text-accent border-accent/30 bg-accent/10",
    label: "Paid",
  },
};

const STATUS_FALLBACK = {
  icon: Clock,
  className: "text-muted-foreground border-border bg-muted/40",
  label: "Unknown",
};

function StatusBadge({ status }: { status: WithdrawalStatus }) {
  const config = STATUS_CONFIG[status as string] ?? STATUS_FALLBACK;
  const { icon: Icon, className, label } = config;
  return (
    <Badge
      variant="outline"
      className={`font-display font-bold text-xs flex items-center gap-1 ${className}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

// ─── Balance Header ───────────────────────────────────────────────────────────

function BalanceHeader({
  coins,
  rupees,
  isLoading,
}: { coins: bigint; rupees: number; isLoading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary shadow-xl p-6 text-primary-foreground"
    >
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 blur-xl" />
      <p className="text-sm font-body font-medium opacity-75 mb-2 relative z-10">
        🪙 Wallet Balance
      </p>
      {isLoading ? (
        <div className="space-y-2 relative z-10">
          <Skeleton className="h-12 w-36 bg-white/20" />
          <Skeleton className="h-6 w-24 bg-white/20" />
        </div>
      ) : (
        <div className="relative z-10">
          <motion.div
            key={coins.toString()}
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="flex items-baseline gap-2 mb-1"
          >
            <span className="font-display font-extrabold text-5xl leading-none">
              {formatCoins(coins)}
            </span>
            <span className="font-display font-semibold text-lg opacity-75">
              Coins
            </span>
          </motion.div>
          <p className="font-display font-bold text-2xl opacity-90">
            {formatRupees(rupees)}
          </p>
          <p className="text-xs opacity-60 mt-1 font-body">
            1,000 coins = ₹10 • Min withdrawal shown below
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Active Withdrawal Card ───────────────────────────────────────────────────

function ActiveWithdrawalCard({ req }: { req: WithdrawalRequestPublic }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-l-4 border-l-primary bg-card shadow-md">
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Active Request
            </CardTitle>
            <StatusBadge status={req.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
              💸
            </div>
            <div>
              <p className="font-display font-extrabold text-2xl text-foreground leading-none">
                {formatRupees(Number(req.rupeeAmount ?? 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                via {withdrawalMethodLabel(req.method)}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground border-t border-border pt-2">
            <span className="font-semibold">To:</span>{" "}
            <span className="font-mono">{req.details ?? ""}</span>
          </div>
          {req.status === WithdrawalStatus.rejected && req.adminNote && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              <span className="font-bold">Admin note:</span> {req.adminNote}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDate(req.createdAt)}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Withdrawal Form ──────────────────────────────────────────────────────────

const METHODS: { value: WithdrawalMethod; label: string }[] = [
  { value: WithdrawalMethod.upi, label: "UPI" },
  { value: WithdrawalMethod.paytm, label: "Paytm" },
  { value: WithdrawalMethod.bank, label: "Bank" },
];

function methodPlaceholder(method: WithdrawalMethod): string {
  if (method === WithdrawalMethod.upi) return "yourname@upi";
  if (method === WithdrawalMethod.paytm) return "10-digit Paytm number";
  return "Account no, IFSC, Bank name";
}

function WithdrawalForm({
  coins,
  settings,
  onSuccess,
}: {
  coins: bigint;
  settings: AppSettings | null | undefined;
  onSuccess: () => void;
}) {
  const { actor } = useActor(createActor);
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<WithdrawalMethod>(WithdrawalMethod.upi);
  const [details, setDetails] = useState("");
  const [amountStr, setAmountStr] = useState("");

  const minRupees = settings ? Number(settings.minWithdrawalRupees) : 50;
  const rupeeAmt = Number.parseFloat(amountStr) || 0;
  const coinsNeeded = rupeesToCoins(rupeeAmt);
  const hasCoins = BigInt(coinsNeeded) <= coins;
  const meetsMin = rupeeAmt >= minRupees;
  const maxRupees = Math.floor(COINS_TO_RUPEES(coins));
  const canSubmit = hasCoins && meetsMin && details.trim().length > 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.submitWithdrawal(
        method,
        details.trim(),
        BigInt(Math.round(rupeeAmt)),
        null,
        sessionToken,
      );
    },
    onSuccess: () => {
      toast.success("Withdrawal request submitted!", {
        description: "Admin will review within 24–48 hours.",
      });
      setAmountStr("");
      setDetails("");
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      queryClient.invalidateQueries({ queryKey: ["myWithdrawals"] });
      onSuccess();
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  });

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base font-bold flex items-center gap-2">
          <ArrowDownToLine className="w-4 h-4 text-primary" />
          Request Withdrawal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Payment Method
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                type="button"
                key={m.value}
                data-ocid={`method-${m.value}`}
                onClick={() => {
                  setMethod(m.value);
                  setDetails("");
                }}
                className={`py-2.5 px-2 rounded-xl border text-sm font-display font-bold transition-smooth focus-visible:ring-2 focus-visible:ring-ring ${
                  method === m.value
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-muted/40 border-border text-foreground hover:border-primary/50 hover:bg-muted/70"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {method === WithdrawalMethod.bank
              ? "Bank Details"
              : `${withdrawalMethodLabel(method)} ID`}
          </Label>
          <Input
            data-ocid="input-payment-details"
            placeholder={methodPlaceholder(method)}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="bg-input"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Amount (₹)
            </Label>
            <button
              type="button"
              className="text-xs font-semibold text-primary transition-smooth hover:opacity-70"
              onClick={() => setAmountStr(String(maxRupees))}
            >
              Max ₹{maxRupees}
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
              ₹
            </span>
            <Input
              data-ocid="input-withdrawal-amount"
              type="number"
              min={minRupees}
              max={maxRupees}
              placeholder={String(minRupees)}
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="pl-7 bg-input"
            />
          </div>
          {rupeeAmt > 0 && (
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-muted-foreground">
                Coins deducted:{" "}
                <span
                  className={
                    hasCoins
                      ? "font-bold text-foreground"
                      : "font-bold text-destructive"
                  }
                >
                  🪙 {coinsNeeded.toLocaleString("en-IN")}
                </span>
              </span>
              {!meetsMin && (
                <span className="text-destructive font-semibold">
                  Min ₹{minRupees}
                </span>
              )}
              {meetsMin && !hasCoins && (
                <span className="text-destructive font-semibold">
                  Not enough coins
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          data-ocid="btn-submit-withdrawal"
          className="btn-coin w-full"
          disabled={!canSubmit || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Submitting…
            </>
          ) : (
            <>
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Withdraw {rupeeAmt > 0 ? formatRupees(rupeeAmt) : ""}
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground font-body">
          Admin reviews manually • Usually 24–48 hrs
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Withdrawal History ───────────────────────────────────────────────────────

function WithdrawalHistory({
  items,
  loading,
}: { items: WithdrawalRequestPublic[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((k) => (
          <Skeleton key={k} className="h-16 rounded-xl w-full" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div
        data-ocid="empty-withdrawals"
        className="flex flex-col items-center py-14 text-center"
      >
        <span className="text-5xl mb-3">📭</span>
        <p className="font-display font-bold text-foreground">
          No withdrawals yet
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Your withdrawal history will appear here
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((w, i) => (
        <motion.div
          key={w.id.toString()}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          data-ocid={`withdrawal-row-${w.id}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
            💸
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-sm truncate">
              {withdrawalMethodLabel(w.method)}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {formatDate(w.createdAt)}
            </p>
            {w.status === WithdrawalStatus.rejected && w.adminNote && (
              <p className="text-xs text-destructive mt-0.5 truncate italic">
                {w.adminNote}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="font-display font-bold text-sm">
              {formatRupees(Number(w.rupeeAmount ?? 0))}
            </span>
            <StatusBadge status={w.status} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Transaction History ──────────────────────────────────────────────────────

function TransactionHistory({
  items,
  loading,
}: { items: Transaction[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((k) => (
          <Skeleton key={k} className="h-14 rounded-xl w-full" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div
        data-ocid="empty-transactions"
        className="flex flex-col items-center py-14 text-center"
      >
        <span className="text-5xl mb-3">🪙</span>
        <p className="font-display font-bold text-foreground">
          No activity yet
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Earn coins to see your history
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((tx, i) => (
        <motion.div
          key={tx.id.toString()}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          data-ocid={`tx-row-${tx.id}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl flex-shrink-0">
            {txMethodIcon(tx.method)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-sm truncate">
              {txMethodLabel(tx.method)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(tx.createdAt)}
            </p>
            {tx.note && (
              <p className="text-xs text-muted-foreground truncate italic">
                {tx.note}
              </p>
            )}
          </div>
          <span
            className={`font-display font-bold text-sm flex-shrink-0 ${tx.isCredit ? "text-accent" : "text-destructive"}`}
          >
            {tx.isCredit ? "+" : "-"}
            {formatCoins(tx.amount ?? BigInt(0))} 🪙
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Withdrawal poll for toast notifications ──────────────────────────────────

function useWithdrawalStatusToasts(
  actor: ReturnType<typeof createActor> | null,
  sessionToken: string | null,
) {
  const seenRef = useRef<Map<string, string>>(new Map());
  const firstLoad = useRef(true);

  useQuery<WithdrawalRequestPublic[]>({
    queryKey: ["myWithdrawals", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const data = await actor.getMyWithdrawals(sessionToken);
        if (firstLoad.current) {
          firstLoad.current = false;
          for (const w of data) seenRef.current.set(w.id.toString(), w.status);
          return data;
        }
        for (const w of data) {
          const key = w.id.toString();
          const prev = seenRef.current.get(key);
          if (prev && prev !== w.status) {
            if (w.status === WithdrawalStatus.approved) {
              toast.success(`✅ Withdrawal ₹${w.rupeeAmount} approved!`);
            } else if (w.status === WithdrawalStatus.paid) {
              toast.success(`💸 Withdrawal ₹${w.rupeeAmount} paid!`);
            } else if (w.status === WithdrawalStatus.rejected) {
              toast.error("❌ Withdrawal rejected", {
                description: w.adminNote || "Please contact support.",
              });
            }
          }
          seenRef.current.set(key, w.status);
        }
        return data;
      } catch {
        return [];
      }
    },
    enabled: !!actor,
    refetchInterval: 60_000,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { sessionToken } = useAuth();
  const { coins, rupees, isLoading: balanceLoading } = useCoinBalance();
  const [tab, setTab] = useState("withdrawals");

  useWithdrawalStatusToasts(actor, sessionToken);

  const settingsQuery = useQuery<AppSettings | null>({
    queryKey: ["appSettings"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getSettings();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 60_000,
  });

  const withdrawalsQuery = useQuery<WithdrawalRequestPublic[]>({
    queryKey: ["myWithdrawals", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMyWithdrawals(sessionToken);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });

  const txQuery = useQuery<Transaction[]>({
    queryKey: ["transactionHistory", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const { transactions } = await actor.getTransactionHistory(
          BigInt(50),
          BigInt(0),
          sessionToken,
        );
        return transactions;
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });

  const settings = settingsQuery.data;
  const withdrawals = withdrawalsQuery.data ?? [];
  const transactions = txQuery.data ?? [];
  const pendingWithdrawal = withdrawals.find(
    (w) => w.status === WithdrawalStatus.pending,
  );
  const withdrawalsEnabled = settings ? settings.withdrawalsEnabled : true;
  const minRupees = settings ? Number(settings.minWithdrawalRupees) : 50;
  const hasEnoughToWithdraw = rupees >= minRupees;

  return (
    <div className="space-y-5" data-ocid="wallet-page">
      <div>
        <h1 className="font-display font-black text-2xl text-foreground">
          Wallet
        </h1>
        <p className="text-muted-foreground font-body text-sm mt-0.5">
          Manage your coins and withdrawals
        </p>
      </div>

      <BalanceHeader coins={coins} rupees={rupees} isLoading={balanceLoading} />

      {!withdrawalsEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-start gap-3"
          data-ocid="withdrawals-paused"
        >
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-display font-bold text-foreground">
              Withdrawals are currently paused
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              The admin has temporarily disabled withdrawals. Please check back
              later.
            </p>
          </div>
        </motion.div>
      )}

      {withdrawalsEnabled && !balanceLoading && !hasEnoughToWithdraw && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 flex items-start gap-3"
        >
          <span className="text-2xl leading-none mt-0.5">💡</span>
          <div>
            <p className="text-sm font-display font-bold text-foreground">
              Keep earning!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You need{" "}
              <strong>
                {rupeesToCoins(minRupees).toLocaleString("en-IN")} coins
              </strong>{" "}
              (₹{minRupees}) to withdraw. You have{" "}
              <strong>{formatCoins(coins)} coins</strong>.
            </p>
          </div>
        </motion.div>
      )}

      {withdrawalsEnabled &&
        (pendingWithdrawal ? (
          <ActiveWithdrawalCard req={pendingWithdrawal} />
        ) : (
          <WithdrawalForm
            coins={coins}
            settings={settings}
            onSuccess={() => setTab("withdrawals")}
          />
        ))}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full grid grid-cols-2 bg-muted/60">
          <TabsTrigger
            data-ocid="tab-withdrawals"
            value="withdrawals"
            className="font-display font-semibold text-sm"
          >
            Withdrawals
          </TabsTrigger>
          <TabsTrigger
            data-ocid="tab-transactions"
            value="transactions"
            className="font-display font-semibold text-sm"
          >
            Transactions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="withdrawals" className="mt-4">
          <WithdrawalHistory
            items={withdrawals}
            loading={withdrawalsQuery.isLoading}
          />
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <TransactionHistory
            items={transactions}
            loading={txQuery.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
