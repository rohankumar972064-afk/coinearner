import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Text "mo:core/Text";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import UserTypes "../types/users";
import RewardTypes "../types/rewards";
import WithdrawalTypes "../types/withdrawals";
import FraudTypes "../types/fraud";
import OtpTypes "../types/mobile-otp";
import OtpLib "../lib/mobile-otp";
import UserLib "../lib/users";
import RewardLib "../lib/rewards";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Common.UserId, UserTypes.UserProfile>,
  transactions : List.List<RewardTypes.Transaction>,
  tasks : List.List<RewardTypes.Task>,
  withdrawalRequests : List.List<WithdrawalTypes.WithdrawalRequest>,
  fraudFlags : Map.Map<Principal, List.List<FraudTypes.FraudFlag>>,
  sessions : Map.Map<Text, OtpTypes.SessionRecord>,
) {
  // Seed default tasks on first register call if empty
  func ensureTasksSeeded() {
    if (tasks.size() == 0) {
      tasks.add({ id = 0; title = "Share on social media"; description = "Share our app on your social media profile"; coinReward = 50; isActive = true });
      tasks.add({ id = 1; title = "Complete profile"; description = "Fill in your username and profile details"; coinReward = 20; isActive = true });
      tasks.add({ id = 2; title = "Watch tutorial"; description = "Watch the getting started tutorial video"; coinReward = 30; isActive = true });
    };
  };

  // Generate a unique referral code from a principal (last 8 chars of textual representation)
  func makeReferralCode(p : Principal) : Text {
    let t = p.toText();
    let sz = t.size();
    if (sz <= 8) { t } else {
      let start = sz - 8 : Nat;
      var buf = "";
      var i = 0;
      for (c in t.toIter()) {
        if (i >= start) { buf #= Text.fromChar(c) };
        i += 1;
      };
      buf;
    };
  };

  // Resolve effective user ID — prefers non-anonymous caller, falls back to session token
  func resolveUser(caller : Principal, sessionToken : ?Text) : ?Common.UserId {
    let now = Time.now();
    OtpLib.effectiveCaller(sessions, caller, sessionToken, now);
  };

  /// Register current caller as a new user (session-token aware)
  public shared ({ caller }) func registerUser(username : Text, sessionToken : ?Text) : async UserTypes.UserProfilePublic {
    let userId = switch (resolveUser(caller, sessionToken)) {
      case null { Runtime.trap("Not authenticated") };
      case (?uid) uid;
    };
    let now = Time.now();
    let code = makeReferralCode(userId);
    let profile = UserLib.register(users, userId, username, code, now);
    ensureTasksSeeded();
    UserLib.toPublic(profile);
  };

  /// Get caller's own profile (session-token aware)
  public query ({ caller }) func getMyProfile(sessionToken : ?Text) : async ?UserTypes.UserProfilePublic {
    let now = Time.now();
    let userId = switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { return null };
      case (?uid) uid;
    };
    UserLib.getProfile(users, userId);
  };

  /// Get any user's profile (caller can get own; admin can get any)
  public query ({ caller }) func getUserProfile(userId : Common.UserId, sessionToken : ?Text) : async ?UserTypes.UserProfilePublic {
    let now = Time.now();
    let effectiveId = switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { Runtime.trap("Not authenticated") };
      case (?uid) uid;
    };
    if (not Principal.equal(effectiveId, userId) and not AccessControl.isAdmin(accessControlState, effectiveId)) {
      Runtime.trap("Unauthorized");
    };
    UserLib.getProfile(users, userId);
  };

  /// Get caller's coin balance (session-token aware)
  public query ({ caller }) func getCoinBalance(sessionToken : ?Text) : async Common.Coins {
    let now = Time.now();
    let userId = switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { return 0 };
      case (?uid) uid;
    };
    switch (users.get(userId)) {
      case (?p) p.coinBalance;
      case null 0;
    };
  };

  /// Get coin balance expressed as rupees (floor) (session-token aware)
  public query ({ caller }) func getRupeeBalance(sessionToken : ?Text) : async Nat {
    let now = Time.now();
    let userId = switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { return 0 };
      case (?uid) uid;
    };
    switch (users.get(userId)) {
      case (?p) UserLib.coinsToRupees(p.coinBalance);
      case null 0;
    };
  };

  // ── Admin ──────────────────────────────────────────────────────

  /// Admin: list all users with computed stats
  public query ({ caller }) func adminGetAllUsers() : async [UserTypes.UserAdminDetail] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    users.values().map(func(p : UserTypes.UserProfile) : UserTypes.UserAdminDetail {
      var earned : Nat = 0;
      transactions.forEach(func(t : RewardTypes.Transaction) {
        if (Principal.equal(t.userId, p.principal) and t.isCredit) {
          earned += t.amount;
        };
      });
      var withdrawn : Nat = 0;
      withdrawalRequests.forEach(func(r : WithdrawalTypes.WithdrawalRequest) {
        if (Principal.equal(r.userId, p.principal)) {
          switch (r.status) {
            case (#paid or #approved) { withdrawn += r.rupeeAmount };
            case (_) {};
          };
        };
      });
      let flagCount : Nat = switch (fraudFlags.get(p.principal)) {
        case (?fl) fl.filter(func(f : FraudTypes.FraudFlag) : Bool { not f.isResolved }).size();
        case null 0;
      };
      {
        profile = UserLib.toPublic(p);
        totalCoinsEarned = earned;
        totalWithdrawnRupees = withdrawn;
        fraudFlagCount = flagCount;
      };
    }).toArray();
  };

  /// Admin: get full detail for a single user
  public query ({ caller }) func adminGetUserDetail(userId : Common.UserId) : async ?UserTypes.UserAdminDetail {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    switch (users.get(userId)) {
      case null null;
      case (?p) {
        var earned : Nat = 0;
        transactions.forEach(func(t : RewardTypes.Transaction) {
          if (Principal.equal(t.userId, p.principal) and t.isCredit) {
            earned += t.amount;
          };
        });
        var withdrawn : Nat = 0;
        withdrawalRequests.forEach(func(r : WithdrawalTypes.WithdrawalRequest) {
          if (Principal.equal(r.userId, p.principal)) {
            switch (r.status) {
              case (#paid or #approved) { withdrawn += r.rupeeAmount };
              case (_) {};
            };
          };
        });
        let flagCount : Nat = switch (fraudFlags.get(p.principal)) {
          case (?fl) fl.filter(func(f : FraudTypes.FraudFlag) : Bool { not f.isResolved }).size();
          case null 0;
        };
        ?{
          profile = UserLib.toPublic(p);
          totalCoinsEarned = earned;
          totalWithdrawnRupees = withdrawn;
          fraudFlagCount = flagCount;
        };
      };
    };
  };

  /// Admin: toggle block status on a user with reason and audit trail
  public shared ({ caller }) func adminToggleBlock(userId : Common.UserId, blocked : Bool, reason : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    let now = Time.now();
    UserLib.setBlocked(users, userId, blocked, caller, reason, now);
  };

  /// Admin: manually add coins to a user with a note (logged with admin attribution)
  public shared ({ caller }) func adminAddCoins(userId : Common.UserId, amount : Common.Coins, note : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    UserLib.creditCoins(users, userId, amount);
    let now = Time.now();
    RewardLib.logTransaction(transactions, userId, amount, true, #admin,
      "[Admin:" # caller.toText() # "] " # note, now);
  };

  /// Admin: deduct coins from a user with a reason (logged with admin attribution)
  public shared ({ caller }) func adminDeductCoins(userId : Common.UserId, amount : Common.Coins, reason : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    UserLib.deductCoins(users, userId, amount);
    let now = Time.now();
    RewardLib.logTransaction(transactions, userId, amount, false, #admin,
      "[Admin deduct:" # caller.toText() # "] " # reason, now);
  };

  /// Admin: block/unblock multiple users in one call
  public shared ({ caller }) func adminBulkBlockUsers(
    userIds : [Common.UserId],
    blocked : Bool,
    reason : Text,
  ) : async { succeeded : Nat; failed : Nat } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    let now = Time.now();
    var succeeded = 0;
    var failed = 0;
    for (userId in userIds.values()) {
      if (users.containsKey(userId)) {
        UserLib.setBlocked(users, userId, blocked, caller, reason, now);
        succeeded += 1;
      } else {
        failed += 1;
      };
    };
    { succeeded; failed };
  };
};
