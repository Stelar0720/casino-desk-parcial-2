using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Contracts;

public sealed record TransactionRequest(
    string ClientName,
    string DocumentNumber,
    decimal Amount,
    PaymentMethod PaymentMethod,
    string? OriginOfFunds,
    string? Justification,
    decimal? ChipsPlayedRatio
);

public sealed record TransactionResponse(
    Guid TransactionId,
    string ClientHash,
    RiskLevel RiskLevel,
    TransactionStatus Status,
    bool RequiresKyc,
    bool RequiresRte,
    bool AlertRaised,
    string Message
);

public sealed record ScreeningRunRequest(string ClientName, string DocumentNumber, decimal Amount);
