import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Common "../types/common";
import Types "../types/announcements";
import UserTypes "../types/users";

module {
  // Convert internal announcement to public (strips var fields)
  public func toPublic(a : Types.Announcement) : Types.AnnouncementPublic {
    {
      id = a.id;
      title = a.title;
      message = a.message;
      urgency = a.urgency;
      target = a.target;
      scheduledAt = a.scheduledAt;
      expiresAt = a.expiresAt;
      createdAt = a.createdAt;
      createdBy = a.createdBy;
      isActive = a.isActive;
    };
  };

  // Create a new announcement and return its id
  public func create(
    announcements : Map.Map<Nat, Types.Announcement>,
    counter : { var value : Nat },
    title : Text,
    message : Text,
    urgency : Types.AnnouncementUrgency,
    target : Types.AnnouncementTarget,
    scheduledAt : ?Common.Timestamp,
    expiresAt : ?Common.Timestamp,
    createdBy : Common.UserId,
    now : Common.Timestamp,
  ) : Nat {
    let id = counter.value;
    counter.value += 1;
    let ann : Types.Announcement = {
      id = id;
      title = title;
      message = message;
      urgency = urgency;
      target = target;
      scheduledAt = scheduledAt;
      expiresAt = expiresAt;
      createdAt = now;
      createdBy = createdBy;
      var isActive = true;
    };
    announcements.add(id, ann);
    id;
  };

  // Get all announcements as public list
  public func listAll(
    announcements : Map.Map<Nat, Types.Announcement>
  ) : [Types.AnnouncementPublic] {
    announcements.values().map(func(a : Types.Announcement) : Types.AnnouncementPublic { toPublic(a) }).toArray();
  };

  // Determine if a user (given profile) matches the target audience
  func matchesTarget(
    target : Types.AnnouncementTarget,
    callerProfile : ?UserTypes.UserProfile,
    now : Common.Timestamp,
  ) : Bool {
    let sevenDaysNs : Common.Timestamp = 604_800_000_000_000;
    switch (target) {
      case (#all) true;
      case (#adminsOnly) false; // not shown to regular users
      case (#newUsers) {
        switch (callerProfile) {
          case (?p) (now - p.createdAt) < sevenDaysNs;
          case null false;
        };
      };
      case (#inactiveUsers) {
        switch (callerProfile) {
          case (?p) (now - p.lastLoginDate) >= sevenDaysNs;
          case null false;
        };
      };
    };
  };

  // Get active announcements visible to the calling user
  public func listActive(
    announcements : Map.Map<Nat, Types.Announcement>,
    now : Common.Timestamp,
    callerId : Common.UserId,
    callerProfile : ?UserTypes.UserProfile,
    dismissals : Set.Set<(Principal, Nat)>,
  ) : [Types.AnnouncementPublic] {
    announcements.values()
      .filter(func(a : Types.Announcement) : Bool {
        if (not a.isActive) return false;
        if (not matchesTarget(a.target, callerProfile, now)) return false;
        // Check scheduled: must be in the past (null = immediate)
        switch (a.scheduledAt) {
          case (?t) { if (t > now) return false };
          case null {};
        };
        // Check expiry
        switch (a.expiresAt) {
          case (?t) { if (t < now) return false };
          case null {};
        };
        // Check not dismissed
        not dismissals.contains(dismissalCompare, (callerId, a.id));
      })
      .map(func(a : Types.Announcement) : Types.AnnouncementPublic { toPublic(a) })
      .toArray();
  };

  // Compare function for dismissal tuples
  public func dismissalCompare(a : (Principal, Nat), b : (Principal, Nat)) : { #less; #equal; #greater } {
    let pc = Principal.compare(a.0, b.0);
    switch (pc) {
      case (#equal) { Nat.compare(a.1, b.1) };
      case other { other };
    };
  };

  // Deactivate (delete) an announcement
  public func deactivate(
    announcements : Map.Map<Nat, Types.Announcement>,
    id : Nat,
  ) : { #ok; #err : Text } {
    switch (announcements.get(id)) {
      case (?ann) {
        ann.isActive := false;
        #ok;
      };
      case null { #err("Announcement not found") };
    };
  };

  // Update announcement fields
  public func updateAnnouncement(
    announcements : Map.Map<Nat, Types.Announcement>,
    id : Nat,
    title : Text,
    message : Text,
    urgency : Types.AnnouncementUrgency,
    target : Types.AnnouncementTarget,
    scheduledAt : ?Common.Timestamp,
    expiresAt : ?Common.Timestamp,
    isActive : Bool,
  ) : { #ok; #err : Text } {
    switch (announcements.get(id)) {
      case (?ann) {
        let updated : Types.Announcement = {
          id = ann.id;
          title = title;
          message = message;
          urgency = urgency;
          target = target;
          scheduledAt = scheduledAt;
          expiresAt = expiresAt;
          createdAt = ann.createdAt;
          createdBy = ann.createdBy;
          var isActive = isActive;
        };
        announcements.add(id, updated);
        #ok;
      };
      case null { #err("Announcement not found") };
    };
  };
};
