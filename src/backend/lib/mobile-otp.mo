import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Common "../types/common";
import UserTypes "../types/users";
import OtpTypes "../types/mobile-otp";

module {
  // OTP validity window: 5 minutes in nanoseconds (300_000_000_000)
  let OTP_TTL_NS : Common.Timestamp = 300_000_000_000;

  // Session validity: 30 days in nanoseconds
  let SESSION_TTL_NS : Common.Timestamp = 2_592_000_000_000_000;

  // Store a pending OTP keyed by mobile number (overwrites any existing pending OTP)
  public func storePendingOtp(
    pendingOtps : Map.Map<Text, OtpTypes.OtpRecord>,
    mobileNumber : Text,
    otpCode : Text,
    now : Common.Timestamp,
  ) {
    let record : OtpTypes.OtpRecord = {
      mobileNumber;
      otpCode;
      otpExpiry = now + OTP_TTL_NS;
    };
    pendingOtps.add(mobileNumber, record);
  };

  // Verify a submitted OTP code against the stored record.
  // Returns #ok on success, #err with reason on failure.
  // On success, clears the pending OTP.
  public func verifyOtp(
    pendingOtps : Map.Map<Text, OtpTypes.OtpRecord>,
    mobileNumber : Text,
    otpCode : Text,
    now : Common.Timestamp,
  ) : { #ok; #err : Text } {
    switch (pendingOtps.get(mobileNumber)) {
      case null { #err("No pending OTP. Please request a new OTP.") };
      case (?record) {
        if (now > record.otpExpiry) {
          pendingOtps.remove(mobileNumber);
          return #err("OTP has expired. Please request a new one.");
        };
        if (record.otpCode != otpCode) {
          return #err("Invalid OTP code.");
        };
        // Success — clear pending OTP
        pendingOtps.remove(mobileNumber);
        #ok;
      };
    };
  };

  // Look up or create a stable Principal for a mobile number.
  // Returns the principal and whether it was newly created.
  // Normal flow: principal was pre-allocated in requestMobileOTP via pendingPrincipals.
  // Fallback: derives Principal from mobile number's UTF-8 encoding (deterministic).
  public func getOrCreatePrincipal(
    mobileToUser : Map.Map<Text, Common.UserId>,
    pendingPrincipals : Map.Map<Text, Common.UserId>,
    mobileNumber : Text,
  ) : (Common.UserId, Bool) {
    switch (mobileToUser.get(mobileNumber)) {
      case (?existing) { (existing, false) };
      case null {
        switch (pendingPrincipals.get(mobileNumber)) {
          case (?p) {
            mobileToUser.add(mobileNumber, p);
            pendingPrincipals.remove(mobileNumber);
            (p, true);
          };
          case null {
            // Fallback: 10-digit mobile = 10 UTF-8 bytes, well within 29-byte IC principal limit
            let p = mobileNumber.encodeUtf8().fromBlob();
            mobileToUser.add(mobileNumber, p);
            (p, true);
          };
        };
      };
    };
  };

  // Create a session token from random bytes (hex string, 32 chars)
  public func sessionTokenFromBytes(randBytes : Blob) : Text {
    let bytes = randBytes.toArray();
    var token = "";
    var i = 0;
    while (i < bytes.size() and i < 16) {
      let b = bytes[i].toNat();
      let hi = b / 16;
      let lo = b % 16;
      token #= nibbleToHex(hi) # nibbleToHex(lo);
      i += 1;
    };
    token;
  };

  // Create a session and store it
  public func createSession(
    sessions : Map.Map<Text, OtpTypes.SessionRecord>,
    token : Text,
    principal : Common.UserId,
    now : Common.Timestamp,
  ) {
    // Expire old sessions for this principal first (best-effort cleanup of 1)
    sessions.add(token, { principal; expiresAt = now + SESSION_TTL_NS });
  };

  // Resolve a Principal from a session token. Returns null if expired or not found.
  public func resolveSession(
    sessions : Map.Map<Text, OtpTypes.SessionRecord>,
    token : Text,
    now : Common.Timestamp,
  ) : ?Common.UserId {
    switch (sessions.get(token)) {
      case null null;
      case (?s) {
        if (now > s.expiresAt) {
          sessions.remove(token);
          null;
        } else {
          ?s.principal;
        };
      };
    };
  };

  // Resolve effective caller: if caller is non-anonymous, use directly;
  // otherwise resolve from sessionToken.
  public func effectiveCaller(
    sessions : Map.Map<Text, OtpTypes.SessionRecord>,
    caller : Common.UserId,
    sessionToken : ?Text,
    now : Common.Timestamp,
  ) : ?Common.UserId {
    if (not caller.isAnonymous()) {
      ?caller;
    } else {
      switch (sessionToken) {
        case null null;
        case (?tok) resolveSession(sessions, tok, now);
      };
    };
  };

  // Update a user's mobileNumber and mobileVerified fields in place.
  public func setMobileVerified(
    users : Map.Map<Common.UserId, UserTypes.UserProfile>,
    userId : Common.UserId,
    mobileNumber : Text,
  ) {
    switch (users.get(userId)) {
      case null {};
      case (?profile) {
        let updated : UserTypes.UserProfile = {
          principal = profile.principal;
          username = profile.username;
          createdAt = profile.createdAt;
          var coinBalance = profile.coinBalance;
          isBlocked = profile.isBlocked;
          var lastLoginDate = profile.lastLoginDate;
          var currentStreak = profile.currentStreak;
          referralCode = profile.referralCode;
          var referredBy = profile.referredBy;
          blockHistory = profile.blockHistory;
          mobileNumber = ?mobileNumber;
          mobileVerified = true;
        };
        users.add(userId, updated);
      };
    };
  };

  // Generate a 6-digit numeric OTP string from a raw_rand blob.
  public func otpFromRandBytes(randBytes : Blob) : Text {
    let bytes = randBytes.toArray();
    let b0 : Nat = if (bytes.size() > 0) bytes[0].toNat() else 0;
    let b1 : Nat = if (bytes.size() > 1) bytes[1].toNat() else 0;
    let b2 : Nat = if (bytes.size() > 2) bytes[2].toNat() else 0;
    let b3 : Nat = if (bytes.size() > 3) bytes[3].toNat() else 0;
    let combined = (b0 * 16_777_216) + (b1 * 65_536) + (b2 * 256) + b3;
    let sixDigit = combined % 1_000_000;
    let raw = sixDigit.toText();
    let padLen = if (raw.size() < 6) 6 - raw.size() else 0;
    var pad = "";
    var i = 0;
    while (i < padLen) { pad #= "0"; i += 1 };
    pad # raw;
  };

  // Validate that mobileNumber is a 10-digit Indian mobile number (digits only, length 10)
  public func isValidIndianMobile(mobileNumber : Text) : Bool {
    if (mobileNumber.size() != 10) { return false };
    for (c in mobileNumber.toIter()) {
      if (c < '0' or c > '9') { return false };
    };
    true;
  };

  // ── Private helpers ──────────────────────────────────────────────

  func nibbleToHex(n : Nat) : Text {
    if (n < 10) n.toText()
    else if (n == 10) "a"
    else if (n == 11) "b"
    else if (n == 12) "c"
    else if (n == 13) "d"
    else if (n == 14) "e"
    else "f";
  };
};
