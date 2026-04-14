import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import Types "../types/settings";
import SettingsLib "../lib/settings";

mixin (
  accessControlState : AccessControl.AccessControlState,
  settingsVar : { var value : Types.AppSettings },
  settingsChangelog : List.List<Types.SettingsChangeLog>,
) {
  /// Public: read current app settings (feature flags + reward values)
  public query func getSettings() : async Types.AppSettings {
    settingsVar.value;
  };

  // ── Admin ──────────────────────────────────────────────────────

  /// Admin: get current settings
  public query ({ caller }) func adminGetSettings() : async Types.AppSettings {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    settingsVar.value;
  };

  /// Admin: update all settings at once; records changelog entries
  public shared ({ caller }) func adminUpdateSettings(next : Types.AppSettings) : async { #ok; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    let now = Time.now();
    settingsVar.value := SettingsLib.update(settingsVar.value, next, caller, now, settingsChangelog);
    #ok;
  };

  /// Admin: get settings change log
  public query ({ caller }) func adminGetSettingsChangeLog() : async [Types.SettingsChangeLog] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    settingsChangelog.toArray();
  };
};
