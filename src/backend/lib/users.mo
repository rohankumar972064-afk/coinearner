import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Common "../types/common";
import Types "../types/users";

module {
  // Register a new user profile
  public func register(
    users : Map.Map<Common.UserId, Types.UserProfile>,
    caller : Common.UserId,
    username : Text,
    referralCode : Text,
    now : Common.Timestamp,
  ) : Types.UserProfile {
    if (users.containsKey(caller)) {
      Runtime.trap("User already registered");
    };
    let profile : Types.UserProfile = {
      principal = caller;
      username = username;
      createdAt = now;
      var coinBalance = 0;
      isBlocked = false;
      var lastLoginDate = now;
      var currentStreak = 1;
      referralCode = referralCode;
      var referredBy = null;
      blockHistory = [];
      mobileNumber = null;
      mobileVerified = false;
    };
    users.add(caller, profile);
    profile;
  };

  // Get a user profile by principal
  public func getProfile(
    users : Map.Map<Common.UserId, Types.UserProfile>,
    userId : Common.UserId,
  ) : ?Types.UserProfilePublic {
    switch (users.get(userId)) {
      case (?p) ?toPublic(p);
      case null null;
    };
  };

  // Convert internal profile to public (strips var fields)
  public func toPublic(profile : Types.UserProfile) : Types.UserProfilePublic {
    {
      principal = profile.principal;
      username = profile.username;
      createdAt = profile.createdAt;
      coinBalance = profile.coinBalance;
      isBlocked = profile.isBlocked;
      lastLoginDate = profile.lastLoginDate;
      currentStreak = profile.currentStreak;
      referralCode = profile.referralCode;
      referredBy = profile.referredBy;
      blockHistory = profile.blockHistory;
      mobileNumber = profile.mobileNumber;
      mobileVerified = profile.mobileVerified;
    };
  };

  // Credit coins to a user
  public func creditCoins(
    users : Map.Map<Common.UserId, Types.UserProfile>,
    userId : Common.UserId,
    amount : Common.Coins,
  ) {
    switch (users.get(userId)) {
      case (?p) { p.coinBalance += amount };
      case null { Runtime.trap("User not found") };
    };
  };

  // Deduct coins from a user (traps if insufficient)
  public func deductCoins(
    users : Map.Map<Common.UserId, Types.UserProfile>,
    userId : Common.UserId,
    amount : Common.Coins,
  ) {
    switch (users.get(userId)) {
      case (?p) {
        if (p.coinBalance < amount) {
          Runtime.trap("Insufficient coins");
        };
        p.coinBalance -= amount;
      };
      case null { Runtime.trap("User not found") };
    };
  };

  // Toggle block status of a user — records audit entry
  public func setBlocked(
    users : Map.Map<Common.UserId, Types.UserProfile>,
    userId : Common.UserId,
    blocked : Bool,
    adminId : Common.UserId,
    reason : Text,
    now : Common.Timestamp,
  ) {
    switch (users.get(userId)) {
      case (?p) {
        let entry : Types.BlockAuditEntry = {
          adminId = adminId;
          blocked = blocked;
          reason = reason;
          timestamp = now;
        };
        let updated : Types.UserProfile = {
          principal = p.principal;
          username = p.username;
          createdAt = p.createdAt;
          var coinBalance = p.coinBalance;
          isBlocked = blocked;
          var lastLoginDate = p.lastLoginDate;
          var currentStreak = p.currentStreak;
          referralCode = p.referralCode;
          var referredBy = p.referredBy;
          blockHistory = p.blockHistory.concat([entry]);
          mobileNumber = p.mobileNumber;
          mobileVerified = p.mobileVerified;
        };
        users.add(p.principal, updated);
      };
      case null { Runtime.trap("User not found") };
    };
  };

  // Update last login date and streak
  public func updateLogin(
    users : Map.Map<Common.UserId, Types.UserProfile>,
    userId : Common.UserId,
    now : Common.Timestamp,
  ) {
    switch (users.get(userId)) {
      case (?p) {
        let oneDayNs : Common.Timestamp = 86_400_000_000_000;
        let elapsed = now - p.lastLoginDate;
        if (elapsed >= oneDayNs) {
          if (elapsed < 2 * oneDayNs) {
            p.currentStreak += 1;
          } else {
            p.currentStreak := 1;
          };
          p.lastLoginDate := now;
        };
      };
      case null { Runtime.trap("User not found") };
    };
  };

  // Lookup user by referral code
  public func findByReferralCode(
    users : Map.Map<Common.UserId, Types.UserProfile>,
    code : Text,
  ) : ?Types.UserProfile {
    var found : ?Types.UserProfile = null;
    users.forEach(func(_, p) {
      if (p.referralCode == code) { found := ?p };
    });
    found;
  };

  // Get all users as public profiles
  public func getAllPublic(
    users : Map.Map<Common.UserId, Types.UserProfile>
  ) : [Types.UserProfilePublic] {
    users.values().map(func(p : Types.UserProfile) : Types.UserProfilePublic { toPublic(p) }).toArray();
  };

  // Convert coins to rupees: 1000 coins = ₹10, so coins / 100 = rupees
  public func coinsToRupees(coins : Common.Coins) : Nat {
    coins / 100;
  };
};
