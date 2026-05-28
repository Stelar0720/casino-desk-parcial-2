namespace CasinoDesk.Api.Contracts;

public sealed record AlertPatchRequest(string Status);
public sealed record RteCreateRequest(string ClientHash, decimal TotalAmount, string OriginOfFunds, bool SignedByClient, IReadOnlyCollection<Guid> TransactionIds);
public sealed record RosCreateRequest(Guid AlertId, string Narrative);
