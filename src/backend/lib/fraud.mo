import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Common "../types/common";
import Types "../types/fraud";
import RewardTypes "../types/rewards";

module {
  // Convert internal fraud flag to public
  public func toPublic(f : Types.FraudFlag) : Types.FraudFlagPublic {
    {
      userId = f.userId;
      flagType = f.flagType;
      reason = f.reason;
      evidence = f.evidence;
      flaggedAt = f.flaggedAt;
      isResolved = f.isResolved;
      resolvedAt = f.resolvedAt;
      resolvedBy = f.resolvedBy;
      resolution = f.resolution;
    };
  };

  // Add a fraud flag for a user (avoids duplicate unresolved flags of same type)
  public func addFlag(
    fraudFlags : Map.Map<Principal, List.List<Types.FraudFlag>>,
    userId : Common.UserId,
    flagType : Types.FraudFlagType,
    reason : Text,
    evidence : Text,
    now : Common.Timestamp,
  ) {
    let flags = switch (fraudFlags.get(userId)) {
      case (?fl) fl;
      case null {
        let newList = List.empty<Types.FraudFlag>();
        fraudFlags.add(userId, newList);
        newList;
      };
    };
    // Avoid duplicate unresolved flags of same type
    let alreadyFlagged = flags.any(func(f : Types.FraudFlag) : Bool {
      f.flagType == flagType and not f.isResolved
    });
    if (not alreadyFlagged) {
      flags.add({
        userId = userId;
        flagType = flagType;
        reason = reason;
        evidence = evidence;
        flaggedAt = now;
        var isResolved = false;
        var resolvedAt : ?Common.Timestamp = null;
        var resolvedBy : ?Common.UserId = null;
        var resolution : ?Types.FraudResolution = null;
      });
    };
  };

  // Check if user made too many ad watches (>50) in the current hour bucket
  // If so, add a suspiciousAdClicks fraud flag
  public func checkAdClickFraud(
    fraudFlags : Map.Map<Principal, List.List<Types.FraudFlag>>,
    userId : Common.UserId,
    adRecord : ?RewardTypes.AdWatchRecord,
    now : Common.Timestamp,
  ) {
    switch (adRecord) {
      case (?rec) {
        // Flag when count crosses 50 threshold
        if (rec.adWatchCount > 50) {
          let evidence = rec.adWatchCount.toText() # " ads watched today";
          addFlag(fraudFlags, userId, #suspiciousAdClicks,
            "Unusually high ad watch count (>50 per day)", evidence, now);
        };
      };
      case null {};
    };
  };

  // Check if referee registered very recently before applying referral code (< 5 min)
  // This detects coordinated fake referrals
  public func checkSuspiciousReferral(
    fraudFlags : Map.Map<Principal, List.List<Types.FraudFlag>>,
    refereeId : Common.UserId,
    refereeCreatedAt : Common.Timestamp,
    now : Common.Timestamp,
  ) {
    let fiveMinNs : Common.Timestamp = 300_000_000_000; // 5 minutes in nanoseconds
    let age = now - refereeCreatedAt;
    if (age < fiveMinNs) {
      let evidence = "Account age at referral: " # (age / 1_000_000_000).toText() # " seconds";
      addFlag(fraudFlags, refereeId, #suspiciousReferral,
        "Referral applied within 5 minutes of registration", evidence, now);
    };
  };

  // Check if withdrawal is being requested from a very new account (< 7 days)
  public func checkEarlyWithdrawal(
    fraudFlags : Map.Map<Principal, List.List<Types.FraudFlag>>,
    userId : Common.UserId,
    userCreatedAt : Common.Timestamp,
    now : Common.Timestamp,
  ) {
    let sevenDaysNs : Common.Timestamp = 604_800_000_000_000; // 7 days in nanoseconds
    let age = now - userCreatedAt;
    if (age < sevenDaysNs) {
      let evidence = "Account age at withdrawal: " # (age / 86_400_000_000_000).toText() # " days";
      addFlag(fraudFlags, userId, #earlyWithdrawal,
        "Withdrawal requested within 7 days of account creation", evidence, now);
    };
  };

  // Check if A referred B and B is now trying to refer A (referral loop)
  public func checkReferralLoop(
    fraudFlags : Map.Map<Principal, List.List<Types.FraudFlag>>,
    callerId : Common.UserId,
    referrerId : Common.UserId,
    callerReferredBy : ?Common.UserId,
    now : Common.Timestamp,
  ) : Bool {
    // If caller was referred by referrerId, and referrerId is now trying to use caller's code → loop
    switch (callerReferredBy) {
      case (?referredBy) {
        if (Principal.equal(referredBy, referrerId)) {
          addFlag(fraudFlags, callerId, #referralLoop,
            "Referral loop detected", "User " # referrerId.toText() # " was already referred by " # callerId.toText(), now);
          addFlag(fraudFlags, referrerId, #referralLoop,
            "Referral loop detected", "User " # callerId.toText() # " referred by " # referrerId.toText() # " which they previously referred", now);
          return true;
        };
      };
      case null {};
    };
    false;
  };

  // Admin: manually flag a user
  public func manualFlag(
    fraudFlags : Map.Map<Principal, List.List<Types.FraudFlag>>,
    userId : Common.UserId,
    reason : Text,
    adminId : Common.UserId,
    now : Common.Timestamp,
  ) {
    addFlag(fraudFlags, userId, #manualFlag,
      reason, "Manually flagged by admin: " # adminId.toText(), now);
  };

  // Resolve a fraud flag (admin) with a resolution action
  public func resolveFlag(
    fraudFlags : Map.Map<Principal, List.List<Types.FraudFlag>>,
    userId : Common.UserId,
    flagType : Types.FraudFlagType,
    resolvedBy : Common.UserId,
    resolution : Types.FraudResolution,
    now : Common.Timestamp,
  ) : { #ok; #err : Text } {
    switch (fraudFlags.get(userId)) {
      case (?flags) {
        var found = false;
        flags.mapInPlace(func(f : Types.FraudFlag) : Types.FraudFlag {
          if (f.flagType == flagType and not f.isResolved) {
            found := true;
            f.isResolved := true;
            f.resolvedAt := ?now;
            f.resolvedBy := ?resolvedBy;
            f.resolution := ?resolution;
          };
          f;
        });
        if (found) #ok else #err("No unresolved flag of that type found");
      };
      case null { #err("No fraud flags for user") };
    };
  };

  // Get all fraud flags as public list (optionally filter unresolved only)
  public func getAllFlags(
    fraudFlags : Map.Map<Principal, List.List<Types.FraudFlag>>,
    unresolvedOnly : Bool,
  ) : [Types.FraudFlagPublic] {
    let result = List.empty<Types.FraudFlagPublic>();
    fraudFlags.forEach(func(_, flags) {
      flags.forEach(func(f : Types.FraudFlag) {
        if (not unresolvedOnly or not f.isResolved) {
          result.add(toPublic(f));
        };
      });
    });
    result.toArray();
  };

  // Count total coins rolled back via blockUser resolutions
  public func countRolledBackCoins(
    fraudFlags : Map.Map<Principal, List.List<Types.FraudFlag>>,
    penaltyCoins : Nat,
  ) : Nat {
    var total = 0;
    fraudFlags.forEach(func(_, flags) {
      flags.forEach(func(f : Types.FraudFlag) {
        switch (f.resolution) {
          case (?#blockUser) { total += penaltyCoins };
          case (_) {};
        };
      });
    });
    total;
  };

  // Compute aggregate fraud stats
  public func computeStats(
    fraudFlags : Map.Map<Principal, List.List<Types.FraudFlag>>,
    penaltyCoins : Nat,
  ) : Types.FraudStats {
    var total = 0;
    var unresolved = 0;
    var resolved = 0;
    var adClicks = 0;
    var multiAcc = 0;
    var refLoop = 0;
    var suspRef = 0;
    var earlyWd = 0;
    var manual = 0;

    fraudFlags.forEach(func(_, flags) {
      flags.forEach(func(f : Types.FraudFlag) {
        total += 1;
        if (f.isResolved) { resolved += 1 } else { unresolved += 1 };
        switch (f.flagType) {
          case (#suspiciousAdClicks) { adClicks += 1 };
          case (#multipleAccounts)   { multiAcc += 1 };
          case (#referralLoop)       { refLoop += 1 };
          case (#suspiciousReferral) { suspRef += 1 };
          case (#earlyWithdrawal)    { earlyWd += 1 };
          case (#manualFlag)         { manual += 1 };
        };
      });
    });

    let mostCommon =
      if (adClicks >= multiAcc and adClicks >= refLoop and adClicks >= suspRef and adClicks >= earlyWd and adClicks >= manual) "suspiciousAdClicks"
      else if (multiAcc >= adClicks and multiAcc >= refLoop and multiAcc >= suspRef and multiAcc >= earlyWd and multiAcc >= manual) "multipleAccounts"
      else if (refLoop >= adClicks and refLoop >= multiAcc and refLoop >= suspRef and refLoop >= earlyWd and refLoop >= manual) "referralLoop"
      else if (suspRef >= adClicks and suspRef >= multiAcc and suspRef >= refLoop and suspRef >= earlyWd and suspRef >= manual) "suspiciousReferral"
      else if (earlyWd >= adClicks and earlyWd >= multiAcc and earlyWd >= refLoop and earlyWd >= suspRef and earlyWd >= manual) "earlyWithdrawal"
      else "manualFlag";

    {
      totalFlagged = total;
      unresolvedFlags = unresolved;
      resolvedFlags = resolved;
      mostCommonFlagType = mostCommon;
      totalCoinsRolledBack = countRolledBackCoins(fraudFlags, penaltyCoins);
    };
  };
};
