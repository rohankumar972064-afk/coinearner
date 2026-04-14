import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  Phone,
  RefreshCw,
  Share2,
  ShieldCheck,
  Wallet,
  WifiOff,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createActor } from "../backend";
import { useAuth } from "../hooks/useAuth";

const RESEND_COOLDOWN = 30;

const features = [
  { icon: Zap, label: "Watch Ads & Earn", desc: "5 coins per video" },
  { icon: Coins, label: "Daily Rewards", desc: "Streak bonuses" },
  { icon: Share2, label: "Refer & Earn", desc: "20 coins per friend" },
  { icon: Wallet, label: "Withdraw ₹", desc: "Min ₹50 via UPI" },
];

export default function LoginPage() {
  const { login, actorError, retryConnection } = useAuth();
  const { actor } = useActor(createActor);
  const navigate = useNavigate();

  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  function validateMobile(val: string) {
    if (!/^[6-9]\d{9}$/.test(val)) {
      return "Enter a valid 10-digit Indian mobile number";
    }
    return "";
  }

  async function handleSendOtp() {
    const err = validateMobile(mobile);
    if (err) {
      setMobileError(err);
      return;
    }
    setMobileError("");
    if (!actor) {
      setMobileError(
        actorError
          ? actorError
          : "Unable to connect to server. Please refresh the page.",
      );
      return;
    }
    setIsSending(true);
    try {
      const result = await actor.requestMobileOTP(mobile);
      if (result.__kind__ === "err") throw new Error(result.err);
      setStep("otp");
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setMobileError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerify() {
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit OTP");
      return;
    }
    setOtpError("");
    if (!actor) {
      setOtpError("Not connected to server. Please refresh and try again.");
      return;
    }
    setIsVerifying(true);
    try {
      await login(mobile, otp);
      navigate({ to: "/dashboard" });
    } catch (e) {
      setOtpError(
        e instanceof Error ? e.message : "Invalid OTP. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || !actor) return;
    setIsSending(true);
    try {
      const result = await actor.requestMobileOTP(mobile);
      if (result.__kind__ === "err") throw new Error(result.err);
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setMobileError(e instanceof Error ? e.message : "Failed to resend OTP");
    } finally {
      setIsSending(false);
    }
  }

  // If actor connection timed out, show a full error state on login page
  if (actorError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
          <WifiOff className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="font-display font-black text-xl text-foreground mb-2">
          Connection Failed
        </h2>
        <p className="font-body text-sm text-muted-foreground max-w-xs mb-8">
          {actorError}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={retryConnection}
            className="gap-2 font-display font-bold"
            data-ocid="login-connection-retry-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="gap-2 font-display font-bold"
            data-ocid="login-connection-reload-btn"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      data-ocid="login-page"
    >
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        {/* Logo + Name */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-6"
        >
          <img
            src="/assets/generated/coinearner-logo-transparent.dim_120x120.png"
            alt="CoinEarner"
            className="w-14 h-14 object-contain drop-shadow-lg"
          />
          <span className="font-display font-black text-4xl text-foreground">
            Coin<span className="text-primary">Earner</span>
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-body text-lg text-muted-foreground max-w-xs mb-2"
        >
          Kamao, Jeeto, Nikaalo 🇮🇳
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-body text-sm text-muted-foreground/70 max-w-xs mb-6"
        >
          Earn real money by watching ads, completing tasks & referring friends
        </motion.p>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 gap-3 max-w-xs w-full mb-8"
        >
          {features.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.07 }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border shadow-sm"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-semibold text-xs text-foreground text-center leading-tight">
                {label}
              </span>
              <span className="font-body text-xs text-muted-foreground">
                {desc}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="w-full max-w-xs bg-card border border-border rounded-2xl shadow-lg overflow-hidden"
          data-ocid="login-card"
        >
          {/* Card Header */}
          <div className="px-5 pt-5 pb-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-foreground text-base leading-tight">
                  {step === "mobile" ? "Verify Mobile Number" : "Enter OTP"}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  {step === "mobile"
                    ? "Enter your 10-digit number"
                    : `OTP sent to +91 ${mobile}`}
                </p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="px-5 py-5 space-y-4">
            {step === "mobile" ? (
              <>
                <div className="space-y-1.5">
                  <label
                    className="text-sm font-display font-semibold text-foreground text-left block"
                    htmlFor="mobile-input"
                  >
                    Mobile Number
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 h-10 bg-muted border border-border rounded-lg text-sm text-muted-foreground font-body shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                      <span>+91</span>
                    </div>
                    <Input
                      id="mobile-input"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => {
                        setMobile(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        );
                        setMobileError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendOtp();
                      }}
                      className="flex-1 font-body text-sm"
                      data-ocid="mobile-input"
                      autoFocus
                    />
                  </div>
                  {mobileError && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <p
                        className="text-xs text-destructive font-body"
                        data-ocid="mobile-error"
                      >
                        {mobileError}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full font-display font-bold"
                  onClick={handleSendOtp}
                  disabled={isSending || mobile.length < 10 || !actor}
                  data-ocid="send-otp-btn"
                >
                  {isSending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                      Sending OTP…
                    </span>
                  ) : !actor ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/40 border-t-transparent animate-spin" />
                      Connecting…
                    </span>
                  ) : (
                    "Send OTP"
                  )}
                </Button>

                {!actor && !actorError && (
                  <p className="text-xs text-center text-muted-foreground font-body">
                    Connecting to server, please wait…
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-sm font-display font-semibold text-foreground"
                      htmlFor="otp-input"
                    >
                      6-digit OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("mobile");
                        setOtp("");
                        setOtpError("");
                      }}
                      className="text-xs text-primary hover:underline font-body"
                      data-ocid="change-mobile-btn"
                    >
                      Change number
                    </button>
                  </div>
                  <Input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setOtpError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleVerify();
                    }}
                    className="font-mono text-lg tracking-[0.5em] text-center"
                    data-ocid="otp-input"
                    autoFocus
                  />
                  {otpError && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <p
                        className="text-xs text-destructive font-body"
                        data-ocid="otp-error"
                      >
                        {otpError}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full font-display font-bold"
                  onClick={handleVerify}
                  disabled={isVerifying || otp.length !== 6}
                  data-ocid="verify-otp-btn"
                >
                  {isVerifying ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                      Verifying…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Verify & Login
                    </span>
                  )}
                </Button>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || isSending}
                    className="text-xs font-body text-muted-foreground disabled:opacity-50 hover:text-primary transition-colors disabled:cursor-not-allowed"
                    data-ocid="resend-otp-btn"
                  >
                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-4 text-xs text-muted-foreground font-body"
        >
          OTP sent via SMS to your mobile number
        </motion.p>
      </main>

      <footer className="bg-muted/40 border-t border-border px-4 py-3 text-center">
        <p className="text-muted-foreground text-xs font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
