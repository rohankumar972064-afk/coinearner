import Common "common";

module {
  // Type of fraud detected
  public type FraudFlagType = {
    #suspiciousAdClicks;
    #multipleAccounts;
    #referralLoop;
    #suspiciousReferral;   // referee registered < 5 min before applying code
    #earlyWithdrawal;      // account age < 7 days at withdrawal time
    #manualFlag;
  };

  // Resolution action taken by admin
  public type FraudResolution = {
    #markLegitimate;
    #blockUser;         // block user + optional coin rollback
    #dismiss;
  };

  // A fraud flag record per user per flag type
  public type FraudFlag = {
    userId : Common.UserId;
    flagType : FraudFlagType;
    reason : Text;
    evidence : Text;
    flaggedAt : Common.Timestamp;
    var isResolved : Bool;
    var resolvedAt : ?Common.Timestamp;
    var resolvedBy : ?Common.UserId;
    var resolution : ?FraudResolution;
  };

  // Shared/public version for API boundary
  public type FraudFlagPublic = {
    userId : Common.UserId;
    flagType : FraudFlagType;
    reason : Text;
    evidence : Text;
    flaggedAt : Common.Timestamp;
    isResolved : Bool;
    resolvedAt : ?Common.Timestamp;
    resolvedBy : ?Common.UserId;
    resolution : ?FraudResolution;
  };

  // Aggregate fraud statistics for admin dashboard
  public type FraudStats = {
    totalFlagged : Nat;
    unresolvedFlags : Nat;
    resolvedFlags : Nat;
    mostCommonFlagType : Text;
    totalCoinsRolledBack : Nat;
  };
};
