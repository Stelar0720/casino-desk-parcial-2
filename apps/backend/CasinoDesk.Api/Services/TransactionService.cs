using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Services;

public sealed class TransactionService : ITransactionService
{
    private readonly ICasinoDeskRepository _repository;
    private readonly ICustomerIdentityHasher _hasher;
    private readonly IRiskConsolidator _riskConsolidator;
    private readonly IStructuringDetector _structuringDetector;
    private readonly IAuditLogger _auditLogger;

    public TransactionService(
        ICasinoDeskRepository repository,
        ICustomerIdentityHasher hasher,
        IRiskConsolidator riskConsolidator,
        IStructuringDetector structuringDetector,
        IAuditLogger auditLogger)
    {
        _repository = repository;
        _hasher = hasher;
        _riskConsolidator = riskConsolidator;
        _structuringDetector = structuringDetector;
        _auditLogger = auditLogger;
    }

    public async Task<TransactionResponse> RegisterAsync(
        TransactionType type,
        TransactionRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        var clientHash = _hasher.Hash(request.DocumentNumber);
        var requiresKyc = request.Amount >= 2000;
        var requiresRte = request.PaymentMethod == PaymentMethod.Efectivo && request.Amount >= 10000;
        var screening = requiresKyc
            ? await _riskConsolidator.RunAsync(request.ClientName, cancellationToken)
            : new ScreeningResult(RiskLevel.Verde, false, false, Array.Empty<string>(), null);

        var status = screening.Level switch
        {
            RiskLevel.Rojo => TransactionStatus.Bloqueada,
            _ when requiresRte => TransactionStatus.PendienteRte,
            RiskLevel.Amarillo => TransactionStatus.PendienteRevision,
            _ => TransactionStatus.Completada
        };

        var record = new TransactionRecord
        {
            Type = type,
            ClientName = request.ClientName,
            ClientHash = clientHash,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            RiskLevel = screening.Level,
            Status = status,
            RequiresKyc = requiresKyc,
            RequiresRte = requiresRte,
            ChipsPlayedRatio = request.ChipsPlayedRatio
        };

        _repository.AddTransaction(record);

        var alertRaised = false;

        if (screening.Level == RiskLevel.Rojo)
        {
            alertRaised = true;
            _repository.AddAlert(new AlertRecord
            {
                Type = AlertType.Aml,
                Title = "Transaccion bloqueada por screening",
                Description = "Coincidencia detectada en listas AML.",
                RiskLevel = RiskLevel.Rojo,
                Severity = "CRITICA",
                ClientHash = clientHash,
                Amount = request.Amount
            });
        }

        if (screening.Level == RiskLevel.Amarillo)
        {
            alertRaised = true;
            _repository.AddAlert(new AlertRecord
            {
                Type = screening.TimedOut ? AlertType.Timeout : AlertType.Pep,
                Title = screening.TimedOut ? "Timeout precautorio AML" : "PEP requiere revision",
                Description = screening.TimedOut
                    ? "Proveedor externo no respondio tras el reintento."
                    : "Evaluar proporcionalidad del monto y origen de fondos.",
                RiskLevel = RiskLevel.Amarillo,
                Severity = "ALTA",
                ClientHash = clientHash,
                Amount = request.Amount
            });
        }

        if (type == TransactionType.CashOut && request.ChipsPlayedRatio is decimal ratio && ratio < 0.2m)
        {
            alertRaised = true;
            _repository.AddAlert(new AlertRecord
            {
                Type = AlertType.Comportamiento,
                Title = "Comportamiento anomalo",
                Description = "El cliente aposto menos del 20% de las fichas.",
                RiskLevel = RiskLevel.Amarillo,
                Severity = "ALTA",
                ClientHash = clientHash,
                Amount = request.Amount
            });
        }

        var structuring = _structuringDetector.Detect(clientHash, request.Amount, _repository.Transactions);
        if (structuring is not null)
        {
            alertRaised = true;
            _repository.AddAlert(structuring);
        }

        if (requiresRte && !string.IsNullOrWhiteSpace(request.OriginOfFunds))
        {
            _repository.AddRte(new RteRecord
            {
                ClientHash = clientHash,
                TotalAmount = request.Amount,
                OriginOfFunds = request.OriginOfFunds,
                SignedByClient = true,
                ApprovedByOfficer = false,
                TransactionIds = new[] { record.Id }
            });
        }

        _auditLogger.Log(actor, $"{type} registrado", $"Estado final {status}");

        return new TransactionResponse(
            record.Id,
            clientHash,
            screening.Level,
            status,
            requiresKyc,
            requiresRte,
            alertRaised,
            status == TransactionStatus.Bloqueada
                ? "Operacion bloqueada por screening AML."
                : requiresRte
                    ? "Operacion registrada y enviada a flujo RTE."
                    : "Operacion registrada correctamente.");
    }

    public Task<ScreeningResult> ScreeningOnlyAsync(ScreeningRunRequest request, CancellationToken cancellationToken)
        => _riskConsolidator.RunAsync(request.ClientName, cancellationToken);
}
