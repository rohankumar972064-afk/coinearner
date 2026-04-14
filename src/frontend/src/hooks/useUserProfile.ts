import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";
import type { UserProfile } from "../types";
import { useAuth } from "./useAuth";

export function useUserProfile() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { isAuthenticated, sessionToken } = useAuth();

  // Use sessionToken as query key discriminator so query re-runs after login/logout
  const queryKey = ["userProfile", sessionToken ?? "anonymous"];

  const query = useQuery<UserProfile | null>({
    queryKey,
    queryFn: async () => {
      if (!actor) return null;
      try {
        const [result, isAdmin] = await Promise.all([
          actor.getMyProfile(sessionToken),
          actor.isCallerAdmin(),
        ]);
        if (!result) return null;
        return {
          id: result.principal?.toString() ?? "",
          username: result.username ?? "",
          coinBalance: result.coinBalance ?? BigInt(0),
          referralCode: result.referralCode ?? "",
          joinedAt: result.createdAt ?? BigInt(0),
          isBlocked: result.isBlocked ?? false,
          isAdmin: isAdmin === true,
          currentStreak: Number(result.currentStreak ?? 0),
        } satisfies UserProfile;
      } catch (err) {
        console.error("[useUserProfile] fetch error:", err);
        return null;
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}
