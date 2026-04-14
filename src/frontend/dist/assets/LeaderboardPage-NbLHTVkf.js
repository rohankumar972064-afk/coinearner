import { c as createLucideIcon, u as useActor, e as useAuth, F as useUserProfile, G as useNavigate, H as useSearch, g as useQuery, j as jsxRuntimeExports, J as Trophy, a as cn, h as formatCoins, i as Skeleton, s as createActor } from "./index-BhIOz-5R.js";
import { B as Badge } from "./badge-RZUV19z3.js";
import { T as Tabs, a as TabsList, b as TabsTrigger } from "./tabs-9i3nphs9.js";
import "./index-CZsDzmc9.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  [
    "path",
    {
      d: "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",
      key: "1vdc57"
    }
  ],
  ["path", { d: "M5 21h14", key: "11awu3" }]
];
const Crown = createLucideIcon("crown", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15",
      key: "143lza"
    }
  ],
  ["path", { d: "M11 12 5.12 2.2", key: "qhuxz6" }],
  ["path", { d: "m13 12 5.88-9.8", key: "hbye0f" }],
  ["path", { d: "M8 7h8", key: "i86dvs" }],
  ["circle", { cx: "12", cy: "17", r: "5", key: "qbz8iq" }],
  ["path", { d: "M12 18v-2h-.5", key: "fawc4q" }]
];
const Medal = createLucideIcon("medal", __iconNode);
function RankMedal({ rank }) {
  if (rank === 1)
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "w-5 h-5 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]" });
  if (rank === 2) return /* @__PURE__ */ jsxRuntimeExports.jsx(Medal, { className: "w-5 h-5 text-slate-300" });
  if (rank === 3)
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Medal, { className: "w-5 h-5 text-amber-600 drop-shadow-[0_0_4px_rgba(217,119,6,0.5)]" });
  return null;
}
function RankBadge({ rank }) {
  const base = "text-xs font-bold font-mono w-8 text-center";
  if (rank === 1)
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(base, "text-yellow-400"), children: "#1" });
  if (rank === 2) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(base, "text-slate-300"), children: "#2" });
  if (rank === 3) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(base, "text-amber-500"), children: "#3" });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn(base, "text-muted-foreground"), children: [
    "#",
    rank
  ] });
}
function RowSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 px-4 py-3 rounded-xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-8 h-4 rounded" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-10 h-10 rounded-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-32 h-3.5 rounded" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-20 h-3 rounded" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "w-16 h-5 rounded-full" })
  ] });
}
function LeaderboardPage() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { sessionToken } = useAuth();
  const { data: profile } = useUserProfile();
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const period = search.period === "weekly" ? "weekly" : "allTime";
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", period, sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getTopEarners(period, BigInt(50), sessionToken);
      } catch (err) {
        console.error("[LeaderboardPage] fetch error:", err);
        return null;
      }
    },
    enabled: !!actor && !actorFetching
  });
  const entries = (data == null ? void 0 : data.entries) ?? [];
  const userRank = (data == null ? void 0 : data.userRank) ?? null;
  const profileId = (profile == null ? void 0 : profile.id) ?? null;
  const isInTop50 = profileId !== null && entries.some((e) => e.userId === profileId);
  function handlePeriodChange(val) {
    const url = new URL(window.location.href);
    url.searchParams.set("period", val);
    window.history.replaceState({}, "", url.toString());
    navigate({ to: "/leaderboard", search: { period: val } });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-6 space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "w-5 h-5 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-bold text-2xl text-foreground", children: "Leaderboard" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "Top coin earners" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Tabs, { value: period, onValueChange: handlePeriodChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "w-full", "data-ocid": "leaderboard-tabs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TabsTrigger,
        {
          value: "allTime",
          className: "flex-1",
          "data-ocid": "tab-alltime",
          children: "All-Time"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "weekly", className: "flex-1", "data-ocid": "tab-weekly", children: "This Week" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-card rounded-2xl border border-border overflow-hidden", children: isLoading || actorFetching ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border/50", children: Array.from({ length: 10 }).map((_, i) => (
      // biome-ignore lint: index key ok for skeleton
      /* @__PURE__ */ jsxRuntimeExports.jsx(RowSkeleton, {}, i)
    )) }) : entries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex flex-col items-center justify-center py-16 px-6 gap-3",
        "data-ocid": "leaderboard-empty",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "w-12 h-12 text-muted-foreground/40" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-foreground", children: "No earners yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm text-center", children: "Start earning coins to appear on the leaderboard!" })
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      "ol",
      {
        className: "divide-y divide-border/40",
        "data-ocid": "leaderboard-list",
        children: entries.map((entry) => {
          const rank = Number(entry.rank ?? 0);
          const username = entry.username ?? "Unknown";
          const coinsEarned = entry.coinsEarned ?? BigInt(0);
          const userId = entry.userId ?? "";
          const isCurrentUser = profileId !== null && userId === profileId;
          const avatarChar = username.length > 0 ? username.charAt(0).toUpperCase() : "?";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "li",
            {
              className: cn(
                "flex items-center gap-4 px-4 py-3 transition-colors duration-150",
                rank === 1 && "bg-yellow-500/5",
                rank === 2 && "bg-slate-400/5",
                rank === 3 && "bg-amber-600/5",
                isCurrentUser && "bg-primary/8 ring-1 ring-primary/20"
              ),
              "data-ocid": `leaderboard-row-${rank}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RankBadge, { rank }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0",
                      rank === 1 ? "bg-yellow-400/20 text-yellow-400 ring-2 ring-yellow-400/30" : rank === 2 ? "bg-slate-400/20 text-slate-300 ring-2 ring-slate-400/30" : rank === 3 ? "bg-amber-600/20 text-amber-500 ring-2 ring-amber-600/30" : isCurrentUser ? "bg-primary/20 text-primary ring-2 ring-primary/30" : "bg-muted text-muted-foreground"
                    ),
                    children: avatarChar
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 truncate", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: cn(
                          "font-body font-semibold text-sm truncate",
                          isCurrentUser ? "text-primary" : "text-foreground"
                        ),
                        children: username
                      }
                    ),
                    isCurrentUser && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Badge,
                      {
                        variant: "outline",
                        className: "text-[10px] border-primary/40 text-primary shrink-0 px-1.5 py-0",
                        children: "You"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RankMedal, { rank }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right shrink-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-bold text-sm text-primary", children: formatCoins(coinsEarned) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-[11px]", children: "coins" })
                ] })
              ]
            },
            userId || String(rank)
          );
        })
      }
    ) }),
    userRank !== null && profile !== null && profile !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: cn(
          "rounded-2xl border p-4 flex items-center gap-4",
          isInTop50 ? "bg-primary/10 border-primary/30" : "bg-card border-border"
        ),
        "data-ocid": "your-rank-card",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-base text-primary ring-2 ring-primary/30 shrink-0", children: (profile.username ?? "?").charAt(0).toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-body font-semibold text-foreground text-sm truncate", children: profile.username ?? "You" }),
            isInTop50 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-primary text-xs font-medium mt-0.5", children: "🎉 You are in the top 50!" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mt-0.5", children: "Your rank" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right shrink-0 space-y-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-display font-bold text-lg text-foreground", children: [
              "#",
              Number(userRank.rank ?? 0)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-primary font-bold text-xs", children: [
              formatCoins(userRank.coinsEarned ?? BigInt(0)),
              " coins"
            ] })
          ] })
        ]
      }
    )
  ] });
}
export {
  LeaderboardPage as default
};
