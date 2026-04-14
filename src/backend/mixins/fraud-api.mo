import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import UserTypes "../types/users";
import FraudTypes "../types/fraud";
import UserLib "../lib/users";
import FraudLib "../lib/fraud";
import SettingsTypes "../types/settings";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Common.UserId, UserTypes.UserProfile>,
  fraudFlags : Map.Map<Principal, List.List<FraudTypes.FraudFlag>>,
  settingsVar : { var value : SettingsTypes.AppSettings },
) {
  // ── Admin ──────────────────────────────────────────────────────

  /// Admin: get fraud flags — unresolved by default, pass filterAll=true for all
  public query ({ caller }) func adminGetFraudFlags(unresolvedOnly : Bool) : async [FraudTypes.FraudFlagPublic] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    FraudLib.getAllFlags(fraudFlags, unresolvedOnly);
  };

  /// Admin: resolve a fraud flag for a specific user with a resolution action
  public shared ({ caller }) func adminResolveFraudFlag(
    userId : Common.UserId,
    flagType : FraudTypes.FraudFlagType,
    resolution : FraudTypes.FraudResolution,
  ) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    let now = Time.now();
    // If resolution is blockUser, block the user too
    switch (resolution) {
      case (#blockUser) {
        if (users.containsKey(userId)) {
          UserLib.setBlocked(users, userId, true, caller, "Fraud flag resolution: blockUser", now);
        };
      };
      case (_) {};
    };
    FraudLib.resolveFlag(fraudFlags, userId, flagType, caller, resolution, now);
  };

  /// Admin: manually flag a user
  public shared ({ caller }) func adminFlagUser(
    userId : Common.UserId,
    reason : Text,
  ) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    if (not users.containsKey(userId)) {
      return #err("User not found");
    };
    let now = Time.now();
    FraudLib.manualFlag(fraudFlags, userId, reason, caller, now);
    #ok;
  };

  /// Admin: get fraud statistics
  public query ({ caller }) func adminGetFraudStats() : async FraudTypes.FraudStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    FraudLib.computeStats(fraudFlags, settingsVar.value.fraudPenaltyCoins);
  };

  /// Admin: get all flagged users (those with at least one unresolved flag) including profiles
  public query ({ caller }) func adminGetFlaggedUsers() : async [UserTypes.UserProfilePublic] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    var result = List.empty<UserTypes.UserProfilePublic>();
    fraudFlags.forEach(func(userId, flags) {
      let hasUnresolved = flags.any(func(f : FraudTypes.FraudFlag) : Bool { not f.isResolved });
      if (hasUnresolved) {
        switch (UserLib.getProfile(users, userId)) {
          case (?profile) { result.add(profile) };
          case null {};
        };
      };
    });
    result.toArray();
  };
};
