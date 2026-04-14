module {
  public type UserId = Principal;
  public type Timestamp = Int; // nanoseconds from Time.now()
  public type Coins = Nat;
  public type Rupees = Nat; // paise or whole rupees? We use Nat rupees (min 50)
};
