export type WithdrawalMethod = "UPI" | "Paytm" | "BankTransfer";

export interface UserProfile {
  id: string;
  username: string;
  coinBalance: bigint;
  referralCode: string;
  joinedAt: bigint;
  isBlocked: boolean;
  isAdmin: boolean;
  currentStreak: number;
  mobileNumber?: string | null;
  mobileVerified?: boolean;
}

export interface Transaction {
  id: bigint;
  userId: string;
  txType: string;
  amount: bigint;
  description: string;
  createdAt: bigint;
}

export interface Task {
  id: bigint;
  title: string;
  description: string;
  coinsReward: bigint;
  taskType: string;
  isActive: boolean;
}

export interface WithdrawalRequest {
  id: bigint;
  userId: string;
  method: WithdrawalMethod;
  details: string;
  rupeeAmount: bigint;
  status: "Pending" | "Approved" | "Rejected";
  note: string;
  createdAt: bigint;
}

export interface AdminStats {
  totalUsers: bigint;
  totalCoinsIssued: bigint;
  totalWithdrawals: bigint;
  pendingWithdrawals: bigint;
  totalRupeeWithdrawn: bigint;
}

export const COINS_TO_RUPEES = (coins: bigint | number): number => {
  const c = typeof coins === "bigint" ? Number(coins) : coins;
  return c / 100; // 1000 coins = ₹10 → 100 coins = ₹1
};

export const formatCoins = (coins: bigint | number): string => {
  const c = typeof coins === "bigint" ? Number(coins) : coins;
  if (c >= 1_000_000) return `${(c / 1_000_000).toFixed(1)}M`;
  if (c >= 1_000) return `${(c / 1_000).toFixed(1)}K`;
  return c.toString();
};

export const formatRupees = (rupees: number): string => {
  return `₹${rupees.toFixed(2)}`;
};
