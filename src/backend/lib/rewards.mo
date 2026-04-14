import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Common "../types/common";
import Types "../types/rewards";
import SettingsTypes "../types/settings";

module {
  // ── Daily Reward ──────────────────────────────────────────────

  // Claim daily reward; reads base/multiplier/cap from settings.
  // Returns coins earned; traps if already claimed today or feature disabled.
  public func claimDaily(
    claims : Map.Map<Common.UserId, Types.DailyClaimRecord>,
    userId : Common.UserId,
    now : Common.Timestamp,
    settings : SettingsTypes.AppSettings,
  ) : Common.Coins {
    if (not settings.dailyRewardsEnabled) {
      Runtime.trap("Daily rewards are currently disabled");
    };
    let oneDayNs : Common.Timestamp = 86_400_000_000_000;
    switch (claims.get(userId)) {
      case (?rec) {
        let elapsed = now - rec.lastClaimTime;
        if (elapsed < oneDayNs) {
          Runtime.trap("Already claimed today");
        };
        // Reset streak if > 48h gap
        if (elapsed >= 2 * oneDayNs) {
          rec.streakDays := 1;
        } else {
          rec.streakDays += 1;
        };
        rec.lastClaimTime := now;
        let streak = Nat.min(rec.streakDays, settings.streakCap);
        settings.dailyBaseReward + streak * settings.streakMultiplier;
      };
      case null {
        claims.add(userId, {
          userId = userId;
          var lastClaimTime = now;
          var streakDays = 1;
        });
        settings.dailyBaseReward + settings.streakMultiplier; // streak=1
      };
    };
  };

  // ── Ad Watching ───────────────────────────────────────────────

  // Truncate nanosecond timestamp to day boundary
  func dayBucket(now : Common.Timestamp) : Common.Timestamp {
    let oneDayNs : Common.Timestamp = 86_400_000_000_000;
    now - (now % oneDayNs);
  };

  // Deterministic pseudo-random coins in range coinsPerAd..(coinsPerAd*2)
  func pseudoRandCoins(now : Common.Timestamp, count : Nat, base : Nat) : Common.Coins {
    let seed = Int.abs(now) + count;
    (seed % (base + 1)) + base;
  };

  // Record an ad watch; reads maxDailyAdWatches + coinsPerAd from settings.
  // Returns coins earned; traps if daily limit reached or feature disabled.
  public func recordAdWatch(
    adRecords : Map.Map<Common.UserId, Types.AdWatchRecord>,
    userId : Common.UserId,
    now : Common.Timestamp,
    settings : SettingsTypes.AppSettings,
  ) : Common.Coins {
    if (not settings.adsEnabled) {
      Runtime.trap("Ad watching is currently disabled");
    };
    let today = dayBucket(now);
    switch (adRecords.get(userId)) {
      case (?rec) {
        if (rec.adWatchDate != today) {
          rec.adWatchDate := today;
          rec.adWatchCount := 0;
        };
        if (rec.adWatchCount >= settings.maxDailyAdWatches) {
          Runtime.trap("Daily ad limit reached (max " # settings.maxDailyAdWatches.toText() # ")");
        };
        rec.adWatchCount += 1;
        pseudoRandCoins(now, rec.adWatchCount, settings.coinsPerAd);
      };
      case null {
        adRecords.add(userId, {
          userId = userId;
          var adWatchDate = today;
          var adWatchCount = 1;
        });
        pseudoRandCoins(now, 1, settings.coinsPerAd);
      };
    };
  };

  // ── Tasks ─────────────────────────────────────────────────────

  // List all active tasks
  public func listTasks(
    tasks : List.List<Types.Task>,
    settings : SettingsTypes.AppSettings,
  ) : [Types.Task] {
    if (not settings.tasksEnabled) { return [] };
    tasks.values().filter(func(t : Types.Task) : Bool { t.isActive }).toArray();
  };

  // ── Transactions ──────────────────────────────────────────────

  // Append a transaction; uses list size as ID
  public func logTransaction(
    txns : List.List<Types.Transaction>,
    userId : Common.UserId,
    amount : Common.Coins,
    isCredit : Bool,
    method : Types.TransactionMethod,
    note : Text,
    now : Common.Timestamp,
  ) {
    txns.add({
      id = txns.size();
      userId = userId;
      amount = amount;
      isCredit = isCredit;
      method = method;
      note = note;
      createdAt = now;
    });
  };

  // Get transaction history for a user (sorted newest-first via reverse)
  public func getUserTransactions(
    txns : List.List<Types.Transaction>,
    userId : Common.UserId,
  ) : [Types.Transaction] {
    txns.values()
      .filter(func(t : Types.Transaction) : Bool { Principal.equal(t.userId, userId) })
      .toArray()
      .reverse();
  };
};
