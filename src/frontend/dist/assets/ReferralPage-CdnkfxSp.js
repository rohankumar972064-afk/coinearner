import { c as createLucideIcon, u as useActor, e as useAuth, r as reactExports, f as useCoinBalance, g as useQuery, D as Share2, j as jsxRuntimeExports, m as motion, C as CircleAlert, E as Wallet, h as formatCoins, i as Skeleton, B as Button, I as Input, p as ue, s as createActor } from "./index-BhIOz-5R.js";
import { B as Badge } from "./badge-RZUV19z3.js";
import { C as Card, c as CardContent } from "./card-B6-C7hBz.js";
import { u as useMutation } from "./useMutation-BdllIYTx.js";
import { U as Users } from "./index-CESyBe_q.js";
import { G as Gift } from "./gift-DJnwgLAS.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]];
const Check = createLucideIcon("check", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
];
const Copy = createLucideIcon("copy", __iconNode);
function ReferralPage() {
  const { actor, isFetching } = useActor(createActor);
  const { sessionToken } = useAuth();
  const [copiedCode, setCopiedCode] = reactExports.useState(false);
  const [copiedLink, setCopiedLink] = reactExports.useState(false);
  const [applyCode, setApplyCode] = reactExports.useState("");
  const { coins } = useCoinBalance();
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
    enabled: !!actor && !isFetching,
    staleTime: 6e4
  });
  const { data: referralCode = "", isLoading: codeLoading } = useQuery({
    queryKey: ["referralCode", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return "";
      try {
        return await actor.getMyReferralCode(sessionToken);
      } catch {
        return "";
      }
    },
    enabled: !!actor && !isFetching
  });
  const settings = settingsQuery.data;
  const referralsEnabled = settings ? settings.referralsEnabled : true;
  const referralBonus = settings ? Number(settings.referralBonus) : 500;
  const safeCode = referralCode ?? "";
  const inviteLink = safeCode ? `${window.location.origin}/?ref=${safeCode}` : "";
  const applyMutation = useMutation({
    mutationFn: async (code) => {
      if (!actor) throw new Error("Not connected");
      await actor.applyReferralCode(code, sessionToken);
    },
    onSuccess: () => {
      ue.success(
        `🎁 Referral code applied! You earned ${referralBonus} bonus coins.`
      );
      setApplyCode("");
    },
    onError: (e) => ue.error(e.message || "Failed to apply code")
  });
  const handleCopyCode = async () => {
    if (!safeCode) return;
    try {
      await navigator.clipboard.writeText(safeCode);
      setCopiedCode(true);
      ue.success("Referral code copied!");
      setTimeout(() => setCopiedCode(false), 2e3);
    } catch {
      ue.error("Could not copy to clipboard");
    }
  };
  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      ue.success("Invite link copied!");
      setTimeout(() => setCopiedLink(false), 2e3);
    } catch {
      ue.error("Could not copy to clipboard");
    }
  };
  const handleShare = () => {
    const text = `💰 Join CoinEarner and earn real money!
Use my referral code: ${safeCode}
👉 ${inviteLink}`;
    if (navigator.share) {
      navigator.share({
        title: "CoinEarner – Earn Real Money",
        text,
        url: inviteLink
      }).catch(() => {
      });
    } else {
      navigator.clipboard.writeText(text).catch(() => {
      });
      ue.success("Share text copied to clipboard!");
    }
  };
  const steps = [
    {
      icon: Share2,
      step: "1",
      title: "Share your code",
      desc: "Send your unique referral code or invite link to friends",
      color: "text-secondary",
      bg: "bg-secondary/10"
    },
    {
      icon: Users,
      step: "2",
      title: "Friend signs up",
      desc: "They register on CoinEarner using your referral code",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      icon: Gift,
      step: "3",
      title: `You both earn ${referralBonus} coins`,
      desc: `You both get ${referralBonus} coins instantly — that's ₹${(referralBonus / 100).toFixed(0)} each!`,
      color: "text-accent",
      bg: "bg-accent/10"
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 pb-6", "data-ocid": "referral-page", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.h1,
        {
          initial: { opacity: 0, y: -8 },
          animate: { opacity: 1, y: 0 },
          className: "font-display font-black text-2xl text-foreground",
          children: "Refer & Earn 🪙"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.p,
        {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay: 0.08 },
          className: "text-muted-foreground font-body text-sm mt-0.5",
          children: [
            "Invite friends and earn ",
            referralBonus,
            " coins per referral"
          ]
        }
      )
    ] }),
    !referralsEnabled && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        className: "rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-start gap-3",
        "data-ocid": "referrals-paused",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-5 h-5 text-destructive shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-display font-bold text-foreground", children: "Referrals are currently paused" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "The referral program is temporarily disabled. Existing referrals still count." })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.97 },
        animate: { opacity: 1, scale: 1 },
        transition: { delay: 0.1 },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-0 shadow-md overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-r from-primary via-primary to-secondary p-[1px] rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-br from-primary/5 to-secondary/10 rounded-[calc(var(--radius)-1px)] p-4 flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "w-7 h-7 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-body text-xs text-muted-foreground", children: "Your Coin Balance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-display font-black text-3xl text-primary leading-none mt-0.5", children: [
              formatCoins(coins),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-muted-foreground ml-1", children: "coins" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto text-right shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-primary/10 text-primary border-primary/20 font-display text-xs", children: [
            referralBonus,
            "/referral"
          ] }) })
        ] }) }) })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.15 },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-border shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "w-4 h-4 text-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-sm text-foreground", children: "Your Referral Code" })
          ] }),
          codeLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-14 w-full rounded-xl" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-xl px-4 py-3 font-display font-black text-2xl text-primary tracking-[0.25em] text-center select-all", children: safeCode || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: handleCopyCode,
                className: "w-12 h-12 flex items-center justify-center rounded-xl bg-muted border border-border hover:bg-card hover:border-primary/40 transition-smooth shrink-0",
                "aria-label": "Copy referral code",
                "data-ocid": "btn-copy-code",
                children: copiedCode ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-5 h-5 text-accent" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-5 h-5 text-muted-foreground" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-body text-xs text-muted-foreground mb-2", children: "Invite Link" }),
            codeLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-11 w-full rounded-xl" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 bg-muted rounded-xl px-3 py-2.5 font-mono text-xs text-muted-foreground truncate border border-border min-w-0", children: inviteLink || "Loading..." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: handleCopyLink,
                  className: "w-10 h-10 flex items-center justify-center rounded-xl bg-muted border border-border hover:bg-card hover:border-secondary/40 transition-smooth shrink-0",
                  "aria-label": "Copy invite link",
                  "data-ocid": "btn-copy-link",
                  children: copiedLink ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 text-accent" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4 text-muted-foreground" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              className: "w-full btn-coin-secondary gap-2",
              onClick: handleShare,
              disabled: !safeCode || !referralsEnabled,
              "data-ocid": "btn-share-code",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "w-4 h-4" }),
                "Share via WhatsApp / More"
              ]
            }
          )
        ] }) })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-sm text-foreground mb-3 px-0.5", children: "How It Works" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2.5", children: steps.map(({ icon: Icon, step, title, desc, color, bg }, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        motion.div,
        {
          initial: { opacity: 0, x: -12 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: 0.25 + i * 0.08 },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-card border-border shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `w-9 h-9 rounded-full ${bg} flex items-center justify-center shrink-0`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: `font-display font-black ${color} text-sm`,
                    children: step
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `w-4 h-4 ${color}` })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-sm text-foreground", children: title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-body text-xs text-muted-foreground mt-0.5 leading-relaxed", children: desc })
            ] })
          ] }) }) })
        },
        step
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.5 },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-muted/40 border-dashed border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "w-4 h-4 text-accent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-sm text-foreground", children: "Have a Referral Code?" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-body text-xs text-muted-foreground mb-3", children: [
            "Enter a friend's referral code to get ",
            referralBonus,
            " bonus coins!"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: applyCode,
                onChange: (e) => setApplyCode(e.target.value.toUpperCase()),
                placeholder: "e.g. RAHUL2024",
                className: "flex-1 font-display font-bold tracking-wider uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal",
                maxLength: 12,
                "data-ocid": "input-referral-code"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                onClick: () => applyMutation.mutate(applyCode),
                disabled: !applyCode.trim() || applyMutation.isPending || !actor || !referralsEnabled,
                className: "btn-coin shrink-0",
                "data-ocid": "btn-apply-code",
                children: applyMutation.isPending ? "Applying…" : "Apply"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Badge,
            {
              variant: "outline",
              className: "mt-3 text-xs text-accent border-accent/30 bg-accent/5 font-body",
              children: [
                "🎁 ",
                referralBonus,
                " bonus coins on first-time code use"
              ]
            }
          )
        ] }) })
      }
    )
  ] });
}
export {
  ReferralPage as default
};
