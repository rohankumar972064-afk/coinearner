import List "mo:core/List";
import Time "mo:core/Time";
import Common "../types/common";
import Types "../types/settings";

module {
  // Default settings values
  public func defaults() : Types.AppSettings {
    {
      coinsPerAd = 10;
      dailyBaseReward = 10;
      streakMultiplier = 10;
      streakCap = 100;
      referralBonus = 500;
      minWithdrawalRupees = 50;
      maxDailyAdWatches = 10;
      maxCoinsPerUser = 0;        // 0 = unlimited
      dailyCoinsGrantCap = 0;     // 0 = unlimited
      fraudPenaltyCoins = 500;
      adsEnabled = true;
      dailyRewardsEnabled = true;
      referralsEnabled = true;
      tasksEnabled = true;
      withdrawalsEnabled = true;
      lastModified = Time.now();
      modifiedBy = null;
    };
  };

  // Update settings and record change log entries
  public func update(
    current : Types.AppSettings,
    next : Types.AppSettings,
    adminId : Common.UserId,
    now : Common.Timestamp,
    changelog : List.List<Types.SettingsChangeLog>,
  ) : Types.AppSettings {
    // Log changed numeric fields
    if (current.coinsPerAd != next.coinsPerAd) {
      changelog.add({ field = "coinsPerAd"; oldVal = current.coinsPerAd.toText(); newVal = next.coinsPerAd.toText(); timestamp = now; adminId = adminId });
    };
    if (current.dailyBaseReward != next.dailyBaseReward) {
      changelog.add({ field = "dailyBaseReward"; oldVal = current.dailyBaseReward.toText(); newVal = next.dailyBaseReward.toText(); timestamp = now; adminId = adminId });
    };
    if (current.streakMultiplier != next.streakMultiplier) {
      changelog.add({ field = "streakMultiplier"; oldVal = current.streakMultiplier.toText(); newVal = next.streakMultiplier.toText(); timestamp = now; adminId = adminId });
    };
    if (current.streakCap != next.streakCap) {
      changelog.add({ field = "streakCap"; oldVal = current.streakCap.toText(); newVal = next.streakCap.toText(); timestamp = now; adminId = adminId });
    };
    if (current.referralBonus != next.referralBonus) {
      changelog.add({ field = "referralBonus"; oldVal = current.referralBonus.toText(); newVal = next.referralBonus.toText(); timestamp = now; adminId = adminId });
    };
    if (current.minWithdrawalRupees != next.minWithdrawalRupees) {
      changelog.add({ field = "minWithdrawalRupees"; oldVal = current.minWithdrawalRupees.toText(); newVal = next.minWithdrawalRupees.toText(); timestamp = now; adminId = adminId });
    };
    if (current.maxDailyAdWatches != next.maxDailyAdWatches) {
      changelog.add({ field = "maxDailyAdWatches"; oldVal = current.maxDailyAdWatches.toText(); newVal = next.maxDailyAdWatches.toText(); timestamp = now; adminId = adminId });
    };
    if (current.maxCoinsPerUser != next.maxCoinsPerUser) {
      changelog.add({ field = "maxCoinsPerUser"; oldVal = current.maxCoinsPerUser.toText(); newVal = next.maxCoinsPerUser.toText(); timestamp = now; adminId = adminId });
    };
    if (current.dailyCoinsGrantCap != next.dailyCoinsGrantCap) {
      changelog.add({ field = "dailyCoinsGrantCap"; oldVal = current.dailyCoinsGrantCap.toText(); newVal = next.dailyCoinsGrantCap.toText(); timestamp = now; adminId = adminId });
    };
    if (current.fraudPenaltyCoins != next.fraudPenaltyCoins) {
      changelog.add({ field = "fraudPenaltyCoins"; oldVal = current.fraudPenaltyCoins.toText(); newVal = next.fraudPenaltyCoins.toText(); timestamp = now; adminId = adminId });
    };
    // Log changed bool/toggle fields
    if (current.adsEnabled != next.adsEnabled) {
      changelog.add({ field = "adsEnabled"; oldVal = debug_show(current.adsEnabled); newVal = debug_show(next.adsEnabled); timestamp = now; adminId = adminId });
    };
    if (current.dailyRewardsEnabled != next.dailyRewardsEnabled) {
      changelog.add({ field = "dailyRewardsEnabled"; oldVal = debug_show(current.dailyRewardsEnabled); newVal = debug_show(next.dailyRewardsEnabled); timestamp = now; adminId = adminId });
    };
    if (current.referralsEnabled != next.referralsEnabled) {
      changelog.add({ field = "referralsEnabled"; oldVal = debug_show(current.referralsEnabled); newVal = debug_show(next.referralsEnabled); timestamp = now; adminId = adminId });
    };
    if (current.tasksEnabled != next.tasksEnabled) {
      changelog.add({ field = "tasksEnabled"; oldVal = debug_show(current.tasksEnabled); newVal = debug_show(next.tasksEnabled); timestamp = now; adminId = adminId });
    };
    if (current.withdrawalsEnabled != next.withdrawalsEnabled) {
      changelog.add({ field = "withdrawalsEnabled"; oldVal = debug_show(current.withdrawalsEnabled); newVal = debug_show(next.withdrawalsEnabled); timestamp = now; adminId = adminId });
    };
    { next with lastModified = now; modifiedBy = ?adminId };
  };
};
