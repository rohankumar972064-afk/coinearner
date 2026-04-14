import Common "common";

module {
  // Urgency level of an announcement
  public type AnnouncementUrgency = {
    #info;
    #warning;
    #urgent;
  };

  // Target audience for an announcement
  public type AnnouncementTarget = {
    #all;
    #adminsOnly;
    #newUsers;       // users registered in last 7 days
    #inactiveUsers;  // users who haven't logged in for 7+ days
  };

  // An announcement record (internal — isActive is mutable)
  public type Announcement = {
    id : Nat;
    title : Text;
    message : Text;
    urgency : AnnouncementUrgency;
    target : AnnouncementTarget;
    scheduledAt : ?Common.Timestamp; // null = send immediately
    expiresAt : ?Common.Timestamp;   // null = never expires
    createdAt : Common.Timestamp;
    createdBy : Common.UserId;
    var isActive : Bool;
  };

  // Shared/public version for API boundary
  public type AnnouncementPublic = {
    id : Nat;
    title : Text;
    message : Text;
    urgency : AnnouncementUrgency;
    target : AnnouncementTarget;
    scheduledAt : ?Common.Timestamp;
    expiresAt : ?Common.Timestamp;
    createdAt : Common.Timestamp;
    createdBy : Common.UserId;
    isActive : Bool;
  };
};
