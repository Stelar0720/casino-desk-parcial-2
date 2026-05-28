using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Services;

public sealed class InMemoryCasinoDeskRepository : ICasinoDeskRepository
{
    private readonly List<TransactionRecord> _transactions = new();
    private readonly List<AlertRecord> _alerts = new();
    private readonly List<RteRecord> _rtes = new();
    private readonly List<RosRecord> _ros = new();
    private readonly List<AuditEntry> _audit = new();
    private readonly List<User> _users = new()
    {
        new(Guid.NewGuid(), "cajero", "Yarisbel Ramos", Role.Cajero, "CAJA-01"),
        new(Guid.NewGuid(), "dealer", "Melissa Torres", Role.Dealer, "MESA-04"),
        new(Guid.NewGuid(), "oficial", "Norberto Solis", Role.Oficial, "COMPLIANCE"),
        new(Guid.NewGuid(), "supervisor", "Adrian Gomez", Role.Supervisor, "MESA-02"),
        new(Guid.NewGuid(), "admin", "Admin CasinoDesk", Role.Administrador, "HQ")
    };

    public InMemoryCasinoDeskRepository()
    {
        _alerts.Add(new AlertRecord
        {
            Type = AlertType.Fraccionamiento,
            Title = "Patron de structuring",
            Description = "4 transacciones menores a 2,000 en 24h.",
            RiskLevel = RiskLevel.Amarillo,
            Severity = "CRITICA",
            ClientHash = "B88E2741",
            Amount = 7400
        });

        _rtes.Add(new RteRecord
        {
            ClientHash = "7D4E91BA",
            TotalAmount = 11000,
            OriginOfFunds = "Actividad comercial registrada.",
            SignedByClient = true,
            ApprovedByOfficer = false,
            TransactionIds = Array.Empty<Guid>()
        });
    }

    public IReadOnlyCollection<TransactionRecord> Transactions => _transactions;
    public IReadOnlyCollection<AlertRecord> Alerts => _alerts;
    public IReadOnlyCollection<RteRecord> Rtes => _rtes;
    public IReadOnlyCollection<RosRecord> Ros => _ros;
    public IReadOnlyCollection<AuditEntry> AuditTrail => _audit;
    public IReadOnlyCollection<User> Users => _users;

    public void AddTransaction(TransactionRecord record) => _transactions.Insert(0, record);
    public void AddAlert(AlertRecord alert) => _alerts.Insert(0, alert);
    public void AddAudit(AuditEntry auditEntry) => _audit.Insert(0, auditEntry);
    public void AddRte(RteRecord rte) => _rtes.Insert(0, rte);
    public void AddRos(RosRecord ros) => _ros.Insert(0, ros);
    public void UpdateAlert(Guid id, string status)
    {
        var alert = _alerts.FirstOrDefault(item => item.Id == id);
        if (alert is not null)
        {
            alert.Status = status;
        }
    }

    public void ApproveRte(Guid id)
    {
        var rte = _rtes.FirstOrDefault(item => item.Id == id);
        if (rte is not null)
        {
            rte.ApprovedByOfficer = true;
        }
    }
}
