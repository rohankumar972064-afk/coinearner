import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface LeaderboardEntry {
    username: string;
    userId: string;
    rank: bigint;
    coinsEarned: bigint;
}
export interface FraudFlagPublic {
    userId: UserId;
    resolution?: FraudResolution;
    isResolved: boolean;
    evidence: string;
    flagType: FraudFlagType;
    flaggedAt: Timestamp;
    resolvedAt?: Timestamp;
    resolvedBy?: UserId;
    reason: string;
}
export interface Task {
    id: bigint;
    title: string;
    description: string;
    coinReward: Coins;
    isActive: boolean;
}
export type Coins = bigint;
export interface Transaction {
    id: bigint;
    method: TransactionMethod;
    userId: UserId;
    note: string;
    createdAt: Timestamp;
    isCredit: boolean;
    amount: Coins;
}
export interface DailyEarningEntry {
    date: string;
    rupeesWithdrawn: bigint;
    coinsEarned: bigint;
}
export interface EnhancedAdminStats {
    avgCoinsPerAd: bigint;
    totalCoinsInCirculation: Coins;
    earningsBreakdown: EarningsBreakdown;
    totalApprovedWithdrawalsRupees: bigint;
    pendingWithdrawalsCount: bigint;
    activeUsersThisWeek: bigint;
    dailyEarningsTrend: Array<DailyEarningEntry>;
    totalAdsWatched: bigint;
    totalUsers: bigint;
    totalCoinsEarned: bigint;
    totalRupeesPaidOut: bigint;
}
export interface TaskCompletion {
    completedAt: Timestamp;
    userId: UserId;
    taskId: bigint;
}
export interface AnnouncementPublic {
    id: bigint;
    title: string;
    expiresAt?: Timestamp;
    urgency: AnnouncementUrgency;
    createdAt: Timestamp;
    createdBy: UserId;
    isActive: boolean;
    target: AnnouncementTarget;
    message: string;
    scheduledAt?: Timestamp;
}
export interface LeaderboardResult {
    userRank: {
        username: string;
        rank: bigint;
        coinsEarned: bigint;
    };
    entries: Array<LeaderboardEntry>;
}
export interface BlockAuditEntry {
    blocked: boolean;
    timestamp: Timestamp;
    adminId: UserId;
    reason: string;
}
export interface UserProfilePublic {
    lastLoginDate: Timestamp;
    principal: UserId;
    referralCode: string;
    username: string;
    coinBalance: Coins;
    isBlocked: boolean;
    createdAt: Timestamp;
    mobileNumber?: string;
    mobileVerified: boolean;
    referredBy?: UserId;
    blockHistory: Array<BlockAuditEntry>;
    currentStreak: bigint;
}
export interface SettingsChangeLog {
    field: string;
    newVal: string;
    timestamp: Timestamp;
    adminId: UserId;
    oldVal: string;
}
export interface FraudStats {
    mostCommonFlagType: string;
    unresolvedFlags: bigint;
    totalFlagged: bigint;
    totalCoinsRolledBack: bigint;
    resolvedFlags: bigint;
}
export type UserId = Principal;
export interface UserAdminDetail {
    totalWithdrawnRupees: bigint;
    fraudFlagCount: bigint;
    totalCoinsEarned: Coins;
    profile: UserProfilePublic;
}
export interface WithdrawalRequestPublic {
    id: bigint;
    status: WithdrawalStatus;
    method: WithdrawalMethod;
    userId: UserId;
    createdAt: Timestamp;
    paymentDetails?: string;
    adminNote: string;
    rupeeAmount: bigint;
    details: string;
    paidAt?: Timestamp;
    coinsDeducted: Coins;
    resolvedAt?: Timestamp;
    resolvedBy?: UserId;
}
export interface ReferralRelationshipPublic {
    status: ReferralStatus;
    refereeId: UserId;
    referrerId: UserId;
    timestamp: Timestamp;
    revokeReason?: string;
    bonusGiven: Coins;
}
export interface EarningsBreakdown {
    fromAds: bigint;
    fromDaily: bigint;
    fromReferral: bigint;
    fromTasks: bigint;
    fromAdmin: bigint;
}
export interface AppSettings {
    dailyBaseReward: bigint;
    referralsEnabled: boolean;
    tasksEnabled: boolean;
    dailyCoinsGrantCap: bigint;
    modifiedBy?: UserId;
    adsEnabled: boolean;
    maxDailyAdWatches: bigint;
    dailyRewardsEnabled: boolean;
    maxCoinsPerUser: bigint;
    coinsPerAd: bigint;
    lastModified: Timestamp;
    streakCap: bigint;
    fraudPenaltyCoins: bigint;
    withdrawalsEnabled: boolean;
    referralBonus: bigint;
    streakMultiplier: bigint;
    minWithdrawalRupees: bigint;
}
export interface AdminStats {
    totalCoinsInCirculation: Coins;
    totalApprovedWithdrawalsRupees: bigint;
    pendingWithdrawalsCount: bigint;
    totalUsers: bigint;
}
export enum AnnouncementTarget {
    all = "all",
    adminsOnly = "adminsOnly",
    newUsers = "newUsers",
    inactiveUsers = "inactiveUsers"
}
export enum AnnouncementUrgency {
    warning = "warning",
    info = "info",
    urgent = "urgent"
}
export enum FraudFlagType {
    suspiciousReferral = "suspiciousReferral",
    suspiciousAdClicks = "suspiciousAdClicks",
    referralLoop = "referralLoop",
    manualFlag = "manualFlag",
    multipleAccounts = "multipleAccounts",
    earlyWithdrawal = "earlyWithdrawal"
}
export enum FraudResolution {
    blockUser = "blockUser",
    dismiss = "dismiss",
    markLegitimate = "markLegitimate"
}
export enum ReferralStatus {
    active = "active",
    revoked = "revoked",
    flagged = "flagged"
}
export enum TransactionMethod {
    ad = "ad",
    referral = "referral",
    admin = "admin",
    task = "task",
    withdrawal = "withdrawal",
    daily = "daily"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WithdrawalMethod {
    upi = "upi",
    bank = "bank",
    paytm = "paytm"
}
export enum WithdrawalStatus {
    pending = "pending",
    paid = "paid",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    adminAddCoins(userId: UserId, amount: Coins, note: string): Promise<void>;
    adminAddWithdrawalNote(requestId: bigint, note: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminApproveWithdrawal(requestId: bigint, note: string): Promise<void>;
    adminBulkApproveWithdrawals(requestIds: Array<bigint>, note: string): Promise<{
        failed: bigint;
        succeeded: bigint;
    }>;
    adminBulkBlockUsers(userIds: Array<UserId>, blocked: boolean, reason: string): Promise<{
        failed: bigint;
        succeeded: bigint;
    }>;
    adminBulkRejectWithdrawals(requestIds: Array<bigint>, reason: string): Promise<{
        failed: bigint;
        succeeded: bigint;
    }>;
    adminCreateAnnouncement(title: string, message: string, urgency: AnnouncementUrgency, target: AnnouncementTarget, scheduledAt: Timestamp | null, expiresAt: Timestamp | null): Promise<bigint>;
    adminDeductCoins(userId: UserId, amount: Coins, reason: string): Promise<void>;
    adminDeleteAnnouncement(id: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminDetectSuspiciousReferralsByTime(): Promise<Array<ReferralRelationshipPublic>>;
    adminFlagUser(userId: UserId, reason: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminGetAllReferrals(): Promise<Array<ReferralRelationshipPublic>>;
    adminGetAllTransactions(userId: UserId | null, method: TransactionMethod | null, fromDate: Timestamp | null, toDate: Timestamp | null, limit: bigint, offset: bigint): Promise<{
        total: bigint;
        transactions: Array<Transaction>;
    }>;
    adminGetAllUsers(): Promise<Array<UserAdminDetail>>;
    adminGetAllWithdrawals(statusFilter: WithdrawalStatus | null, userIdFilter: UserId | null, fromDate: Timestamp | null, toDate: Timestamp | null, minRupees: bigint | null, maxRupees: bigint | null): Promise<Array<WithdrawalRequestPublic>>;
    adminGetEnhancedStats(): Promise<EnhancedAdminStats>;
    adminGetFlaggedUsers(): Promise<Array<UserProfilePublic>>;
    adminGetFraudFlags(unresolvedOnly: boolean): Promise<Array<FraudFlagPublic>>;
    adminGetFraudStats(): Promise<FraudStats>;
    adminGetSettings(): Promise<AppSettings>;
    adminGetSettingsChangeLog(): Promise<Array<SettingsChangeLog>>;
    adminGetStats(): Promise<AdminStats>;
    adminGetUserDetail(userId: UserId): Promise<UserAdminDetail | null>;
    adminGetUserReferralChain(userId: UserId): Promise<{
        referred: Array<UserProfilePublic>;
        referredBy?: UserProfilePublic;
    }>;
    adminListAnnouncements(): Promise<Array<AnnouncementPublic>>;
    adminMarkWithdrawalPaid(id: bigint, paymentRef: string): Promise<void>;
    adminRejectWithdrawal(requestId: bigint, adminNote: string): Promise<void>;
    adminResolveFraudFlag(userId: UserId, flagType: FraudFlagType, resolution: FraudResolution): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminRevokeReferral(referrerId: UserId, refereeId: UserId, reason: string, deductBonus: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminToggleBlock(userId: UserId, blocked: boolean, reason: string): Promise<void>;
    adminUpdateAnnouncement(id: bigint, title: string, message: string, urgency: AnnouncementUrgency, target: AnnouncementTarget, scheduledAt: Timestamp | null, expiresAt: Timestamp | null, isActive: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminUpdateSettings(next: AppSettings): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    applyReferralCode(code: string, sessionToken: string | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimDailyReward(sessionToken: string | null): Promise<Coins>;
    completeTask(taskId: bigint, sessionToken: string | null): Promise<Coins>;
    dismissAnnouncement(id: bigint, sessionToken: string | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getActiveAnnouncements(sessionToken: string | null): Promise<Array<AnnouncementPublic>>;
    getCallerUserRole(): Promise<UserRole>;
    getCoinBalance(sessionToken: string | null): Promise<Coins>;
    getMyCompletedTasks(sessionToken: string | null): Promise<Array<TaskCompletion>>;
    getMyMobileStatus(sessionToken: string | null): Promise<{
        mobileNumber?: string;
        mobileVerified: boolean;
    }>;
    getMyProfile(sessionToken: string | null): Promise<UserProfilePublic | null>;
    getMyReferralCode(sessionToken: string | null): Promise<string>;
    getMyWithdrawals(sessionToken: string | null): Promise<Array<WithdrawalRequestPublic>>;
    getRupeeBalance(sessionToken: string | null): Promise<bigint>;
    getSessionPrincipal(token: string): Promise<UserId | null>;
    getSettings(): Promise<AppSettings>;
    getTopEarners(period: string, limit: bigint, sessionToken: string | null): Promise<LeaderboardResult>;
    getTransactionHistory(limit: bigint, offset: bigint, sessionToken: string | null): Promise<{
        total: bigint;
        transactions: Array<Transaction>;
    }>;
    getUserProfile(userId: UserId, sessionToken: string | null): Promise<UserProfilePublic | null>;
    isCallerAdmin(): Promise<boolean>;
    listTasks(): Promise<Array<Task>>;
    loginWithMobileOTP(mobileNumber: string, otpCode: string): Promise<{
        __kind__: "ok";
        ok: {
            isNewUser: boolean;
            sessionToken: string;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    registerUser(username: string, sessionToken: string | null): Promise<UserProfilePublic>;
    requestMobileOTP(mobileNumber: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitWithdrawal(method: WithdrawalMethod, details: string, rupeeAmount: bigint, paymentDetails: string | null, sessionToken: string | null): Promise<WithdrawalRequestPublic>;
    verifyMobileOTP(mobileNumber: string, otpCode: string, sessionToken: string | null): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    watchAd(sessionToken: string | null): Promise<Coins>;
}
