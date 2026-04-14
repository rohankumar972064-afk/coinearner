import Common "common";

module {
  // Internal OTP state stored pending verification (keyed by mobile number)
  // NOT exposed publicly — never returned in API responses
  public type OtpRecord = {
    mobileNumber : Text;
    otpCode : Text;
    otpExpiry : Common.Timestamp; // nanoseconds from Time.now()
  };

  // Session record — maps a session token to a Principal with expiry
  public type SessionRecord = {
    principal : Common.UserId;
    expiresAt : Common.Timestamp; // 30-day TTL
  };
};
