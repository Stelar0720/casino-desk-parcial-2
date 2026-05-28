using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Services;

public interface IAuthService
{
    AuthResponse Login(LoginRequest request);
}

public interface IAuditLogger
{
    void Log(string actor, string @event, string result);
}

public interface ICustomerIdentityHasher
{
    string Hash(string documentNumber);
}

public interface IScreeningProvider
{
    Task<IReadOnlyCollection<string>> CheckAsync(string normalizedClientName, CancellationToken cancellationToken);
}

public interface IPepProvider
{
    Task<string?> CheckAsync(string normalizedClientName, CancellationToken cancellationToken);
}

public interface IRiskConsolidator
{
    Task<ScreeningResult> RunAsync(string clientName, CancellationToken cancellationToken);
}

public interface IStructuringDetector
{
    AlertRecord? Detect(string clientHash, decimal currentAmount, IReadOnlyCollection<TransactionRecord> transactions);
}

public interface ICasinoDeskRepository
{
    IReadOnlyCollection<TransactionRecord> Transactions { get; }
    IReadOnlyCollection<AlertRecord> Alerts { get; }
    IReadOnlyCollection<RteRecord> Rtes { get; }
    IReadOnlyCollection<RosRecord> Ros { get; }
    IReadOnlyCollection<AuditEntry> AuditTrail { get; }
    IReadOnlyCollection<User> Users { get; }
    void AddTransaction(TransactionRecord record);
    void AddAlert(AlertRecord alert);
    void AddAudit(AuditEntry auditEntry);
    void AddRte(RteRecord rte);
    void ApproveRte(Guid id);
    void UpdateAlert(Guid id, string status);
    void AddRos(RosRecord ros);
}

public interface ITransactionService
{
    Task<TransactionResponse> RegisterAsync(TransactionType type, TransactionRequest request, string actor, CancellationToken cancellationToken);
    Task<ScreeningResult> ScreeningOnlyAsync(ScreeningRunRequest request, CancellationToken cancellationToken);
}

public interface IRteService
{
    IReadOnlyCollection<RteRecord> GetAll();
    RteRecord Create(RteCreateRequest request, string actor);
    void Approve(Guid id, string actor);
}

public interface IRosService
{
    IReadOnlyCollection<RosRecord> GetAll();
    RosRecord Create(RosCreateRequest request, string actor);
}
