import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import AccessControl "mo:caffeineai-authorization/access-control";
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
  dailyClaims : Map.Map<Common.UserId, RewardTypes.DailyClaimRecord>,
  adRecords : Map.Map<Common.UserId, RewardTypes.AdWatchRecord>,
  tasks : List.List<RewardTypes.Task>,
  taskCompletions : Map.Map<RewardTypes.TaskCompletionKey, RewardTypes.TaskCompletion>,
  transactions : List.List<RewardTypes.Transaction>,
  settingsVar : { var value : SettingsTypes.AppSettings },
  fraudFlags : Map.Map<Principal, List.List<FraudTypes.FraudFlag>>,
  sessions : Map.Map<Text, OtpTypes.SessionRecord>,
) {
  func requireRewardsUser(userId : Common.UserId) {
    switch (users.get(userId)) {
      case null { Runtime.trap("User not registered") };
      case (?p) {
        if (p.isBlocked) { Runtime.trap("Account is blocked") };
      };
    };
  };

  func resolveRewardsUserId(caller : Principal, sessionToken : ?Text) : Common.UserId {
    let now = Time.now();
    switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { Runtime.trap("Not authenticated") };
      case (?uid) uid;
    };
  };

  func completionKey(userId : Common.UserId, taskId : Nat) : RewardTypes.TaskCompletionKey {
    userId.toText() # ":" # taskId.toText();
  };

  /// Claim daily reward — returns coins earned (session-token aware)
  public shared ({ caller }) func claimDailyReward(sessionToken : ?Text) : async Common.Coins {
    let userId = resolveRewardsUserId(caller, sessionToken);
    requireRewardsUser(userId);
    let now = Time.now();
    let coins = RewardLib.claimDaily(dailyClaims, userId, now, settingsVar.value);
    UserLib.creditCoins(users, userId, coins);
    RewardLib.logTransaction(transactions, userId, coins, true, #daily, "Daily reward", now);
    coins;
  };

  /// Record an ad watch — returns coins earned (session-token aware)
  public shared ({ caller }) func watchAd(sessionToken : ?Text) : async Common.Coins {
    let userId = resolveRewardsUserId(caller, sessionToken);
    requireRewardsUser(userId);
    let now = Time.now();
    let coins = RewardLib.recordAdWatch(adRecords, userId, now, settingsVar.value);
    UserLib.creditCoins(users, userId, coins);
    RewardLib.logTransaction(transactions, userId, coins, true, #ad, "Ad watch reward", now);
    // Fraud check: flag if >50 ads watched today (non-blocking)
    FraudLib.checkAdClickFraud(fraudFlags, userId, adRecords.get(userId), now);
    coins;
  };

  /// List all active tasks
  public query func listTasks() : async [RewardTypes.Task] {
    RewardLib.listTasks(tasks, settingsVar.value);
  };

  /// Complete a task — returns coins earned (session-token aware)
  public shared ({ caller }) func completeTask(taskId : Nat, sessionToken : ?Text) : async Common.Coins {
    let userId = resolveRewardsUserId(caller, sessionToken);
    requireRewardsUser(userId);
    if (not settingsVar.value.tasksEnabled) {
      Runtime.trap("Tasks are currently disabled");
    };
    let now = Time.now();
    let task = switch (tasks.find(func(t : RewardTypes.Task) : Bool { t.id == taskId and t.isActive })) {
      case (?t) t;
      case null { Runtime.trap("Task not found or not active") };
    };
    let key = completionKey(userId, taskId);
    if (taskCompletions.containsKey(key)) {
      Runtime.trap("Task already completed");
    };
    taskCompletions.add(key, { userId = userId; taskId = taskId; completedAt = now });
    UserLib.creditCoins(users, userId, task.coinReward);
    RewardLib.logTransaction(transactions, userId, task.coinReward, true, #task, "Task: " # task.title, now);
    task.coinReward;
  };

  /// Get tasks completed by caller (session-token aware)
  public query ({ caller }) func getMyCompletedTasks(sessionToken : ?Text) : async [RewardTypes.TaskCompletion] {
    let now = Time.now();
    let userId = switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { return [] };
      case (?uid) uid;
    };
    taskCompletions.values().filter(func(c : RewardTypes.TaskCompletion) : Bool { Principal.equal(c.userId, userId) }).toArray();
  };

  /// Get caller's transaction history (paginated, sorted newest first) (session-token aware)
  public query ({ caller }) func getTransactionHistory(limit : Nat, offset : Nat, sessionToken : ?Text) : async { transactions : [RewardTypes.Transaction]; total : Nat } {
    let now = Time.now();
    let userId = switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { return { transactions = []; total = 0 } };
      case (?uid) uid;
    };
    let all = RewardLib.getUserTransactions(transactions, userId);
    let total = all.size();
    let end = Nat.min(offset + limit, total);
    let page = if (offset >= total) [] else all.sliceToArray(offset, end);
    { transactions = page; total = total };
  };
};
