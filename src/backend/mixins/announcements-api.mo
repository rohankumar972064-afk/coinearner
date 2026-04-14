import Map "mo:core/Map";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/announcements";
import UserTypes "../types/users";
import OtpTypes "../types/mobile-otp";
import OtpLib "../lib/mobile-otp";
import AnnouncementsLib "../lib/announcements";

mixin (
  accessControlState : AccessControl.AccessControlState,
  announcements : Map.Map<Nat, Types.Announcement>,
  dismissals : Set.Set<(Principal, Nat)>,
  announcementCounter : { var value : Nat },
  users : Map.Map<Common.UserId, UserTypes.UserProfile>,
  sessions : Map.Map<Text, OtpTypes.SessionRecord>,
) {
  /// Public: get active announcements for the current user (session-token aware)
  public query ({ caller }) func getActiveAnnouncements(sessionToken : ?Text) : async [Types.AnnouncementPublic] {
    let now = Time.now();
    let userId = switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { return [] };
      case (?uid) uid;
    };
    let callerProfile = users.get(userId);
    AnnouncementsLib.listActive(announcements, now, userId, callerProfile, dismissals);
  };

  /// Public: dismiss an announcement (won't show again for this user) (session-token aware)
  public shared ({ caller }) func dismissAnnouncement(id : Nat, sessionToken : ?Text) : async { #ok; #err : Text } {
    let now = Time.now();
    let userId = switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { return #err("Not authenticated") };
      case (?uid) uid;
    };
    if (not announcements.containsKey(id)) {
      return #err("Announcement not found");
    };
    dismissals.add(AnnouncementsLib.dismissalCompare, (userId, id));
    #ok;
  };

  // ── Admin ──────────────────────────────────────────────────────

  /// Admin: create a new announcement; returns the new announcement id
  public shared ({ caller }) func adminCreateAnnouncement(
    title : Text,
    message : Text,
    urgency : Types.AnnouncementUrgency,
    target : Types.AnnouncementTarget,
    scheduledAt : ?Common.Timestamp,
    expiresAt : ?Common.Timestamp,
  ) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    let now = Time.now();
    AnnouncementsLib.create(announcements, announcementCounter, title, message, urgency, target, scheduledAt, expiresAt, caller, now);
  };

  /// Admin: list all announcements (including inactive/expired)
  public query ({ caller }) func adminListAnnouncements() : async [Types.AnnouncementPublic] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    AnnouncementsLib.listAll(announcements);
  };

  /// Admin: update an existing announcement
  public shared ({ caller }) func adminUpdateAnnouncement(
    id : Nat,
    title : Text,
    message : Text,
    urgency : Types.AnnouncementUrgency,
    target : Types.AnnouncementTarget,
    scheduledAt : ?Common.Timestamp,
    expiresAt : ?Common.Timestamp,
    isActive : Bool,
  ) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    AnnouncementsLib.updateAnnouncement(announcements, id, title, message, urgency, target, scheduledAt, expiresAt, isActive);
  };

  /// Admin: delete (deactivate) an announcement
  public shared ({ caller }) func adminDeleteAnnouncement(id : Nat) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    AnnouncementsLib.deactivate(announcements, id);
  };
};
