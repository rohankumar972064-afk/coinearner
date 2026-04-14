import { c as createLucideIcon, u as useActor, e as useAuth, f as useCoinBalance, r as reactExports, g as useQuery, W as WithdrawalStatus, j as jsxRuntimeExports, m as motion, C as CircleAlert, h as formatCoins, i as Skeleton, k as formatRupees, l as useQueryClient, n as WithdrawalMethod, o as COINS_TO_RUPEES, p as ue, I as Input, B as Button, q as CircleCheck, T as TransactionMethod, s as createActor } from "./index-BhIOz-5R.js";
import { B as Badge } from "./badge-RZUV19z3.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-B6-C7hBz.js";
import { L as Label, C as CircleX } from "./label-BPL15Olv.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-9i3nphs9.js";
import { u as useMutation } from "./useMutation-BdllIYTx.js";
import { L as LoaderCircle } from "./loader-circle-DJ2P49iS.js";
import { C as Clock } from "./clock-Cv51Gqpc.js";
import "./index-BrrvEUxy.js";
import "./index-CZsDzmc9.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M12 17V3", key: "1cwfxf" }],
  ["path", { d: "m6 11 6 6 6-6", key: "12ii2o" }],
  ["path", { d: "M19 21H5", key: "150jfl" }]
];
const ArrowDownToLine = createLucideIcon("arrow-down-to-line", __iconNode);
const COINS_PER_RUPEE = 100;
function rupeesToCoins(r) {
  return Math.ceil(r * COINS_PER_RUPEE);
}
function formatDate(nanos) {
  try {
    return new Date(Number(nanos ?? BigInt(0)) / 1e6).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );
  } catch {
    return "";
  }
}
function txMethodIcon(method) {
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
function txMethodLabel(method) {
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
function withdrawalMethodLabel(method) {
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
const STATUS_CONFIG = {
  [WithdrawalStatus.pending]: {
    icon: Clock,
    className: "text-primary border-primary/30 bg-primary/10",
    label: "Pending"
  },
  [WithdrawalStatus.approved]: {
    icon: CircleCheck,
    className: "text-secondary border-secondary/30 bg-secondary/10",
    label: "Approved"
  },
  [WithdrawalStatus.rejected]: {
    icon: CircleX,
    className: "text-destructive border-destructive/30 bg-destructive/10",
    label: "Rejected"
  },
  [WithdrawalStatus.paid]: {
    icon: CircleCheck,
    className: "text-accent border-accent/30 bg-accent/10",
    label: "Paid"
  }
};
const STATUS_FALLBACK = {
  icon: Clock,
  className: "text-muted-foreground border-border bg-muted/40",
  label: "Unknown"
};
function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_FALLBACK;
  const { icon: Icon, className, label } = config;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Badge,
    {
      variant: "outline",
      className: `font-display font-bold text-xs flex items-center gap-1 ${className}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-3 h-3" }),
        label
      ]
    }
  );
}
function BalanceHeader({
  coins,
  rupees,
  isLoading
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: -16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.45 },
      className: "relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary shadow-xl p-6 text-primary-foreground",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 blur-xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-body font-medium opacity-75 mb-2 relative z-10", children: "🪙 Wallet Balance" }),
        isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 relative z-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-36 bg-white/20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-6 w-24 bg-white/20" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { scale: 0.92 },
              animate: { scale: 1 },
              transition: { type: "spring", stiffness: 260, damping: 18 },
              className: "flex items-baseline gap-2 mb-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-extrabold text-5xl leading-none", children: formatCoins(coins) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-semibold text-lg opacity-75", children: "Coins" })
              ]
            },
            coins.toString()
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold text-2xl opacity-90", children: formatRupees(rupees) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs opacity-60 mt-1 font-body", children: "1,000 coins = ₹10 • Min withdrawal shown below" })
        ] })
      ]
    }
  );
}
function ActiveWithdrawalCard({ req }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      initial: { opacity: 0, scale: 0.97 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.3 },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-l-4 border-l-primary bg-card shadow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2 pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-sm font-bold text-muted-foreground uppercase tracking-wide", children: "Active Request" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: req.status })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3 pb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-2xl", children: "💸" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-extrabold text-2xl text-foreground leading-none", children: formatRupees(Number(req.rupeeAmount ?? 0)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
                "via ",
                withdrawalMethodLabel(req.method)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground border-t border-border pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "To:" }),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: req.details ?? "" })
          ] }),
          req.status === WithdrawalStatus.rejected && req.adminNote && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: "Admin note:" }),
            " ",
            req.adminNote
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: formatDate(req.createdAt) })
        ] })
      ] })
    }
  );
}
const METHODS = [
  { value: WithdrawalMethod.upi, label: "UPI" },
  { value: WithdrawalMethod.paytm, label: "Paytm" },
  { value: WithdrawalMethod.bank, label: "Bank" }
];
function methodPlaceholder(method) {
  if (method === WithdrawalMethod.upi) return "yourname@upi";
  if (method === WithdrawalMethod.paytm) return "10-digit Paytm number";
  return "Account no, IFSC, Bank name";
}
function WithdrawalForm({
  coins,
  settings,
  onSuccess
}) {
  const { actor } = useActor(createActor);
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const [method, setMethod] = reactExports.useState(WithdrawalMethod.upi);
  const [details, setDetails] = reactExports.useState("");
  const [amountStr, setAmountStr] = reactExports.useState("");
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
        sessionToken
      );
    },
    onSuccess: () => {
      ue.success("Withdrawal request submitted!", {
        description: "Admin will review within 24–48 hours."
      });
      setAmountStr("");
      setDetails("");
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      queryClient.invalidateQueries({ queryKey: ["myWithdrawals"] });
      onSuccess();
    },
    onError: (e) => ue.error(`Failed: ${e.message}`)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "card-elevated", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "font-display text-base font-bold flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownToLine, { className: "w-4 h-4 text-primary" }),
      "Request Withdrawal"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Payment Method" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: METHODS.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            "data-ocid": `method-${m.value}`,
            onClick: () => {
              setMethod(m.value);
              setDetails("");
            },
            className: `py-2.5 px-2 rounded-xl border text-sm font-display font-bold transition-smooth focus-visible:ring-2 focus-visible:ring-ring ${method === m.value ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-muted/40 border-border text-foreground hover:border-primary/50 hover:bg-muted/70"}`,
            children: m.label
          },
          m.value
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: method === WithdrawalMethod.bank ? "Bank Details" : `${withdrawalMethodLabel(method)} ID` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            "data-ocid": "input-payment-details",
            placeholder: methodPlaceholder(method),
            value: details,
            onChange: (e) => setDetails(e.target.value),
            className: "bg-input"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Amount (₹)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: "text-xs font-semibold text-primary transition-smooth hover:opacity-70",
              onClick: () => setAmountStr(String(maxRupees)),
              children: [
                "Max ₹",
                maxRupees
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm", children: "₹" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              "data-ocid": "input-withdrawal-amount",
              type: "number",
              min: minRupees,
              max: maxRupees,
              placeholder: String(minRupees),
              value: amountStr,
              onChange: (e) => setAmountStr(e.target.value),
              className: "pl-7 bg-input"
            }
          )
        ] }),
        rupeeAmt > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs pt-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            "Coins deducted:",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: hasCoins ? "font-bold text-foreground" : "font-bold text-destructive",
                children: [
                  "🪙 ",
                  coinsNeeded.toLocaleString("en-IN")
                ]
              }
            )
          ] }),
          !meetsMin && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-destructive font-semibold", children: [
            "Min ₹",
            minRupees
          ] }),
          meetsMin && !hasCoins && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive font-semibold", children: "Not enough coins" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          "data-ocid": "btn-submit-withdrawal",
          className: "btn-coin w-full",
          disabled: !canSubmit || mutation.isPending,
          onClick: () => mutation.mutate(),
          children: mutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin mr-2" }),
            "Submitting…"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownToLine, { className: "w-4 h-4 mr-2" }),
            "Withdraw ",
            rupeeAmt > 0 ? formatRupees(rupeeAmt) : ""
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-muted-foreground font-body", children: "Admin reviews manually • Usually 24–48 hrs" })
    ] })
  ] });
}
function WithdrawalHistory({
  items,
  loading
}) {
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [1, 2, 3].map((k) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-16 rounded-xl w-full" }, k)) });
  }
  if (items.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "empty-withdrawals",
        className: "flex flex-col items-center py-14 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-5xl mb-3", children: "📭" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold text-foreground", children: "No withdrawals yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Your withdrawal history will appear here" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: items.map((w, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, x: -12 },
      animate: { opacity: 1, x: 0 },
      transition: { delay: i * 0.05 },
      "data-ocid": `withdrawal-row-${w.id}`,
      className: "flex items-center gap-3 p-3 rounded-xl bg-card border border-border",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl flex-shrink-0", children: "💸" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-sm truncate", children: withdrawalMethodLabel(w.method) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground truncate", children: formatDate(w.createdAt) }),
          w.status === WithdrawalStatus.rejected && w.adminNote && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive mt-0.5 truncate italic", children: w.adminNote })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-1 flex-shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-bold text-sm", children: formatRupees(Number(w.rupeeAmount ?? 0)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: w.status })
        ] })
      ]
    },
    w.id.toString()
  )) });
}
function TransactionHistory({
  items,
  loading
}) {
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [1, 2, 3, 4].map((k) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-14 rounded-xl w-full" }, k)) });
  }
  if (items.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "empty-transactions",
        className: "flex flex-col items-center py-14 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-5xl mb-3", children: "🪙" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold text-foreground", children: "No activity yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Earn coins to see your history" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: items.map((tx, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, x: -12 },
      animate: { opacity: 1, x: 0 },
      transition: { delay: i * 0.04 },
      "data-ocid": `tx-row-${tx.id}`,
      className: "flex items-center gap-3 p-3 rounded-xl bg-card border border-border",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl flex-shrink-0", children: txMethodIcon(tx.method) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-sm truncate", children: txMethodLabel(tx.method) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: formatDate(tx.createdAt) }),
          tx.note && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground truncate italic", children: tx.note })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: `font-display font-bold text-sm flex-shrink-0 ${tx.isCredit ? "text-accent" : "text-destructive"}`,
            children: [
              tx.isCredit ? "+" : "-",
              formatCoins(tx.amount ?? BigInt(0)),
              " 🪙"
            ]
          }
        )
      ]
    },
    tx.id.toString()
  )) });
}
function useWithdrawalStatusToasts(actor, sessionToken) {
  const seenRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const firstLoad = reactExports.useRef(true);
  useQuery({
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
              ue.success(`✅ Withdrawal ₹${w.rupeeAmount} approved!`);
            } else if (w.status === WithdrawalStatus.paid) {
              ue.success(`💸 Withdrawal ₹${w.rupeeAmount} paid!`);
            } else if (w.status === WithdrawalStatus.rejected) {
              ue.error("❌ Withdrawal rejected", {
                description: w.adminNote || "Please contact support."
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
    refetchInterval: 6e4
  });
}
function WalletPage() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { sessionToken } = useAuth();
  const { coins, rupees, isLoading: balanceLoading } = useCoinBalance();
  const [tab, setTab] = reactExports.useState("withdrawals");
  useWithdrawalStatusToasts(actor, sessionToken);
  const settingsQuery = useQuery({
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
    staleTime: 6e4
  });
  const withdrawalsQuery = useQuery({
    queryKey: ["myWithdrawals", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMyWithdrawals(sessionToken);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching
  });
  const txQuery = useQuery({
    queryKey: ["transactionHistory", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const { transactions: transactions2 } = await actor.getTransactionHistory(
          BigInt(50),
          BigInt(0),
          sessionToken
        );
        return transactions2;
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching
  });
  const settings = settingsQuery.data;
  const withdrawals = withdrawalsQuery.data ?? [];
  const transactions = txQuery.data ?? [];
  const pendingWithdrawal = withdrawals.find(
    (w) => w.status === WithdrawalStatus.pending
  );
  const withdrawalsEnabled = settings ? settings.withdrawalsEnabled : true;
  const minRupees = settings ? Number(settings.minWithdrawalRupees) : 50;
  const hasEnoughToWithdraw = rupees >= minRupees;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", "data-ocid": "wallet-page", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-black text-2xl text-foreground", children: "Wallet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground font-body text-sm mt-0.5", children: "Manage your coins and withdrawals" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BalanceHeader, { coins, rupees, isLoading: balanceLoading }),
    !withdrawalsEnabled && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        className: "rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-start gap-3",
        "data-ocid": "withdrawals-paused",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-5 h-5 text-destructive shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-display font-bold text-foreground", children: "Withdrawals are currently paused" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "The admin has temporarily disabled withdrawals. Please check back later." })
          ] })
        ]
      }
    ),
    withdrawalsEnabled && !balanceLoading && !hasEnoughToWithdraw && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        className: "rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 flex items-start gap-3",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl leading-none mt-0.5", children: "💡" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-display font-bold text-foreground", children: "Keep earning!" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
              "You need",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                rupeesToCoins(minRupees).toLocaleString("en-IN"),
                " coins"
              ] }),
              " ",
              "(₹",
              minRupees,
              ") to withdraw. You have",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                formatCoins(coins),
                " coins"
              ] }),
              "."
            ] })
          ] })
        ]
      }
    ),
    withdrawalsEnabled && (pendingWithdrawal ? /* @__PURE__ */ jsxRuntimeExports.jsx(ActiveWithdrawalCard, { req: pendingWithdrawal }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      WithdrawalForm,
      {
        coins,
        settings,
        onSuccess: () => setTab("withdrawals")
      }
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: tab, onValueChange: setTab, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "w-full grid grid-cols-2 bg-muted/60", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabsTrigger,
          {
            "data-ocid": "tab-withdrawals",
            value: "withdrawals",
            className: "font-display font-semibold text-sm",
            children: "Withdrawals"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabsTrigger,
          {
            "data-ocid": "tab-transactions",
            value: "transactions",
            className: "font-display font-semibold text-sm",
            children: "Transactions"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "withdrawals", className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        WithdrawalHistory,
        {
          items: withdrawals,
          loading: withdrawalsQuery.isLoading
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "transactions", className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        TransactionHistory,
        {
          items: transactions,
          loading: txQuery.isLoading
        }
      ) })
    ] })
  ] });
}
export {
  WalletPage as default
};
