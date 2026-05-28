using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Services;

public sealed class RteService : IRteService
{
    private readonly ICasinoDeskRepository _repository;
    private readonly IAuditLogger _auditLogger;

    public RteService(ICasinoDeskRepository repository, IAuditLogger auditLogger)
    {
        _repository = repository;
        _auditLogger = auditLogger;
    }

    public IReadOnlyCollection<RteRecord> GetAll() => _repository.Rtes;

    public RteRecord Create(RteCreateRequest request, string actor)
    {
        var rte = new RteRecord
        {
            ClientHash = request.ClientHash,
            TotalAmount = request.TotalAmount,
            OriginOfFunds = request.OriginOfFunds,
            SignedByClient = request.SignedByClient,
            ApprovedByOfficer = false,
            TransactionIds = request.TransactionIds
        };
        _repository.AddRte(rte);
        _auditLogger.Log(actor, "RTE creado", rte.Id.ToString());
        return rte;
    }

    public void Approve(Guid id, string actor)
    {
        _repository.ApproveRte(id);
        _auditLogger.Log(actor, "RTE aprobado", id.ToString());
    }
}
