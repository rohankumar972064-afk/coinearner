import Common "common";

module {
  public type TransactionMethod = {
    #ad;
    #daily;
    #referral;
    #task;
    #admin;
    #withdrawal;
  };

  public type Transaction = {
    id : Nat;
    userId : Common.UserId;
    amount : Common.Coins;
    isCredit : Bool;
    method : TransactionMethod;
    note : Text;
    createdAt : Common.Timestamp;
  };

  // Daily reward claim tracking
  public type DailyClaimRecord = {
    userId : Common.UserId;
    var lastClaimTime : Common.Timestamp;
    var streakDays : Nat;
  };

  // Ad watch tracking (per user per day)
  public type AdWatchRecord = {
    userId : Common.UserId;
    var adWatchDate : Common.Timestamp; // day-bucket timestamp
    var adWatchCount : Nat;
  };

  // Predefined task
  public type Task = {
    id : Nat;
    title : Text;
    description : Text;
    coinReward : Common.Coins;
    isActive : Bool;
  };

  // Task completion key: "<principalText>:<taskId>"
  public type TaskCompletionKey = Text;

  // Task completion record
  public type TaskCompletion = {
    userId : Common.UserId;
    taskId : Nat;
    completedAt : Common.Timestamp;
  };

  // Referral relationship tracking
  public type ReferralStatus = {
    #active;
    #flagged;
    #revoked;
  };

  public type ReferralRelationship = {
    referrerId : Common.UserId;
    refereeId : Common.UserId;
    bonusGiven : Common.Coins;
    timestamp : Common.Timestamp;
    var status : ReferralStatus;
    var revokeReason : ?Text;
  };

  // Shared (non-mutable) version for API
  public type ReferralRelationshipPublic = {
    referrerId : Common.UserId;
    refereeId : Common.UserId;
    bonusGiven : Common.Coins;
    timestamp : Common.Timestamp;
    status : ReferralStatus;
    revokeReason : ?Text;
  };
};
