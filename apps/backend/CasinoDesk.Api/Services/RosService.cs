using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Services;

public sealed class RosService : IRosService
{
    private readonly ICasinoDeskRepository _repository;
    private readonly IAuditLogger _auditLogger;

    public RosService(ICasinoDeskRepository repository, IAuditLogger auditLogger)
    {
        _repository = repository;
        _auditLogger = auditLogger;
    }

    public IReadOnlyCollection<RosRecord> GetAll() => _repository.Ros;

    public RosRecord Create(RosCreateRequest request, string actor)
    {
        var ros = new RosRecord
        {
            AlertId = request.AlertId,
            Narrative = request.Narrative,
            SignedBy = actor
        };
        _repository.AddRos(ros);
        _auditLogger.Log(actor, "ROS creado", ros.Id.ToString());
        return ros;
    }
}
