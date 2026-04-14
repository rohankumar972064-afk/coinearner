import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Common "../types/common";
import Types "../types/withdrawals";
import SettingsTypes "../types/settings";

module {
  let COINS_PER_RUPEE : Nat = 100; // 1000 coins = ₹10, so 100 coins = ₹1

  // Submit a withdrawal request; checks minWithdrawalRupees from settings
  public func submitRequest(
    requests : List.List<Types.WithdrawalRequest>,
    userId : Common.UserId,
    method : Types.WithdrawalMethod,
    details : Text,
    rupeeAmount : Nat,
    userCoins : Common.Coins,
    paymentDetails : ?Text,
    now : Common.Timestamp,
    settings : SettingsTypes.AppSettings,
  ) : Types.WithdrawalRequest {
    if (rupeeAmount < settings.minWithdrawalRupees) {
      Runtime.trap("Minimum withdrawal is ₹" # settings.minWithdrawalRupees.toText());
    };
    let coinsNeeded = rupeeAmount * COINS_PER_RUPEE;
    if (userCoins < coinsNeeded) {
      Runtime.trap("Insufficient coins for this withdrawal");
    };
    let req : Types.WithdrawalRequest = {
      id = requests.size();
      userId = userId;
      method = method;
      details = details;
      rupeeAmount = rupeeAmount;
      coinsDeducted = coinsNeeded;
      var status = #pending;
      createdAt = now;
      var resolvedAt = null;
      var adminNote = "";
      var resolvedBy = null;
      var paymentDetails = paymentDetails;
      var paidAt = null;
    };
    requests.add(req);
    req;
  };

  // Approve a withdrawal request (admin)
  public func approveRequest(
    requests : List.List<Types.WithdrawalRequest>,
    requestId : Nat,
    adminId : Common.UserId,
    note : Text,
    now : Common.Timestamp,
  ) {
    let req = switch (requests.find(func(r : Types.WithdrawalRequest) : Bool { r.id == requestId })) {
      case (?r) r;
      case null { Runtime.trap("Withdrawal request not found") };
    };
    if (req.status != #pending) {
      Runtime.trap("Request is not pending");
    };
    req.status := #approved;
    req.resolvedAt := ?now;
    req.resolvedBy := ?adminId;
    if (note != "") { req.adminNote := "[Approved by " # adminId.toText() # "] " # note };
  };

  // Reject a withdrawal request (admin)
  public func rejectRequest(
    requests : List.List<Types.WithdrawalRequest>,
    requestId : Nat,
    adminId : Common.UserId,
    adminNote : Text,
    now : Common.Timestamp,
  ) {
    let req = switch (requests.find(func(r : Types.WithdrawalRequest) : Bool { r.id == requestId })) {
      case (?r) r;
      case null { Runtime.trap("Withdrawal request not found") };
    };
    if (req.status != #pending) {
      Runtime.trap("Request is not pending");
    };
    req.status := #rejected;
    req.resolvedAt := ?now;
    req.resolvedBy := ?adminId;
    req.adminNote := "[Rejected by " # adminId.toText() # "] " # adminNote;
  };

  // Mark a withdrawal as paid (admin) — can only mark approved requests as paid
  public func markPaid(
    requests : List.List<Types.WithdrawalRequest>,
    requestId : Nat,
    adminId : Common.UserId,
    paymentRef : Text,
    now : Common.Timestamp,
  ) {
    let req = switch (requests.find(func(r : Types.WithdrawalRequest) : Bool { r.id == requestId })) {
      case (?r) r;
      case null { Runtime.trap("Withdrawal request not found") };
    };
    if (req.status != #approved) {
      Runtime.trap("Only approved requests can be marked as paid");
    };
    req.status := #paid;
    req.paidAt := ?now;
    req.adminNote := "[Paid by " # adminId.toText() # "] Payment ref: " # paymentRef;
  };

  // Convert internal request to public
  public func toPublic(req : Types.WithdrawalRequest) : Types.WithdrawalRequestPublic {
    {
      id = req.id;
      userId = req.userId;
      method = req.method;
      details = req.details;
      rupeeAmount = req.rupeeAmount;
      coinsDeducted = req.coinsDeducted;
      status = req.status;
      createdAt = req.createdAt;
      resolvedAt = req.resolvedAt;
      adminNote = req.adminNote;
      resolvedBy = req.resolvedBy;
      paymentDetails = req.paymentDetails;
      paidAt = req.paidAt;
    };
  };

  // Get all requests as public
  public func getAllPublic(
    requests : List.List<Types.WithdrawalRequest>
  ) : [Types.WithdrawalRequestPublic] {
    requests.values().map(func(r : Types.WithdrawalRequest) : Types.WithdrawalRequestPublic { toPublic(r) }).toArray();
  };

  // Get requests by user
  public func getUserRequestsPublic(
    requests : List.List<Types.WithdrawalRequest>,
    userId : Common.UserId,
  ) : [Types.WithdrawalRequestPublic] {
    requests.values()
      .filter(func(r : Types.WithdrawalRequest) : Bool { Principal.equal(r.userId, userId) })
      .map(func(r : Types.WithdrawalRequest) : Types.WithdrawalRequestPublic { toPublic(r) })
      .toArray();
  };

  // Compute admin stats
  public func computeStats(
    requests : List.List<Types.WithdrawalRequest>,
    totalUsers : Nat,
    totalCoins : Common.Coins,
  ) : Types.AdminStats {
    var pending = 0;
    var approvedRupees = 0;
    requests.forEach(func(r : Types.WithdrawalRequest) {
      switch (r.status) {
        case (#pending) { pending += 1 };
        case (#approved) { approvedRupees += r.rupeeAmount };
        case (#paid) { approvedRupees += r.rupeeAmount };
        case (#rejected) {};
      };
    });
    {
      totalUsers = totalUsers;
      totalCoinsInCirculation = totalCoins;
      pendingWithdrawalsCount = pending;
      totalApprovedWithdrawalsRupees = approvedRupees;
    };
  };
};
