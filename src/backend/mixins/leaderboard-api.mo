import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";

import Common "../types/common";
import UserTypes "../types/users";
import RewardTypes "../types/rewards";
import OtpTypes "../types/mobile-otp";
import OtpLib "../lib/mobile-otp";

mixin (
  users       : Map.Map<Common.UserId, UserTypes.UserProfile>,
  transactions : List.List<RewardTypes.Transaction>,
  sessions    : Map.Map<Text, OtpTypes.SessionRecord>,
) {

  type LeaderboardEntry = {
    rank       : Nat;
    username   : Text;
    coinsEarned : Nat;
    userId     : Text;
  };

  type LeaderboardResult = {
    entries  : [LeaderboardEntry];
    userRank : { rank : Nat; coinsEarned : Nat; username : Text };
  };

  /// Get top earners with optional session token for rank display (session-token aware)
  public shared query ({ caller }) func getTopEarners(period : Text, limit : Nat, sessionToken : ?Text) : async LeaderboardResult {

    // Resolve effective user for rank display
    let now = Time.now();
    let effectiveUser : ?Common.UserId = OtpLib.effectiveCaller(sessions, caller, sessionToken, now);

    // Build a sorted array of (principal, coinsEarned, username) depending on period
    type RawEntry = { principal : Common.UserId; coinsEarned : Nat; username : Text };

    let sorted : [RawEntry] = if (period == "weekly") {
      // 7 days in nanoseconds
      let weekNs : Int = 7 * 24 * 60 * 60 * 1_000_000_000;
      let cutoff : Int = Time.now() - weekNs;

      // Accumulate weekly coins per user using a mutable map (Principal -> Nat)
      let weeklyMap = Map.empty<Common.UserId, Nat>();
      transactions.forEach(func(tx) {
        if (tx.isCredit and tx.createdAt >= cutoff) {
          let prev = switch (weeklyMap.get(tx.userId)) { case (?v) v; case null 0 };
          weeklyMap.add(tx.userId, prev + tx.amount);
        };
      });

      // Convert to array with username lookup
      let rawList = List.empty<RawEntry>();
      weeklyMap.forEach(func(uid, coins) {
        let username = switch (users.get(uid)) { case (?u) u.username; case null "Unknown" };
        rawList.add({ principal = uid; coinsEarned = coins; username });
      });
      let arr = rawList.toArray();
      arr.sort(func(a : RawEntry, b : RawEntry) : Order.Order = Nat.compare(b.coinsEarned, a.coinsEarned))
    } else {
      let allTimeMap = Map.empty<Common.UserId, Nat>();
      transactions.forEach(func(tx) {
        if (tx.isCredit) {
          let prev = switch (allTimeMap.get(tx.userId)) { case (?v) v; case null 0 };
          allTimeMap.add(tx.userId, prev + tx.amount);
        };
      });

      let rawList = List.empty<RawEntry>();
      allTimeMap.forEach(func(uid, coins) {
        let username = switch (users.get(uid)) { case (?u) u.username; case null "Unknown" };
        rawList.add({ principal = uid; coinsEarned = coins; username });
      });
      let arr = rawList.toArray();
      arr.sort(func(a : RawEntry, b : RawEntry) : Order.Order = Nat.compare(b.coinsEarned, a.coinsEarned))
    };

    // Find effective user's rank in full sorted list (1-indexed)
    var callerRank : Nat = 0;
    var callerCoins : Nat = 0;
    var callerUsername : Text = "";
    switch (effectiveUser) {
      case null {};
      case (?uid) {
        var idx : Nat = 0;
        while (idx < sorted.size()) {
          let entry = sorted[idx];
          if (Principal.equal(entry.principal, uid)) {
            callerRank := idx + 1;
            callerCoins := entry.coinsEarned;
            callerUsername := entry.username;
          };
          idx += 1;
        };
      };
    };

    // Build top-N entries
    let topN = if (limit < sorted.size()) limit else sorted.size();
    let entries = Array.tabulate(topN, func(i : Nat) : LeaderboardEntry {
      let raw = sorted[i];
      {
        rank       = i + 1;
        username   = raw.username;
        coinsEarned = raw.coinsEarned;
        userId     = raw.principal.toText();
      }
    });

    {
      entries;
      userRank = { rank = callerRank; coinsEarned = callerCoins; username = callerUsername };
    }
  };
};
