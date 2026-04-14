import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Set "mo:core/Set";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import UserTypes "../types/users";
import RewardTypes "../types/rewards";
import WithdrawalTypes "../types/withdrawals";
import SettingsTypes "../types/settings";
import FraudTypes "../types/fraud";
import OtpTypes "../types/mobile-otp";
import OtpLib "../lib/mobile-otp";
import UserLib "../lib/users";
import RewardLib "../lib/rewards";
import WithdrawalLib "../lib/withdrawals";
import FraudLib "../lib/fraud";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Common.UserId, UserTypes.UserProfile>,
  transactions : List.List<RewardTypes.Transaction>,
  withdrawalRequests : List.List<WithdrawalTypes.WithdrawalRequest>,
  settingsVar : { var value : SettingsTypes.AppSettings },
  fraudFlags : Map.Map<Principal, List.List<FraudTypes.FraudFlag>>,
  sessions : Map.Map<Text, OtpTypes.SessionRecord>,
) {
  func requireWithdrawUser(userId : Common.UserId) {
    switch (users.get(userId)) {
      case null { Runtime.trap("User not registered") };
      case (?p) {
        if (p.isBlocked) { Runtime.trap("Account is blocked") };
      };
    };
  };

  func resolveWithdrawalsUserId(caller : Principal, sessionToken : ?Text) : Common.UserId {
    let now = Time.now();
    switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { Runtime.trap("Not authenticated") };
      case (?uid) uid;
    };
  };

  /// Submit a withdrawal request; deducts coins immediately (session-token aware)
  public shared ({ caller }) func submitWithdrawal(
    method : WithdrawalTypes.WithdrawalMethod,
    details : Text,
    rupeeAmount : Nat,
    paymentDetails : ?Text,
    sessionToken : ?Text,
  ) : async WithdrawalTypes.WithdrawalRequestPublic {
    let userId = resolveWithdrawalsUserId(caller, sessionToken);
    requireWithdrawUser(userId);
    if (not settingsVar.value.withdrawalsEnabled) {
      Runtime.trap("Withdrawals are currently disabled");
    };
    let now = Time.now();
    let userProfile = switch (users.get(userId)) {
      case (?p) p;
      case null { Runtime.trap("User not found") };
    };
    let req = WithdrawalLib.submitRequest(withdrawalRequests, userId, method, details, rupeeAmount, userProfile.coinBalance, paymentDetails, now, settingsVar.value);
    UserLib.deductCoins(users, userId, req.coinsDeducted);
    RewardLib.logTransaction(transactions, userId, req.coinsDeducted, false, #withdrawal, "Withdrawal request #" # req.id.toText(), now);
    // Fraud check: early withdrawal
    FraudLib.checkEarlyWithdrawal(fraudFlags, userId, userProfile.createdAt, now);
    WithdrawalLib.toPublic(req);
  };

  /// Get caller's withdrawal requests (session-token aware)
  public query ({ caller }) func getMyWithdrawals(sessionToken : ?Text) : async [WithdrawalTypes.WithdrawalRequestPublic] {
    let now = Time.now();
    let userId = switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { return [] };
      case (?uid) uid;
    };
    WithdrawalLib.getUserRequestsPublic(withdrawalRequests, userId);
  };

  // ── Admin ──────────────────────────────────────────────────────

  /// Admin: get withdrawal requests with optional filters
  public query ({ caller }) func adminGetAllWithdrawals(
    statusFilter : ?WithdrawalTypes.WithdrawalStatus,
    userIdFilter : ?Common.UserId,
    fromDate : ?Common.Timestamp,
    toDate : ?Common.Timestamp,
    minRupees : ?Nat,
    maxRupees : ?Nat,
  ) : async [WithdrawalTypes.WithdrawalRequestPublic] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    withdrawalRequests.values()
      .filter(func(r : WithdrawalTypes.WithdrawalRequest) : Bool {
        let matchStatus = switch (statusFilter) {
          case (?s) r.status == s;
          case null true;
        };
        let matchUser = switch (userIdFilter) {
          case (?uid) Principal.equal(r.userId, uid);
          case null true;
        };
        let matchFrom = switch (fromDate) {
          case (?fd) r.createdAt >= fd;
          case null true;
        };
        let matchTo = switch (toDate) {
          case (?td) r.createdAt <= td;
          case null true;
        };
        let matchMin = switch (minRupees) {
          case (?min) r.rupeeAmount >= min;
          case null true;
        };
        let matchMax = switch (maxRupees) {
          case (?max) r.rupeeAmount <= max;
          case null true;
        };
        matchStatus and matchUser and matchFrom and matchTo and matchMin and matchMax;
      })
      .map(func(r : WithdrawalTypes.WithdrawalRequest) : WithdrawalTypes.WithdrawalRequestPublic {
        WithdrawalLib.toPublic(r);
      })
      .toArray();
  };

  /// Admin: approve a withdrawal request with optional note
  public shared ({ caller }) func adminApproveWithdrawal(requestId : Nat, note : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    let now = Time.now();
    WithdrawalLib.approveRequest(withdrawalRequests, requestId, caller, note, now);
  };

  /// Admin: reject a withdrawal request (refunds coins to user)
  public shared ({ caller }) func adminRejectWithdrawal(requestId : Nat, adminNote : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    let now = Time.now();
    switch (withdrawalRequests.find(func(r : WithdrawalTypes.WithdrawalRequest) : Bool { r.id == requestId })) {
      case (?req) {
        if (req.status == #pending) {
          UserLib.creditCoins(users, req.userId, req.coinsDeducted);
          RewardLib.logTransaction(transactions, req.userId, req.coinsDeducted, true, #withdrawal,
            "Refund: withdrawal #" # requestId.toText() # " rejected by admin:" # caller.toText(), now);
        };
      };
      case null {};
    };
    WithdrawalLib.rejectRequest(withdrawalRequests, requestId, caller, adminNote, now);
  };

  /// Admin: mark an approved withdrawal as paid
  public shared ({ caller }) func adminMarkWithdrawalPaid(id : Nat, paymentRef : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    let now = Time.now();
    WithdrawalLib.markPaid(withdrawalRequests, id, caller, paymentRef, now);
  };

  /// Admin: add a memo note to a withdrawal without changing its status
  public shared ({ caller }) func adminAddWithdrawalNote(requestId : Nat, note : Text) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    switch (withdrawalRequests.find(func(r : WithdrawalTypes.WithdrawalRequest) : Bool { r.id == requestId })) {
      case (?req) {
        req.adminNote := "[Admin:" # caller.toText() # "] " # note;
        #ok;
      };
      case null { #err("Withdrawal request not found") };
    };
  };

  /// Admin: bulk approve up to 10 withdrawal requests
  public shared ({ caller }) func adminBulkApproveWithdrawals(requestIds : [Nat], note : Text) : async { succeeded : Nat; failed : Nat } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    if (requestIds.size() > 10) {
      Runtime.trap("Cannot approve more than 10 withdrawals at once");
    };
    let now = Time.now();
    var succeeded = 0;
    var failed = 0;
    for (id in requestIds.values()) {
      switch (withdrawalRequests.find(func(r : WithdrawalTypes.WithdrawalRequest) : Bool { r.id == id and r.status == #pending })) {
        case (?_) {
          WithdrawalLib.approveRequest(withdrawalRequests, id, caller, note, now);
          succeeded += 1;
        };
        case null { failed += 1 };
      };
    };
    { succeeded; failed };
  };

  /// Admin: bulk reject up to 10 withdrawal requests with shared reason
  public shared ({ caller }) func adminBulkRejectWithdrawals(requestIds : [Nat], reason : Text) : async { succeeded : Nat; failed : Nat } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    if (requestIds.size() > 10) {
      Runtime.trap("Cannot reject more than 10 withdrawals at once");
    };
    let now = Time.now();
    var succeeded = 0;
    var failed = 0;
    for (id in requestIds.values()) {
      switch (withdrawalRequests.find(func(r : WithdrawalTypes.WithdrawalRequest) : Bool { r.id == id and r.status == #pending })) {
        case (?req) {
          UserLib.creditCoins(users, req.userId, req.coinsDeducted);
          RewardLib.logTransaction(transactions, req.userId, req.coinsDeducted, true, #withdrawal,
            "Refund: withdrawal #" # id.toText() # " bulk rejected by admin:" # caller.toText(), now);
          WithdrawalLib.rejectRequest(withdrawalRequests, id, caller, reason, now);
          succeeded += 1;
        };
        case null { failed += 1 };
      };
    };
    { succeeded; failed };
  };

  /// Admin: get platform stats
  public query ({ caller }) func adminGetStats() : async WithdrawalTypes.AdminStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    var totalCoins : Common.Coins = 0;
    users.forEach(func(_, p) { totalCoins += p.coinBalance });
    WithdrawalLib.computeStats(withdrawalRequests, users.size(), totalCoins);
  };

  /// Admin: get enhanced platform stats with trends and breakdowns
  public query ({ caller }) func adminGetEnhancedStats() : async WithdrawalTypes.EnhancedAdminStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };

    let now = Time.now();
    let oneDayNs : Int = 86_400_000_000_000;
    let oneWeekNs : Int = 7 * oneDayNs;
    let weekAgo = now - oneWeekNs;

    var totalCoins : Common.Coins = 0;
    users.forEach(func(_, p) { totalCoins += p.coinBalance });
    let baseStats = WithdrawalLib.computeStats(withdrawalRequests, users.size(), totalCoins);

    let activeSet = Set.empty<Common.UserId>();
    transactions.forEach(func(t : RewardTypes.Transaction) {
      if (t.createdAt >= weekAgo) {
        activeSet.add(t.userId);
      };
    });
    let activeUsersThisWeek = activeSet.size();

    var totalAdsWatched : Nat = 0;
    var totalCoinsFromAds : Nat = 0;
    var totalCoinsFromDaily : Nat = 0;
    var totalCoinsFromReferral : Nat = 0;
    var totalCoinsFromTasks : Nat = 0;
    var totalCoinsFromAdmin : Nat = 0;
    var totalCoinsEarned : Nat = 0;

    transactions.forEach(func(t : RewardTypes.Transaction) {
      if (t.isCredit) {
        totalCoinsEarned += t.amount;
        switch (t.method) {
          case (#ad) {
            totalAdsWatched += 1;
            totalCoinsFromAds += t.amount;
          };
          case (#daily) { totalCoinsFromDaily += t.amount };
          case (#referral) { totalCoinsFromReferral += t.amount };
          case (#task) { totalCoinsFromTasks += t.amount };
          case (#admin) { totalCoinsFromAdmin += t.amount };
          case (#withdrawal) {};
        };
      };
    });

    let avgCoinsPerAd = if (totalAdsWatched == 0) 0 else totalCoinsFromAds / totalAdsWatched;

    let totalBreakdown = totalCoinsFromAds + totalCoinsFromDaily + totalCoinsFromReferral + totalCoinsFromTasks + totalCoinsFromAdmin;
    let earningsBreakdown : WithdrawalTypes.EarningsBreakdown = if (totalBreakdown == 0) {
      { fromAds = 0; fromDaily = 0; fromReferral = 0; fromTasks = 0; fromAdmin = 0 };
    } else {
      {
        fromAds      = (totalCoinsFromAds      * 10000) / totalBreakdown;
        fromDaily    = (totalCoinsFromDaily    * 10000) / totalBreakdown;
        fromReferral = (totalCoinsFromReferral * 10000) / totalBreakdown;
        fromTasks    = (totalCoinsFromTasks    * 10000) / totalBreakdown;
        fromAdmin    = (totalCoinsFromAdmin    * 10000) / totalBreakdown;
      };
    };

    var totalRupeesPaidOut : Nat = 0;
    withdrawalRequests.forEach(func(r : WithdrawalTypes.WithdrawalRequest) {
      switch (r.status) {
        case (#approved) { totalRupeesPaidOut += r.rupeeAmount };
        case (#paid) { totalRupeesPaidOut += r.rupeeAmount };
        case (_) {};
      };
    });

    let thirtyDays : Nat = 30;
    let varDailyCoins = Array.tabulate(thirtyDays, func(_ : Nat) : Nat = 0).toVarArray<Nat>();
    let varDailyRupees = Array.tabulate(thirtyDays, func(_ : Nat) : Nat = 0).toVarArray<Nat>();
    let thirtyDaysNs : Int = 30 * oneDayNs;
    let thirtyDaysAgo = now - thirtyDaysNs;

    transactions.forEach(func(t : RewardTypes.Transaction) {
      if (t.createdAt >= thirtyDaysAgo and t.isCredit and t.method != #withdrawal) {
        let dayOffset = Int.abs((now - t.createdAt) / oneDayNs);
        if (dayOffset < thirtyDays) {
          varDailyCoins[dayOffset] += t.amount;
        };
      };
    });
    withdrawalRequests.forEach(func(r : WithdrawalTypes.WithdrawalRequest) {
      switch (r.status) {
        case (#approved or #paid) {
          let resolvedTime = switch (r.resolvedAt) { case (?t) t; case null r.createdAt };
          if (resolvedTime >= thirtyDaysAgo) {
            let dayOffset = Int.abs((now - resolvedTime) / oneDayNs);
            if (dayOffset < thirtyDays) {
              varDailyRupees[dayOffset] += r.rupeeAmount;
            };
          };
        };
        case (_) {};
      };
    });

    let epochDays = Int.abs(now) / Int.abs(oneDayNs);
    let trend = Array.tabulate(thirtyDays, func(i : Nat) : WithdrawalTypes.DailyEarningEntry {
      let dayNum = if (epochDays >= i) { epochDays - i } else { 0 };
      let date = dayNumToDate(dayNum);
      {
        date = date;
        coinsEarned = varDailyCoins[i];
        rupeesWithdrawn = varDailyRupees[i];
      };
    });

    {
      totalUsers                = baseStats.totalUsers;
      totalCoinsInCirculation   = baseStats.totalCoinsInCirculation;
      pendingWithdrawalsCount   = baseStats.pendingWithdrawalsCount;
      totalApprovedWithdrawalsRupees = baseStats.totalApprovedWithdrawalsRupees;
      activeUsersThisWeek       = activeUsersThisWeek;
      totalAdsWatched           = totalAdsWatched;
      avgCoinsPerAd             = avgCoinsPerAd;
      totalCoinsEarned          = totalCoinsEarned;
      totalRupeesPaidOut        = totalRupeesPaidOut;
      earningsBreakdown         = earningsBreakdown;
      dailyEarningsTrend        = trend;
    };
  };

  /// Admin: get all transactions with pagination and optional filters
  public query ({ caller }) func adminGetAllTransactions(
    userId : ?Common.UserId,
    method : ?RewardTypes.TransactionMethod,
    fromDate : ?Common.Timestamp,
    toDate : ?Common.Timestamp,
    limit : Nat,
    offset : Nat,
  ) : async { transactions : [RewardTypes.Transaction]; total : Nat } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };

    let filtered = transactions.values().filter(func(t : RewardTypes.Transaction) : Bool {
      let matchUser = switch (userId) {
        case (?uid) Principal.equal(t.userId, uid);
        case null true;
      };
      let matchMethod = switch (method) {
        case (?m) t.method == m;
        case null true;
      };
      let matchFrom = switch (fromDate) {
        case (?fd) t.createdAt >= fd;
        case null true;
      };
      let matchTo = switch (toDate) {
        case (?td) t.createdAt <= td;
        case null true;
      };
      matchUser and matchMethod and matchFrom and matchTo;
    });

    let all = filtered.toArray();
    let total = all.size();
    let end = Nat.min(offset + limit, total);
    let page = if (offset >= total) [] else all.sliceToArray(offset, end);

    { transactions = page; total = total };
  };

  // ── Date helper ────────────────────────────────────────────────

  func dayNumToDate(dayNum : Nat) : Text {
    let jdn : Int = dayNum + 2440588;
    let a : Int = jdn + 32044;
    let b : Int = (4 * a + 3) / 146097;
    let c : Int = a - (146097 * b) / 4;
    let d : Int = (4 * c + 3) / 1461;
    let e : Int = c - (1461 * d) / 4;
    let m : Int = (5 * e + 2) / 153;
    let day   : Int = e - (153 * m + 2) / 5 + 1;
    let month : Int = m + 3 - 12 * (m / 10);
    let year  : Int = 100 * b + d - 4800 + m / 10;
    padYear(Int.abs(year)) # "-" # pad2(Int.abs(month)) # "-" # pad2(Int.abs(day));
  };

  func pad2(n : Nat) : Text {
    if (n < 10) "0" # n.toText() else n.toText();
  };

  func padYear(n : Nat) : Text {
    if (n < 10) "000" # n.toText()
    else if (n < 100) "00" # n.toText()
    else if (n < 1000) "0" # n.toText()
    else n.toText();
  };
};
