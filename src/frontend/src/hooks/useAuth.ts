import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { createActor } from "../backend";

const SESSION_KEY = "coinearner_session_token";
const MOBILE_KEY = "coinearner_mobile";

/**
 * How long (ms) to wait for actor before showing connection error.
 * Increased to 30s to handle slow network conditions.
 */
const ACTOR_TIMEOUT_MS = 30_000;

/** Maximum number of auto-retries before showing the error */
const MAX_RETRY_ATTEMPTS = 3;

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string | null>(null);
  const [actorError, setActorError] = useState<string | null>(null);

  const { actor, isFetching: actorFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem(SESSION_KEY);
      const mobile = localStorage.getItem(MOBILE_KEY);
      if (token) {
        setSessionToken(token);
        setMobileNumber(mobile);
        setIsAuthenticated(true);
      }
    } catch {
      // localStorage unavailable — continue unauthenticated
    }
    setIsLoading(false);
  }, []);

  // Watch actor: clear error once connected, start timeout if still null
  useEffect(() => {
    if (actor) {
      // Connected successfully — clear any previous error and reset retries
      setActorError(null);
      retryCountRef.current = 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Actor not yet ready — start (or reset) the timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const attempt = retryCountRef.current;

    timeoutRef.current = setTimeout(() => {
      if (!actor) {
        if (attempt < MAX_RETRY_ATTEMPTS) {
          // Auto-retry by invalidating the actor query — exponential backoff
          retryCountRef.current += 1;
          console.warn(
            `[CoinEarner] Actor connection timeout — retry attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS}`,
          );
          // Invalidate actor query to force re-fetch
          queryClient.invalidateQueries({ queryKey: ["actor"] });
        } else {
          console.error(
            "[CoinEarner] Actor connection failed after",
            MAX_RETRY_ATTEMPTS,
            "retries",
          );
          setActorError(
            "Unable to connect to server. Please check your internet connection and tap Retry.",
          );
        }
      }
    }, ACTOR_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [actor, queryClient]);

  const login = useCallback(
    async (mobile: string, otp: string): Promise<void> => {
      if (!actor)
        throw new Error(
          "Not connected to server. Please refresh and try again.",
        );

      // verifyMobileOTP returns ok: sessionToken on success
      const result = await actor.verifyMobileOTP(mobile, otp, null);
      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }

      const token = result.ok;
      try {
        localStorage.setItem(SESSION_KEY, token);
        localStorage.setItem(MOBILE_KEY, mobile);
      } catch {
        // localStorage write failed — continue anyway
      }
      setSessionToken(token);
      setMobileNumber(mobile);
      setIsAuthenticated(true);
      setActorError(null);

      // Ensure user profile exists (non-fatal)
      try {
        await actor._initializeAccessControl();
      } catch {
        // non-fatal
      }
      try {
        const profile = await actor.getMyProfile(token);
        if (!profile) {
          await actor.registerUser(`user_${mobile.slice(-6)}`, token);
        }
      } catch {
        // non-fatal
      }

      await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    [actor, queryClient],
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(MOBILE_KEY);
    } catch {
      // ignore
    }
    setSessionToken(null);
    setMobileNumber(null);
    setIsAuthenticated(false);
    queryClient.clear();
  }, [queryClient]);

  const retryConnection = useCallback(() => {
    setActorError(null);
    retryCountRef.current = 0;
    queryClient.invalidateQueries({ queryKey: ["actor"] });
  }, [queryClient]);

  return {
    isAuthenticated,
    isLoading,
    sessionToken,
    mobileNumber,
    actorReady: !!actor,
    actorError,
    actorFetching,
    login,
    logout,
    retryConnection,
    // Legacy compat shims
    principalText: mobileNumber,
    isLoginError: false,
    loginError: null,
  };
}
