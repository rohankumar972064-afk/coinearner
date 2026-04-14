import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActorAny = Record<string, (...args: any[]) => Promise<any>>;

export interface MobileStatus {
  mobileNumber: string | null;
  mobileVerified: boolean;
}

/**
 * Since mobile verification is now the login itself, every authenticated
 * user is already verified. This hook returns a static "verified" status.
 */
export function useMobileStatus() {
  const mobile = localStorage.getItem("coinearner_mobile");
  return {
    data: { mobileNumber: mobile, mobileVerified: !!mobile } as MobileStatus,
    isLoading: false,
  };
}

export function useRequestOtp() {
  const { actor } = useActor(createActor);

  return useMutation<void, Error, string>({
    mutationFn: async (mobileNumber: string) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as ActorAny;
      if (typeof a.requestMobileOTP !== "function") {
        throw new Error("Mobile OTP feature not available yet");
      }
      const result = await a.requestMobileOTP(mobileNumber);
      if (result && result.__kind__ === "err") {
        throw new Error(result.err);
      }
    },
  });
}

export function useVerifyOtp() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<string, Error, { mobileNumber: string; otp: string }>({
    mutationFn: async ({ mobileNumber, otp }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as unknown as ActorAny;
      if (typeof a.verifyMobileOTP !== "function") {
        throw new Error("Mobile OTP feature not available yet");
      }
      const result = await a.verifyMobileOTP(mobileNumber, otp);
      if (result && result.__kind__ === "err") {
        throw new Error(result.err);
      }
      return (result.ok as string) ?? "";
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}
