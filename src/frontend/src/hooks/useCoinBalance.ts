import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";
import { COINS_TO_RUPEES, formatCoins, formatRupees } from "../types";
import { useAuth } from "./useAuth";

export function useCoinBalance() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { sessionToken } = useAuth();

  const coinQuery = useQuery<bigint>({
    // Use sessionToken so the balance re-fetches after login/logout
    queryKey: ["coinBalance", sessionToken ?? "anonymous"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getCoinBalance(sessionToken);
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30_000,
  });

  const coins = coinQuery.data ?? BigInt(0);
  const rupees = COINS_TO_RUPEES(coins);

  return {
    coins,
    rupees,
    formattedCoins: formatCoins(coins),
    formattedRupees: formatRupees(rupees),
    isLoading: actorFetching || coinQuery.isLoading,
    refetch: coinQuery.refetch,
  };
}
