namespace CasinoDesk.Api.Domain;

public sealed record User(Guid Id, string Username, string FullName, Role Role, string Station);

public sealed record ScreeningResult(
    RiskLevel Level,
    bool RequiresReview,
    bool TimedOut,
    IReadOnlyCollection<string> AmlMatches,
    string? PepMatch
);

public sealed class TransactionRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public TransactionType Type { get; init; }
    public string ClientName { get; init; } = string.Empty;
    public string ClientHash { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public PaymentMethod PaymentMethod { get; init; }
    public RiskLevel RiskLevel { get; init; }
    public TransactionStatus Status { get; set; }
    public bool RequiresKyc { get; init; }
    public bool RequiresRte { get; init; }
    public decimal? ChipsPlayedRatio { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class AlertRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public AlertType Type { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public RiskLevel RiskLevel { get; init; }
    public string Severity { get; init; } = "ALTA";
    public string ClientHash { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string Status { get; set; } = "ABIERTA";
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class RteRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string ClientHash { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public string OriginOfFunds { get; init; } = string.Empty;
    public bool SignedByClient { get; init; }
    public bool ApprovedByOfficer { get; set; }
    public IReadOnlyCollection<Guid> TransactionIds { get; init; } = Array.Empty<Guid>();
}

public sealed class RosRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AlertId { get; init; }
    public string Narrative { get; init; } = string.Empty;
    public string SignedBy { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class AuditEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Actor { get; init; } = string.Empty;
    public string Event { get; init; } = string.Empty;
    public string Result { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
