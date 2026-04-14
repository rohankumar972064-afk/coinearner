import Common "common";

module {
  // Block/unblock audit record
  public type BlockAuditEntry = {
    adminId : Common.UserId;
    blocked : Bool;
    reason : Text;
    timestamp : Common.Timestamp;
  };

  public type UserProfile = {
    principal : Common.UserId;
    username : Text;
    createdAt : Common.Timestamp;
    var coinBalance : Common.Coins;
    isBlocked : Bool;
    var lastLoginDate : Common.Timestamp;
    var currentStreak : Nat;
    referralCode : Text;
    var referredBy : ?Common.UserId;
    // Block audit trail (immutable list — replaced on each toggle)
    blockHistory : [BlockAuditEntry];
    // Mobile verification (additive — defaults to null/false for existing users)
    mobileNumber : ?Text;
    mobileVerified : Bool;
  };

  // Shared (non-mutable) version for API boundary
  public type UserProfilePublic = {
    principal : Common.UserId;
    username : Text;
    createdAt : Common.Timestamp;
    coinBalance : Common.Coins;
    isBlocked : Bool;
    lastLoginDate : Common.Timestamp;
    currentStreak : Nat;
    referralCode : Text;
    referredBy : ?Common.UserId;
    blockHistory : [BlockAuditEntry];
    // Mobile verification fields (additive)
    mobileNumber : ?Text;
    mobileVerified : Bool;
  };

  // Extended admin view with computed stats
  public type UserAdminDetail = {
    profile : UserProfilePublic;
    totalCoinsEarned : Common.Coins;
    totalWithdrawnRupees : Nat;
    fraudFlagCount : Nat;
  };
};
