import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import InviteLinksModule "mo:caffeineai-invite-links/invite-links-module";

import UserTypes "types/users";
import RewardTypes "types/rewards";
import WithdrawalTypes "types/withdrawals";
import SettingsTypes "types/settings";
import AnnouncementTypes "types/announcements";
import FraudTypes "types/fraud";
import Common "types/common";
import SettingsLib "lib/settings";


import UsersMixin "mixins/users-api";
import RewardsMixin "mixins/rewards-api";
import WithdrawalsMixin "mixins/withdrawals-api";
import ReferralsMixin "mixins/referrals-api";
import SettingsMixin "mixins/settings-api";
import AnnouncementsMixin "mixins/announcements-api";
import FraudMixin "mixins/fraud-api";
import LeaderboardMixin "mixins/leaderboard-api";
import MobileOtpMixin "mixins/mobile-otp-api";
import OtpTypes "types/mobile-otp";



actor {
  // ── Authorization ──────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── User state ─────────────────────────────────────────────────
  let users = Map.empty<Common.UserId, UserTypes.UserProfile>();

  // ── Reward state ───────────────────────────────────────────────
  let dailyClaims     = Map.empty<Common.UserId, RewardTypes.DailyClaimRecord>();
  let adRecords       = Map.empty<Common.UserId, RewardTypes.AdWatchRecord>();
  let tasks           = List.empty<RewardTypes.Task>();
  let taskCompletions = Map.empty<RewardTypes.TaskCompletionKey, RewardTypes.TaskCompletion>();
  let transactions    = List.empty<RewardTypes.Transaction>();

  // ── Withdrawal state ───────────────────────────────────────────
  let withdrawalRequests = List.empty<WithdrawalTypes.WithdrawalRequest>();

  // ── Referral relationship tracking ────────────────────────────
  let referralRelationships = List.empty<RewardTypes.ReferralRelationship>();

  // ── Invite / referral state ───────────────────────────────────
  let inviteState = InviteLinksModule.initState();

  // ── Settings state ────────────────────────────────────────────
  let settingsVar = { var value : SettingsTypes.AppSettings = SettingsLib.defaults() };
  let settingsChangelog = List.empty<SettingsTypes.SettingsChangeLog>();

  // ── Announcements state ───────────────────────────────────────
  let announcements = Map.empty<Nat, AnnouncementTypes.Announcement>();
  let dismissals    = Set.empty<(Principal, Nat)>();
  let announcementCounter = { var value : Nat = 0 };

  // ── Fraud state ───────────────────────────────────────────────
  let fraudFlags = Map.empty<Principal, List.List<FraudTypes.FraudFlag>>();

  // ── Mobile OTP / Session auth state ───────────────────────────
  // pendingOtps: keyed by mobile number (Text) — stores OTP + expiry
  let pendingOtps = Map.empty<Text, OtpTypes.OtpRecord>();
  // sessions: keyed by session token (Text) — maps token → Principal + expiry
  let sessions = Map.empty<Text, OtpTypes.SessionRecord>();
  // mobileToUser: maps mobile number → stable Principal (permanent identity)
  let mobileToUser = Map.empty<Text, Common.UserId>();
  // pendingPrincipals: pre-allocated Principal for a mobile during OTP flow
  let pendingPrincipals = Map.empty<Text, Common.UserId>();

  // ── Mixin composition ──────────────────────────────────────────
  include UsersMixin(accessControlState, users, transactions, tasks, withdrawalRequests, fraudFlags, sessions);

  include RewardsMixin(
    accessControlState,
    users,
    dailyClaims,
    adRecords,
    tasks,
    taskCompletions,
    transactions,
    settingsVar,
    fraudFlags,
    sessions,
  );

  include WithdrawalsMixin(
    accessControlState,
    users,
    transactions,
    withdrawalRequests,
    settingsVar,
    fraudFlags,
    sessions,
  );

  include ReferralsMixin(
    accessControlState,
    users,
    transactions,
    inviteState,
    referralRelationships,
    settingsVar,
    fraudFlags,
    sessions,
  );

  include SettingsMixin(
    accessControlState,
    settingsVar,
    settingsChangelog,
  );

  include AnnouncementsMixin(
    accessControlState,
    announcements,
    dismissals,
    announcementCounter,
    users,
    sessions,
  );

  include FraudMixin(
    accessControlState,
    users,
    fraudFlags,
    settingsVar,
  );

  include LeaderboardMixin(users, transactions, sessions);

  include MobileOtpMixin(users, pendingOtps, sessions, mobileToUser, pendingPrincipals);
};
