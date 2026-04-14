import Common "common";

module {
  // Core app settings — all reward/feature values are stored here
  public type AppSettings = {
    coinsPerAd : Nat;            // base coins per ad watch (used as min of range)
    dailyBaseReward : Nat;       // base coins for daily claim
    streakMultiplier : Nat;      // coins added per streak day
    streakCap : Nat;             // max streak days counted (cap for bonus)
    referralBonus : Nat;         // coins given to referrer on successful referral
    minWithdrawalRupees : Nat;   // minimum rupees for withdrawal request
    maxDailyAdWatches : Nat;     // max ad watches per day per user
    maxCoinsPerUser : Nat;       // soft cap on coins a single user can hold (0 = unlimited)
    dailyCoinsGrantCap : Nat;    // max coins admin can grant to a single user per day (0 = unlimited)
    fraudPenaltyCoins : Nat;     // coins deducted when admin applies blockUser resolution with rollback
    adsEnabled : Bool;           // feature toggle: ad watching
    dailyRewardsEnabled : Bool;  // feature toggle: daily reward claims
    referralsEnabled : Bool;     // feature toggle: referral system
    tasksEnabled : Bool;         // feature toggle: task completion
    withdrawalsEnabled : Bool;   // feature toggle: withdrawal requests
    lastModified : Common.Timestamp;
    modifiedBy : ?Common.UserId;
  };

  // Audit log entry for every settings change
  public type SettingsChangeLog = {
    field : Text;
    oldVal : Text;
    newVal : Text;
    timestamp : Common.Timestamp;
    adminId : Common.UserId;
  };
};
