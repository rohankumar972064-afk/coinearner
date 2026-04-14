import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Array "mo:core/Array";
import AccessControl "mo:caffeineai-authorization/access-control";
import InviteLinksModule "mo:caffeineai-invite-links/invite-links-module";
import Common "../types/common";
import UserTypes "../types/users";
import RewardTypes "../types/rewards";
import SettingsTypes "../types/settings";
import FraudTypes "../types/fraud";
import OtpTypes "../types/mobile-otp";
import OtpLib "../lib/mobile-otp";
import UserLib "../lib/users";
import RewardLib "../lib/rewards";
import FraudLib "../lib/fraud";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Common.UserId, UserTypes.UserProfile>,
  transactions : List.List<RewardTypes.Transaction>,
  inviteState : InviteLinksModule.InviteLinksSystemState,
  referralRelationships : List.List<RewardTypes.ReferralRelationship>,
  settingsVar : { var value : SettingsTypes.AppSettings },
  fraudFlags : Map.Map<Principal, List.List<FraudTypes.FraudFlag>>,
  sessions : Map.Map<Text, OtpTypes.SessionRecord>,
) {
  func requireReferralUser(userId : Common.UserId) {
    switch (users.get(userId)) {
      case null { Runtime.trap("User not registered") };
      case (?p) {
        if (p.isBlocked) { Runtime.trap("Account is blocked") };
      };
    };
  };

  func resolveReferralsUserId(caller : Principal, sessionToken : ?Text) : Common.UserId {
    let now = Time.now();
    switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { Runtime.trap("Not authenticated") };
      case (?uid) uid;
    };
  };

  /// Get caller's referral code (session-token aware)
  public shared ({ caller }) func getMyReferralCode(sessionToken : ?Text) : async Text {
    let userId = resolveReferralsUserId(caller, sessionToken);
    requireReferralUser(userId);
    switch (users.get(userId)) {
      case (?p) {
        let existingCodes = InviteLinksModule.getInviteCodes(inviteState);
        let alreadyRegistered = existingCodes.any(func(c : InviteLinksModule.InviteCode) : Bool { c.code == p.referralCode });
        if (not alreadyRegistered) {
          InviteLinksModule.generateInviteCode(inviteState, p.referralCode);
        };
        p.referralCode;
      };
      case null { Runtime.trap("User not found") };
    };
  };

  /// Apply a referral code — credits referralBonus coins (from settings) to the referrer (session-token aware)
  public shared ({ caller }) func applyReferralCode(code : Text, sessionToken : ?Text) : async () {
    let userId = resolveReferralsUserId(caller, sessionToken);
    requireReferralUser(userId);
    if (not settingsVar.value.referralsEnabled) {
      Runtime.trap("Referral system is currently disabled");
    };
    let callerProfile = switch (users.get(userId)) {
      case (?p) p;
      case null { Runtime.trap("User not found") };
    };
    if (callerProfile.referredBy != null) {
      Runtime.trap("Referral code already applied");
    };
    let referrer = switch (UserLib.findByReferralCode(users, code)) {
      case (?r) r;
      case null { Runtime.trap("Invalid referral code") };
    };
    if (Principal.equal(referrer.principal, userId)) {
      Runtime.trap("Cannot use your own referral code");
    };
    let now = Time.now();
    let isLoop = FraudLib.checkReferralLoop(fraudFlags, userId, referrer.principal, callerProfile.referredBy, now);
    if (isLoop) {
      Runtime.trap("Referral loop detected — this referral is not allowed");
    };
    FraudLib.checkSuspiciousReferral(fraudFlags, userId, callerProfile.createdAt, now);
    callerProfile.referredBy := ?referrer.principal;
    let bonus = settingsVar.value.referralBonus;
    UserLib.creditCoins(users, referrer.principal, bonus);
    RewardLib.logTransaction(transactions, referrer.principal, bonus, true, #referral,
      "Referral bonus from: " # callerProfile.username, now);

    referralRelationships.add({
      referrerId  = referrer.principal;
      refereeId   = userId;
      bonusGiven  = bonus;
      timestamp   = now;
      var status  : RewardTypes.ReferralStatus = #active;
      var revokeReason : ?Text = null;
    });
  };

  // ── Admin: Referral Management ─────────────────────────────────

  /// Admin: list all referral relationships
  public query ({ caller }) func adminGetAllReferrals() : async [RewardTypes.ReferralRelationshipPublic] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    referralRelationships.values()
      .map(func(r : RewardTypes.ReferralRelationship) : RewardTypes.ReferralRelationshipPublic {
        {
          referrerId   = r.referrerId;
          refereeId    = r.refereeId;
          bonusGiven   = r.bonusGiven;
          timestamp    = r.timestamp;
          status       = r.status;
          revokeReason = r.revokeReason;
        };
      })
      .toArray();
  };

  /// Admin: get referral chain for a user
  public query ({ caller }) func adminGetUserReferralChain(userId : Common.UserId) : async {
    referredBy : ?UserTypes.UserProfilePublic;
    referred : [UserTypes.UserProfilePublic];
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };

    let targetProfile = switch (users.get(userId)) {
      case (?p) p;
      case null { Runtime.trap("User not found") };
    };

    let referredByProfile : ?UserTypes.UserProfilePublic = switch (targetProfile.referredBy) {
      case (?referrerId) {
        switch (users.get(referrerId)) {
          case (?p) ?UserLib.toPublic(p);
          case null null;
        };
      };
      case null null;
    };

    let referred = referralRelationships.values()
      .filter(func(r : RewardTypes.ReferralRelationship) : Bool {
        Principal.equal(r.referrerId, userId);
      })
      .map(func(r : RewardTypes.ReferralRelationship) : UserTypes.UserProfilePublic {
        switch (users.get(r.refereeId)) {
          case (?p) UserLib.toPublic(p);
          case null {
            {
              principal    = r.refereeId;
              username     = "(deleted)";
              createdAt    = 0;
              coinBalance  = 0;
              isBlocked    = false;
              lastLoginDate = 0;
              currentStreak = 0;
              referralCode = "";
              referredBy   = null;
              blockHistory = [];
              mobileNumber = null;
              mobileVerified = false;
            };
          };
        };
      })
      .toArray();

    { referredBy = referredByProfile; referred = referred };
  };

  /// Admin: revoke a referral relationship
  public shared ({ caller }) func adminRevokeReferral(
    referrerId : Common.UserId,
    refereeId : Common.UserId,
    reason : Text,
    deductBonus : Bool,
  ) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    let rel = referralRelationships.find(func(r : RewardTypes.ReferralRelationship) : Bool {
      Principal.equal(r.referrerId, referrerId) and Principal.equal(r.refereeId, refereeId);
    });
    switch (rel) {
      case (?r) {
        r.status := #revoked;
        r.revokeReason := ?reason;
        if (deductBonus) {
          let now = Time.now();
          switch (users.get(referrerId)) {
            case (?rp) {
              let deduct = if (rp.coinBalance >= r.bonusGiven) r.bonusGiven else rp.coinBalance;
              if (deduct > 0) {
                rp.coinBalance -= deduct;
                RewardLib.logTransaction(transactions, referrerId, deduct, false, #admin,
                  "[Admin:" # caller.toText() # "] Referral bonus clawback — " # reason, now);
              };
            };
            case null {};
          };
        };
        #ok;
      };
      case null { #err("Referral relationship not found") };
    };
  };

  /// Admin: detect referrals created within 60 minutes of each other (suspicious timing)
  public query ({ caller }) func adminDetectSuspiciousReferralsByTime() : async [RewardTypes.ReferralRelationshipPublic] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    let sixtyMinNs : Common.Timestamp = 3_600_000_000_000;
    let all = referralRelationships.toArray();
    let suspicious = List.empty<RewardTypes.ReferralRelationshipPublic>();
    var i = 0;
    while (i < all.size()) {
      var j = i + 1;
      while (j < all.size()) {
        let a = all[i];
        let b = all[j];
        let diff = if (a.timestamp >= b.timestamp) a.timestamp - b.timestamp
                   else b.timestamp - a.timestamp;
        if (diff <= sixtyMinNs) {
          suspicious.add({
            referrerId = a.referrerId; refereeId = a.refereeId;
            bonusGiven = a.bonusGiven; timestamp = a.timestamp;
            status = a.status; revokeReason = a.revokeReason;
          });
        };
        j += 1;
      };
      i += 1;
    };
    suspicious.toArray();
  };
};
