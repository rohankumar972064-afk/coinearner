import Common "common";

module {
  public type WithdrawalMethod = {
    #upi;
    #paytm;
    #bank;
  };

  public type WithdrawalStatus = {
    #pending;
    #approved;
    #rejected;
    #paid;
  };

  public type WithdrawalRequest = {
    id : Nat;
    userId : Common.UserId;
    method : WithdrawalMethod;
    details : Text; // UPI ID / Paytm number / bank details
    rupeeAmount : Nat; // minimum 50
    coinsDeducted : Common.Coins;
    var status : WithdrawalStatus;
    createdAt : Common.Timestamp;
    var resolvedAt : ?Common.Timestamp;
    var resolvedBy : ?Common.UserId;  // admin who approved/rejected
    var adminNote : Text;
    var paymentDetails : ?Text; // user-entered UPI ID, Paytm, or bank info
    var paidAt : ?Common.Timestamp;   // when admin marks as paid
  };

  // Shared version for API
  public type WithdrawalRequestPublic = {
    id : Nat;
    userId : Common.UserId;
    method : WithdrawalMethod;
    details : Text;
    rupeeAmount : Nat;
    coinsDeducted : Common.Coins;
    status : WithdrawalStatus;
    createdAt : Common.Timestamp;
    resolvedAt : ?Common.Timestamp;
    resolvedBy : ?Common.UserId;
    adminNote : Text;
    paymentDetails : ?Text;
    paidAt : ?Common.Timestamp;
  };

  public type AdminStats = {
    totalUsers : Nat;
    totalCoinsInCirculation : Common.Coins;
    pendingWithdrawalsCount : Nat;
    totalApprovedWithdrawalsRupees : Nat;
  };

  public type EarningsBreakdown = {
    fromAds : Nat;      // percentage * 100
    fromDaily : Nat;
    fromReferral : Nat;
    fromTasks : Nat;
    fromAdmin : Nat;
  };

  public type DailyEarningEntry = {
    date : Text; // YYYY-MM-DD
    coinsEarned : Nat;
    rupeesWithdrawn : Nat;
  };

  public type EnhancedAdminStats = {
    // base stats
    totalUsers : Nat;
    totalCoinsInCirculation : Common.Coins;
    pendingWithdrawalsCount : Nat;
    totalApprovedWithdrawalsRupees : Nat;
    // enhanced stats
    activeUsersThisWeek : Nat;
    totalAdsWatched : Nat;
    avgCoinsPerAd : Nat;
    totalCoinsEarned : Nat;
    totalRupeesPaidOut : Nat;
    earningsBreakdown : EarningsBreakdown;
    dailyEarningsTrend : [DailyEarningEntry];
  };
};
