import { c as createLucideIcon, r as reactExports, j as jsxRuntimeExports, a as cn, m as motion, i as Skeleton, u as useActor, g as useQuery, e as useAuth, l as useQueryClient, C as CircleAlert, B as Button, q as CircleCheck, p as ue, L as Coins, h as formatCoins, s as createActor } from "./index-BhIOz-5R.js";
import { B as Badge } from "./badge-RZUV19z3.js";
import { C as Card, c as CardContent } from "./card-B6-C7hBz.js";
import { P as Primitive } from "./index-BrrvEUxy.js";
import { u as useMutation } from "./useMutation-BdllIYTx.js";
import { L as LoaderCircle } from "./loader-circle-DJ2P49iS.js";
import { G as Gift } from "./gift-DJnwgLAS.js";
import { C as Clock } from "./clock-Cv51Gqpc.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1", key: "tgr4d6" }],
  [
    "path",
    {
      d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
      key: "116196"
    }
  ],
  ["path", { d: "M12 11h4", key: "1jrz19" }],
  ["path", { d: "M12 16h4", key: "n85exb" }],
  ["path", { d: "M8 11h.01", key: "1dfujw" }],
  ["path", { d: "M8 16h.01", key: "18s6g9" }]
];
const ClipboardList = createLucideIcon("clipboard-list", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [["polygon", { points: "6 3 20 12 6 21 6 3", key: "1oa8hb" }]];
const Play = createLucideIcon("play", __iconNode$1);
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
      d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",
      key: "ftymec"
    }
  ],
  ["rect", { x: "2", y: "6", width: "14", height: "12", rx: "2", key: "158x01" }]
];
const Video = createLucideIcon("video", __iconNode);
function createContextScope(scopeName, createContextScopeDeps = []) {
  let defaultContexts = [];
  function createContext3(rootComponentName, defaultContext) {
    const BaseContext = reactExports.createContext(defaultContext);
    BaseContext.displayName = rootComponentName + "Context";
    const index = defaultContexts.length;
    defaultContexts = [...defaultContexts, defaultContext];
    const Provider = (props) => {
      var _a;
      const { scope, children, ...context } = props;
      const Context = ((_a = scope == null ? void 0 : scope[scopeName]) == null ? void 0 : _a[index]) || BaseContext;
      const value = reactExports.useMemo(() => context, Object.values(context));
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Context.Provider, { value, children });
    };
    Provider.displayName = rootComponentName + "Provider";
    function useContext2(consumerName, scope) {
      var _a;
      const Context = ((_a = scope == null ? void 0 : scope[scopeName]) == null ? void 0 : _a[index]) || BaseContext;
      const context = reactExports.useContext(Context);
      if (context) return context;
      if (defaultContext !== void 0) return defaultContext;
      throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }
    return [Provider, useContext2];
  }
  const createScope = () => {
    const scopeContexts = defaultContexts.map((defaultContext) => {
      return reactExports.createContext(defaultContext);
    });
    return function useScope(scope) {
      const contexts = (scope == null ? void 0 : scope[scopeName]) || scopeContexts;
      return reactExports.useMemo(
        () => ({ [`__scope${scopeName}`]: { ...scope, [scopeName]: contexts } }),
        [scope, contexts]
      );
    };
  };
  createScope.scopeName = scopeName;
  return [createContext3, composeContextScopes(createScope, ...createContextScopeDeps)];
}
function composeContextScopes(...scopes) {
  const baseScope = scopes[0];
  if (scopes.length === 1) return baseScope;
  const createScope = () => {
    const scopeHooks = scopes.map((createScope2) => ({
      useScope: createScope2(),
      scopeName: createScope2.scopeName
    }));
    return function useComposedScopes(overrideScopes) {
      const nextScopes = scopeHooks.reduce((nextScopes2, { useScope, scopeName }) => {
        const scopeProps = useScope(overrideScopes);
        const currentScope = scopeProps[`__scope${scopeName}`];
        return { ...nextScopes2, ...currentScope };
      }, {});
      return reactExports.useMemo(() => ({ [`__scope${baseScope.scopeName}`]: nextScopes }), [nextScopes]);
    };
  };
  createScope.scopeName = baseScope.scopeName;
  return createScope;
}
var PROGRESS_NAME = "Progress";
var DEFAULT_MAX = 100;
var [createProgressContext] = createContextScope(PROGRESS_NAME);
var [ProgressProvider, useProgressContext] = createProgressContext(PROGRESS_NAME);
var Progress$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeProgress,
      value: valueProp = null,
      max: maxProp,
      getValueLabel = defaultGetValueLabel,
      ...progressProps
    } = props;
    if ((maxProp || maxProp === 0) && !isValidMaxNumber(maxProp)) {
      console.error(getInvalidMaxError(`${maxProp}`, "Progress"));
    }
    const max = isValidMaxNumber(maxProp) ? maxProp : DEFAULT_MAX;
    if (valueProp !== null && !isValidValueNumber(valueProp, max)) {
      console.error(getInvalidValueError(`${valueProp}`, "Progress"));
    }
    const value = isValidValueNumber(valueProp, max) ? valueProp : null;
    const valueLabel = isNumber(value) ? getValueLabel(value, max) : void 0;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressProvider, { scope: __scopeProgress, value, max, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        "aria-valuemax": max,
        "aria-valuemin": 0,
        "aria-valuenow": isNumber(value) ? value : void 0,
        "aria-valuetext": valueLabel,
        role: "progressbar",
        "data-state": getProgressState(value, max),
        "data-value": value ?? void 0,
        "data-max": max,
        ...progressProps,
        ref: forwardedRef
      }
    ) });
  }
);
Progress$1.displayName = PROGRESS_NAME;
var INDICATOR_NAME = "ProgressIndicator";
var ProgressIndicator = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeProgress, ...indicatorProps } = props;
    const context = useProgressContext(INDICATOR_NAME, __scopeProgress);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        "data-state": getProgressState(context.value, context.max),
        "data-value": context.value ?? void 0,
        "data-max": context.max,
        ...indicatorProps,
        ref: forwardedRef
      }
    );
  }
);
ProgressIndicator.displayName = INDICATOR_NAME;
function defaultGetValueLabel(value, max) {
  return `${Math.round(value / max * 100)}%`;
}
function getProgressState(value, maxValue) {
  return value == null ? "indeterminate" : value === maxValue ? "complete" : "loading";
}
function isNumber(value) {
  return typeof value === "number";
}
function isValidMaxNumber(max) {
  return isNumber(max) && !isNaN(max) && max > 0;
}
function isValidValueNumber(value, max) {
  return isNumber(value) && !isNaN(value) && value <= max && value >= 0;
}
function getInvalidMaxError(propValue, componentName) {
  return `Invalid prop \`max\` of value \`${propValue}\` supplied to \`${componentName}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${DEFAULT_MAX}\`.`;
}
function getInvalidValueError(propValue, componentName) {
  return `Invalid prop \`value\` of value \`${propValue}\` supplied to \`${componentName}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${DEFAULT_MAX} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`;
}
var Root = Progress$1;
var Indicator = ProgressIndicator;
function Progress({
  className,
  value,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root,
    {
      "data-slot": "progress",
      className: cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Indicator,
        {
          "data-slot": "progress-indicator",
          className: "bg-primary h-full w-full flex-1 transition-all",
          style: { transform: `translateX(-${100 - (value || 0)}%)` }
        }
      )
    }
  );
}
const AD_DURATION_SECS = 30;
function useSettings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
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
}
function AdCountdownRing({ progress }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const strokeDash = circ - progress / 100 * circ;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "svg",
    {
      width: "64",
      height: "64",
      className: "-rotate-90",
      "aria-label": "Ad countdown progress",
      role: "img",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: "32",
            cy: "32",
            r,
            strokeWidth: "5",
            className: "stroke-muted fill-none"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: "32",
            cy: "32",
            r,
            strokeWidth: "5",
            className: "fill-none stroke-primary transition-all duration-300",
            strokeDasharray: circ,
            strokeDashoffset: strokeDash,
            strokeLinecap: "round"
          }
        )
      ]
    }
  );
}
function WatchAdCard({
  settings
}) {
  const { actor, isFetching } = useActor(createActor);
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const [watching, setWatching] = reactExports.useState(false);
  const [secsLeft, setSecsLeft] = reactExports.useState(AD_DURATION_SECS);
  const [adsToday, setAdsToday] = reactExports.useState(0);
  const intervalRef = reactExports.useRef(null);
  const maxDailyAds = settings ? Number(settings.maxDailyAdWatches) : 10;
  const coinsPerAd = settings ? Number(settings.coinsPerAd) : 5;
  const adsEnabled = settings ? settings.adsEnabled : true;
  reactExports.useEffect(() => {
    try {
      const today = (/* @__PURE__ */ new Date()).toDateString();
      const stored = sessionStorage.getItem("ce_ads_date");
      const storedCount = sessionStorage.getItem("ce_ads_count");
      if (stored === today && storedCount) {
        setAdsToday(Number.parseInt(storedCount, 10));
      } else {
        sessionStorage.setItem("ce_ads_date", today);
        sessionStorage.setItem("ce_ads_count", "0");
      }
    } catch {
    }
  }, []);
  const finishAd = async () => {
    if (!actor) return;
    try {
      const coins = await actor.watchAd(sessionToken);
      const newCount = adsToday + 1;
      setAdsToday(newCount);
      try {
        sessionStorage.setItem("ce_ads_count", String(newCount));
      } catch {
      }
      ue.success(`🎬 Ad complete! +${coins.toString()} coins earned`, {
        duration: 4500
      });
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      queryClient.invalidateQueries({ queryKey: ["transactionHistory"] });
    } catch {
      ue.error("Could not record ad. Please try again.");
    }
  };
  const handleWatchAd = () => {
    if (watching || adsToday >= maxDailyAds || !actor) return;
    setWatching(true);
    setSecsLeft(AD_DURATION_SECS);
    let remaining = AD_DURATION_SECS;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setSecsLeft(remaining);
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setWatching(false);
        finishAd();
      }
    }, 1e3);
  };
  reactExports.useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    []
  );
  const limitReached = adsToday >= maxDailyAds;
  const progress = (AD_DURATION_SECS - secsLeft) / AD_DURATION_SECS * 100;
  const pct = maxDailyAds > 0 ? adsToday / maxDailyAds * 100 : 0;
  if (!adsEnabled) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-4",
        "data-ocid": "ads-paused",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-5 h-5 text-muted-foreground shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-body", children: "Ads are currently paused. Check back later." })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 14 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.35 },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Card,
        {
          className: "overflow-hidden border-primary/20 shadow-md",
          "data-ocid": "watch-ads-card",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 bg-gradient-to-r from-primary via-primary/60 to-secondary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 relative flex items-center justify-center w-16 h-16", children: watching ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(AdCountdownRing, { progress }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute font-display font-black text-base text-primary tabular-nums", children: secsLeft })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Video, { className: "w-7 h-7 text-primary" }) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-black text-base text-foreground", children: "Watch Video Ads" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground font-body text-xs mt-0.5", children: [
                    "Earn",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-primary font-bold", children: [
                      coinsPerAd,
                      " coins"
                    ] }),
                    " ",
                    "per video"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Progress,
                      {
                        value: pct,
                        className: `h-1.5 ${limitReached ? "opacity-50" : ""}`
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "span",
                      {
                        className: `text-xs font-display font-bold tabular-nums shrink-0 ${limitReached ? "text-destructive" : "text-muted-foreground"}`,
                        children: [
                          adsToday,
                          "/",
                          maxDailyAds
                        ]
                      }
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  className: "w-full mt-4 font-display font-bold h-11 text-sm gap-2",
                  variant: limitReached ? "outline" : "default",
                  onClick: handleWatchAd,
                  disabled: watching || limitReached || !actor || isFetching,
                  "data-ocid": "btn-watch-ad",
                  children: watching ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }),
                    "Watching… ",
                    secsLeft,
                    "s remaining"
                  ] }) : limitReached ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "w-4 h-4" }),
                    "Daily limit reached"
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "w-4 h-4 fill-current" }),
                    "Watch Now"
                  ] })
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
function DailyRewardSection({
  settings
}) {
  const { actor } = useActor(createActor);
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const dailyEnabled = settings ? settings.dailyRewardsEnabled : true;
  const baseReward = settings ? Number(settings.dailyBaseReward) : 10;
  const { data: transactions } = useQuery({
    queryKey: ["transactionHistory", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const { transactions: transactions2 } = await actor.getTransactionHistory(
          BigInt(20),
          BigInt(0),
          sessionToken
        );
        return transactions2;
      } catch {
        return [];
      }
    },
    enabled: !!actor
  });
  const [claimedSession, setClaimedSession] = reactExports.useState(false);
  const hasClaimed = claimedSession || (() => {
    if (!transactions) return false;
    try {
      const midnight = /* @__PURE__ */ new Date();
      midnight.setHours(0, 0, 0, 0);
      return (transactions ?? []).some((t) => {
        const ms = Number((t.createdAt ?? BigInt(0)) / BigInt(1e6));
        return ms >= midnight.getTime() && (t.method ?? "").toLowerCase() === "daily";
      });
    } catch {
      return false;
    }
  })();
  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.claimDailyReward(sessionToken);
    },
    onSuccess: (coins) => {
      setClaimedSession(true);
      ue.success(`🎉 Daily reward claimed! +${coins.toString()} coins`, {
        description: "Keep your streak alive — come back tomorrow!"
      });
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["transactionHistory"] });
    },
    onError: (e) => ue.error(e.message || "Failed to claim")
  });
  if (!dailyEnabled) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-4",
        "data-ocid": "daily-rewards-paused",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-5 h-5 text-muted-foreground shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-body", children: "Daily rewards are currently paused." })
        ]
      }
    );
  }
  const timeLeft = (() => {
    const now = /* @__PURE__ */ new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 36e5);
    const m = Math.floor(diff % 36e5 / 6e4);
    return `${h}h ${m}m`;
  })();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "card-elevated", "data-ocid": "daily-reward-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "w-5 h-5 text-accent" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-bold text-foreground text-sm", children: "Daily Reward" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "+",
          baseReward,
          " base coins every day"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Badge,
        {
          variant: "outline",
          className: "ml-auto font-display font-bold text-accent border-accent/30 bg-accent/5",
          children: [
            baseReward,
            " coins"
          ]
        }
      )
    ] }),
    hasClaimed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/60 text-muted-foreground text-sm font-display",
        "data-ocid": "daily-claimed",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Next claim in ",
            timeLeft
          ] })
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        className: "w-full font-display font-bold gap-2",
        onClick: () => mutation.mutate(),
        disabled: mutation.isPending || !actor,
        "data-ocid": "daily-claim-btn",
        children: mutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }),
          "Claiming…"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "w-4 h-4" }),
          "Claim Daily Reward"
        ] })
      }
    )
  ] }) });
}
function TaskList() {
  const { actor, isFetching } = useActor(createActor);
  const { sessionToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listTasks();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching
  });
  const { data: completions = [], isLoading: completionsLoading } = useQuery({
    queryKey: ["completedTasks", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMyCompletedTasks(sessionToken);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching
  });
  const completedIds = new Set(
    (completions ?? []).map((c) => c.taskId.toString())
  );
  const taskMutation = useMutation({
    mutationFn: async (taskId) => {
      if (!actor) throw new Error("Not connected");
      return actor.completeTask(taskId, sessionToken);
    },
    onSuccess: (coins, taskId) => {
      ue.success(`✅ Task complete! +${coins.toString()} coins`, {
        duration: 4e3
      });
      queryClient.invalidateQueries({ queryKey: ["completedTasks"] });
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      queryClient.setQueryData(
        ["completedTasks"],
        (old = []) => [
          ...old,
          {
            taskId,
            userId: null,
            completedAt: BigInt(Date.now())
          }
        ]
      );
    },
    onError: (e) => ue.error(e.message || "Task failed. Try again.")
  });
  const activeTasks = (tasks ?? []).filter((t) => t.isActive);
  if (tasksLoading || completionsLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [0, 1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-[76px] w-full rounded-xl" }, i)) });
  }
  if (activeTasks.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex flex-col items-center justify-center py-10 text-center bg-muted/30 rounded-2xl border border-dashed border-border",
        "data-ocid": "empty-tasks",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "w-10 h-10 text-muted-foreground mb-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-semibold text-foreground text-sm", children: "No tasks yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground font-body text-xs mt-1", children: "New tasks will appear here soon" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: activeTasks.map((task, i) => {
    var _a;
    const done = completedIds.has(task.id.toString());
    const isPending = taskMutation.isPending && ((_a = taskMutation.variables) == null ? void 0 : _a.toString()) === task.id.toString();
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0, x: -12 },
        animate: { opacity: 1, x: 0 },
        transition: { delay: 0.1 + i * 0.07 },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Card,
          {
            className: `transition-all duration-200 shadow-sm ${done ? "bg-muted/40 border-border opacity-80" : "bg-card border-border hover:shadow-md"}`,
            "data-ocid": `task-card-${task.id.toString()}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${done ? "bg-accent/20" : "bg-primary/10"}`,
                  children: done ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "w-5 h-5 text-accent" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Coins, { className: "w-5 h-5 text-primary" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    className: `font-display font-bold text-sm leading-tight ${done ? "line-through text-muted-foreground" : "text-foreground"}`,
                    children: task.title ?? ""
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-body mt-0.5 truncate", children: task.description ?? "" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-1.5 shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Badge,
                  {
                    variant: "outline",
                    className: "font-display font-black text-xs text-primary border-primary/40 bg-primary/5 px-2",
                    children: [
                      "+",
                      formatCoins(task.coinReward ?? BigInt(0))
                    ]
                  }
                ),
                done ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-accent font-display font-semibold", children: "Done ✓" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    size: "sm",
                    className: "h-7 px-3 text-xs font-display font-bold",
                    onClick: () => taskMutation.mutate(task.id),
                    disabled: isPending || !actor || isFetching,
                    "data-ocid": `btn-complete-task-${task.id.toString()}`,
                    children: isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3 h-3 animate-spin" }) : "Complete"
                  }
                )
              ] })
            ] }) })
          }
        )
      },
      task.id.toString()
    );
  }) });
}
function EarnPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 pb-6", "data-ocid": "earn-page", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display font-black text-2xl text-foreground tracking-tight", children: "Earn Coins" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground font-body text-sm mt-0.5", children: "Watch ads & complete tasks to grow your balance" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3", children: "📺 Watch Ads" }),
      settingsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-36 w-full rounded-xl" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(WatchAdCard, { settings })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3", children: "🔥 Daily Reward" }),
      settingsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-28 w-full rounded-xl" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(DailyRewardSection, { settings })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3", children: "📋 Tasks" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TaskList, {})
    ] })
  ] });
}
export {
  EarnPage as default
};
