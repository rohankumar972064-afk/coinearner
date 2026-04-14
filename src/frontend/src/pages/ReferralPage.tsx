import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  Copy,
  Gift,
  Share2,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../backend";
import type { AppSettings } from "../backend";
import { useAuth } from "../hooks/useAuth";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { formatCoins } from "../types";

export default function ReferralPage() {
  const { actor, isFetching } = useActor(createActor);
  const { sessionToken } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [applyCode, setApplyCode] = useState("");
  const { coins } = useCoinBalance();

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
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });

  const { data: referralCode = "", isLoading: codeLoading } = useQuery<string>({
    queryKey: ["referralCode", sessionToken ?? "anon"],
    queryFn: async () => {
      if (!actor) return "";
      try {
        return await actor.getMyReferralCode(sessionToken);
      } catch {
        return "";
      }
    },
    enabled: !!actor && !isFetching,
  });

  const settings = settingsQuery.data;
  const referralsEnabled = settings ? settings.referralsEnabled : true;
  const referralBonus = settings ? Number(settings.referralBonus) : 500;

  const safeCode = referralCode ?? "";
  const inviteLink = safeCode
    ? `${window.location.origin}/?ref=${safeCode}`
    : "";

  const applyMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.applyReferralCode(code, sessionToken);
    },
    onSuccess: () => {
      toast.success(
        `🎁 Referral code applied! You earned ${referralBonus} bonus coins.`,
      );
      setApplyCode("");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to apply code"),
  });

  const handleCopyCode = async () => {
    if (!safeCode) return;
    try {
      await navigator.clipboard.writeText(safeCode);
      setCopiedCode(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleShare = () => {
    const text = `💰 Join CoinEarner and earn real money!\nUse my referral code: ${safeCode}\n👉 ${inviteLink}`;
    if (navigator.share) {
      navigator
        .share({
          title: "CoinEarner – Earn Real Money",
          text,
          url: inviteLink,
        })
        .catch(() => {
          /* user dismissed */
        });
    } else {
      navigator.clipboard.writeText(text).catch(() => {
        /* ignore */
      });
      toast.success("Share text copied to clipboard!");
    }
  };

  const steps = [
    {
      icon: Share2,
      step: "1",
      title: "Share your code",
      desc: "Send your unique referral code or invite link to friends",
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      icon: Users,
      step: "2",
      title: "Friend signs up",
      desc: "They register on CoinEarner using your referral code",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Gift,
      step: "3",
      title: `You both earn ${referralBonus} coins`,
      desc: `You both get ${referralBonus} coins instantly — that's ₹${(referralBonus / 100).toFixed(0)} each!`,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-5 pb-6" data-ocid="referral-page">
      <div className="pt-1">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-black text-2xl text-foreground"
        >
          Refer &amp; Earn 🪙
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-muted-foreground font-body text-sm mt-0.5"
        >
          Invite friends and earn {referralBonus} coins per referral
        </motion.p>
      </div>

      {!referralsEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-start gap-3"
          data-ocid="referrals-paused"
        >
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-display font-bold text-foreground">
              Referrals are currently paused
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              The referral program is temporarily disabled. Existing referrals
              still count.
            </p>
          </div>
        </motion.div>
      )}

      {/* Earnings Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-primary via-primary to-secondary p-[1px] rounded-lg">
            <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-[calc(var(--radius)-1px)] p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <Wallet className="w-7 h-7 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-body text-xs text-muted-foreground">
                  Your Coin Balance
                </p>
                <p className="font-display font-black text-3xl text-primary leading-none mt-0.5">
                  {formatCoins(coins)}
                  <span className="text-sm font-semibold text-muted-foreground ml-1">
                    coins
                  </span>
                </p>
              </div>
              <div className="ml-auto text-right shrink-0">
                <Badge className="bg-primary/10 text-primary border-primary/20 font-display text-xs">
                  {referralBonus}/referral
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Referral Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold text-sm text-foreground">
                Your Referral Code
              </h3>
            </div>

            {codeLoading ? (
              <Skeleton className="h-14 w-full rounded-xl" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-xl px-4 py-3 font-display font-black text-2xl text-primary tracking-[0.25em] text-center select-all">
                  {safeCode || "—"}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-muted border border-border hover:bg-card hover:border-primary/40 transition-smooth shrink-0"
                  aria-label="Copy referral code"
                  data-ocid="btn-copy-code"
                >
                  {copiedCode ? (
                    <Check className="w-5 h-5 text-accent" />
                  ) : (
                    <Copy className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}

            <div>
              <p className="font-body text-xs text-muted-foreground mb-2">
                Invite Link
              </p>
              {codeLoading ? (
                <Skeleton className="h-11 w-full rounded-xl" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-xl px-3 py-2.5 font-mono text-xs text-muted-foreground truncate border border-border min-w-0">
                    {inviteLink || "Loading..."}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted border border-border hover:bg-card hover:border-secondary/40 transition-smooth shrink-0"
                    aria-label="Copy invite link"
                    data-ocid="btn-copy-link"
                  >
                    {copiedLink ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <Button
              className="w-full btn-coin-secondary gap-2"
              onClick={handleShare}
              disabled={!safeCode || !referralsEnabled}
              data-ocid="btn-share-code"
            >
              <Share2 className="w-4 h-4" />
              Share via WhatsApp / More
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* How It Works */}
      <div>
        <h2 className="font-display font-bold text-sm text-foreground mb-3 px-0.5">
          How It Works
        </h2>
        <div className="space-y-2.5">
          {steps.map(({ icon: Icon, step, title, desc, color, bg }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.08 }}
            >
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center shrink-0`}
                    >
                      <span
                        className={`font-display font-black ${color} text-sm`}
                      >
                        {step}
                      </span>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}
                    >
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold text-sm text-foreground">
                        {title}
                      </p>
                      <p className="font-body text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Apply Referral Code */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-muted/40 border-dashed border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-accent" />
              <h3 className="font-display font-bold text-sm text-foreground">
                Have a Referral Code?
              </h3>
            </div>
            <p className="font-body text-xs text-muted-foreground mb-3">
              Enter a friend's referral code to get {referralBonus} bonus coins!
            </p>
            <div className="flex gap-2">
              <Input
                value={applyCode}
                onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
                placeholder="e.g. RAHUL2024"
                className="flex-1 font-display font-bold tracking-wider uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                maxLength={12}
                data-ocid="input-referral-code"
              />
              <Button
                onClick={() => applyMutation.mutate(applyCode)}
                disabled={
                  !applyCode.trim() ||
                  applyMutation.isPending ||
                  !actor ||
                  !referralsEnabled
                }
                className="btn-coin shrink-0"
                data-ocid="btn-apply-code"
              >
                {applyMutation.isPending ? "Applying…" : "Apply"}
              </Button>
            </div>
            <Badge
              variant="outline"
              className="mt-3 text-xs text-accent border-accent/30 bg-accent/5 font-body"
            >
              🎁 {referralBonus} bonus coins on first-time code use
            </Badge>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
