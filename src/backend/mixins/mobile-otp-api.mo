import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Common "../types/common";
import UserTypes "../types/users";
import OtpTypes "../types/mobile-otp";
import OtpLib "../lib/mobile-otp";
import UserLib "../lib/users";
import Text "mo:core/Text";

mixin (
  users : Map.Map<Common.UserId, UserTypes.UserProfile>,
  pendingOtps : Map.Map<Text, OtpTypes.OtpRecord>,
  sessions : Map.Map<Text, OtpTypes.SessionRecord>,
  mobileToUser : Map.Map<Text, Common.UserId>,
  pendingPrincipals : Map.Map<Text, Common.UserId>,
) {
  type HttpHeader = { name : Text; value : Text };
  type HttpResponse = { status : Nat; headers : [HttpHeader]; body : Blob };
  type HttpRequest = {
    url : Text;
    max_response_bytes : ?Nat64;
    method : { #get; #head; #post };
    headers : [HttpHeader];
    body : ?Blob;
    transform : ?{
      function : shared query ({ response : HttpResponse; context : Blob }) -> async HttpResponse;
      context : Blob;
    };
    is_replicated : ?Bool;
  };

  // IC management canister — used for HTTP outcalls and randomness
  let ic = actor "aaaaa-aa" : actor {
    http_request : (HttpRequest) -> async HttpResponse;
    raw_rand : () -> async Blob;
  };

  let FAST2SMS_API_KEY = "bSMAG3jkT2I6ZU7pPcBVEF0OK1XHqwyY8oWexaldDzshvi9uLCrvOpUPqKQxdu2HZN063JL5M9hzsawF";

  // Generate a stable referral code for a principal (last 8 chars of text form)
  func makeOtpReferralCode(p : Principal) : Text {
    let t = p.toText();
    let sz = t.size();
    if (sz <= 8) { t } else {
      let start = sz - 8 : Nat;
      var buf = "";
      var i = 0;
      for (c in t.toIter()) {
        if (i >= start) { buf #= Text.fromChar(c) };
        i += 1;
      };
      buf;
    };
  };

  /// Request an OTP for a mobile number. Works for anonymous callers (no Internet Identity needed).
  /// Generates OTP, pre-allocates a Principal for this mobile (if new), sends SMS via Fast2SMS.
  public shared func requestMobileOTP(mobileNumber : Text) : async { #ok : Text; #err : Text } {
    if (not OtpLib.isValidIndianMobile(mobileNumber)) {
      return #err("Invalid mobile number. Please enter a 10-digit Indian mobile number.");
    };

    // Generate OTP from IC randomness
    let randBytes1 = await ic.raw_rand();
    let otpCode = OtpLib.otpFromRandBytes(randBytes1);
    let now = Time.now();

    // Pre-allocate Principal for new mobile numbers.
    // Uses the mobile number UTF-8 encoding as a deterministic principal
    // (10-digit mobile = 10 UTF-8 bytes, well within 29-byte IC principal limit).
    if (not mobileToUser.containsKey(mobileNumber) and not pendingPrincipals.containsKey(mobileNumber)) {
      let newPrincipal = mobileNumber.encodeUtf8().fromBlob();
      pendingPrincipals.add(mobileNumber, newPrincipal);
    };

    // Store pending OTP (keyed by mobile number)
    OtpLib.storePendingOtp(pendingOtps, mobileNumber, otpCode, now);

    // Build Fast2SMS POST body
    let bodyText = "route=otp&variables_values=" # otpCode # "&numbers=" # mobileNumber # "&flash=0";
    let bodyBlob = bodyText.encodeUtf8();

    // Send SMS via Fast2SMS HTTP outcall
    try {
      let response = await ic.http_request({
        url = "https://www.fast2sms.com/dev/bulkV2";
        max_response_bytes = ?(2000 : Nat64);
        method = #post;
        headers = [
          { name = "authorization"; value = FAST2SMS_API_KEY },
          { name = "Content-Type"; value = "application/x-www-form-urlencoded" },
        ];
        body = ?bodyBlob;
        transform = null;
        is_replicated = ?false;
      });

      if (response.status == 200) {
        #ok("OTP sent successfully to " # mobileNumber)
      } else {
        pendingOtps.remove(mobileNumber);
        #err("Failed to send OTP. SMS service returned status: " # response.status.toText())
      };
    } catch (_) {
      pendingOtps.remove(mobileNumber);
      #err("Failed to send OTP. Please try again.");
    };
  };

  /// PRIMARY LOGIN: Verify OTP and get a session token.
  /// This is the main authentication entry point — replaces Internet Identity.
  /// Returns a session token (store in localStorage) + whether user is new.
  public shared func loginWithMobileOTP(
    mobileNumber : Text,
    otpCode : Text,
  ) : async { #ok : { sessionToken : Text; isNewUser : Bool }; #err : Text } {
    if (not OtpLib.isValidIndianMobile(mobileNumber)) {
      return #err("Invalid mobile number.");
    };
    let now = Time.now();

    // Verify OTP
    switch (OtpLib.verifyOtp(pendingOtps, mobileNumber, otpCode, now)) {
      case (#err(msg)) { #err(msg) };
      case (#ok) {
        // Get or create stable Principal for this mobile
        let (principal, isNewUser) = OtpLib.getOrCreatePrincipal(
          mobileToUser,
          pendingPrincipals,
          mobileNumber,
        );

        // Auto-register new users
        if (isNewUser) {
          if (not users.containsKey(principal)) {
            let code = makeOtpReferralCode(principal);
            // Username: "User" + last 4 digits of mobile
            let mLen = mobileNumber.size();
            let suffix = if (mLen >= 4) {
              var s = "";
              var i = 0;
              for (c in mobileNumber.toIter()) {
                if (i >= mLen - 4) { s #= Text.fromChar(c) };
                i += 1;
              };
              s;
            } else { mobileNumber };
            let _ = UserLib.register(users, principal, "User" # suffix, code, now);
            // Mark mobile as verified on new profile
            OtpLib.setMobileVerified(users, principal, mobileNumber);
          };
        } else {
          // Update mobile verified status for existing user (in case it changed)
          OtpLib.setMobileVerified(users, principal, mobileNumber);
        };

        // Generate session token
        let tokenBytes = await ic.raw_rand();
        let sessionToken = OtpLib.sessionTokenFromBytes(tokenBytes);
        OtpLib.createSession(sessions, sessionToken, principal, now);

        #ok({ sessionToken; isNewUser });
      };
    };
  };

  /// Resolve a session token to the associated Principal.
  /// Used by the frontend to validate active sessions and by other endpoints internally.
  public query func getSessionPrincipal(token : Text) : async ?Common.UserId {
    let now = Time.now();
    OtpLib.resolveSession(sessions, token, now);
  };

  /// Get the mobile number and verification status for the user identified by sessionToken.
  /// Falls back to caller principal for backward compatibility with Internet Identity.
  public query ({ caller }) func getMyMobileStatus(sessionToken : ?Text) : async { mobileNumber : ?Text; mobileVerified : Bool } {
    let now = Time.now();
    let userId = switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { return { mobileNumber = null; mobileVerified = false } };
      case (?uid) uid;
    };
    switch (users.get(userId)) {
      case null { { mobileNumber = null; mobileVerified = false } };
      case (?profile) {
        { mobileNumber = profile.mobileNumber; mobileVerified = profile.mobileVerified }
      };
    };
  };

  /// Legacy verifyMobileOTP — kept for backward compatibility.
  /// For new auth flow, use loginWithMobileOTP instead.
  public shared ({ caller }) func verifyMobileOTP(
    mobileNumber : Text,
    otpCode : Text,
    sessionToken : ?Text,
  ) : async { #ok : Text; #err : Text } {
    let now = Time.now();
    // Resolve actual user
    let userId = switch (OtpLib.effectiveCaller(sessions, caller, sessionToken, now)) {
      case null { return #err("Not authenticated. Please use loginWithMobileOTP.") };
      case (?uid) uid;
    };
    switch (OtpLib.verifyOtp(pendingOtps, mobileNumber, otpCode, now)) {
      case (#err(msg)) { #err(msg) };
      case (#ok) {
        OtpLib.setMobileVerified(users, userId, mobileNumber);
        #ok("Mobile number verified successfully!");
      };
    };
  };
};
