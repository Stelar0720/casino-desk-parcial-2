import { Activity, FileWarning, ScrollText, ShieldAlert } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buildClientCaseSummaries, useAppStore } from "../../app/store";
import { RiskBadge } from "../../components/RiskBadge";

export function OfficialDashboardPage() {
  const alerts = useAppStore((state) => state.alerts);
  const rtes = useAppStore((state) => state.rtes);
  const ros = useAppStore((state) => state.ros);
  const transactions = useAppStore((state) => state.transactions);
  const approveRte = useAppStore((state) => state.approveRte);
  const clientCases = buildClientCaseSummaries(transactions, alerts).sort((a, b) => b.riskScore - a.riskScore);

  const activityData = [
    { hour: "12:00", alerts: 1, transactions: 3 },
    { hour: "13:00", alerts: 3, transactions: 5 },
    { hour: "14:00", alerts: 2, transactions: 6 },
    { hour: "15:00", alerts: alerts.filter((item) => item.status !== "CERRADA").length, transactions: transactions.length }
  ];

  return (
    <div className="section-stack">
      <section className="role-hero role-hero--official">
        <div>
          <span className="eyebrow">Panel privado del oficial</span>
          <h1>Alertas, PEP, RTE y ROS fuera de la vista del cliente</h1>
          <p>
            Esta consola concentra aprobaciones, cierres justificados, narrativa ROS y los casos que el sistema AML o la sala te
            escalan.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card panel">
          <div className="stat-header">
            <span>Alertas abiertas</span>
            <ShieldAlert size={18} />
          </div>
          <div className="stat-value">{alerts.filter((item) => item.status !== "CERRADA").length}</div>
          <p className="muted">Priorizadas por AML rojo, PEP, timeout y fraccionamiento.</p>
        </article>

        <article className="stat-card panel">
          <div className="stat-header">
            <span>RTE pendientes</span>
            <FileWarning size={18} />
          </div>
          <div className="stat-value">{rtes.filter((item) => !item.approvedByOfficer).length}</div>
          <p className="muted">Ningun RTE debe transmitirse sin esta aprobación.</p>
        </article>

        <article className="stat-card panel">
          <div className="stat-header">
            <span>ROS generados</span>
            <ScrollText size={18} />
          </div>
          <div className="stat-value">{ros.length}</div>
          <p className="muted">Reporte confidencial con narrativa documentada e invisible al cliente.</p>
        </article>

        <article className="stat-card panel">
          <div className="stat-header">
            <span>Salud de integraciones</span>
            <Activity size={18} />
          </div>
          <div className="stat-value">OK</div>
          <p className="muted">Consultas AML/PEP, reintento y semaforo precautorio activos.</p>
        </article>
      </section>

      <section className="two-column">
        <article className="panel table-card">
          <div className="section-heading">
            <h2>Actividad de riesgo</h2>
            <p>Ventanas de carga, alertas y casos que ameritan revisión inmediata.</p>
          </div>
          <div style={{ width: "100%", height: 280, marginTop: 18 }}>
            <ResponsiveContainer>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="alertGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.12)" />
                <XAxis dataKey="hour" stroke="#a89b77" />
                <YAxis stroke="#a89b77" />
                <Tooltip />
                <Area type="monotone" dataKey="alerts" stroke="#d4af37" fill="url(#alertGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel table-card">
          <div className="section-heading">
            <h2>Bandeja RTE</h2>
            <p>Validación previa al envío regulatorio.</p>
          </div>

          <div className="list" style={{ marginTop: 18 }}>
            {rtes.map((item) => (
              <div className="list-item" key={item.id}>
                <div className="toolbar">
                  <strong>{item.folio ?? item.id}</strong>
                  <span className="mono">${item.totalAmount.toLocaleString("en-US")}</span>
                </div>
                <p className="muted mono">{item.clientHash}</p>
                <p>{item.originOfFunds}</p>
                <button className="button button-primary" onClick={() => void approveRte(item.id)} disabled={item.approvedByOfficer}>
                  {item.approvedByOfficer ? "Aprobado" : "Aprobar RTE"}
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel table-card">
        <div className="section-heading">
          <h2>Casos consolidados del cliente</h2>
          <p>Historial transaccional y alertas en una sola vista, como pide el PDF.</p>
        </div>
        <div className="tri-grid" style={{ marginTop: 18 }}>
          {clientCases.slice(0, 6).map((client) => (
            <article className="list-item" key={client.clientHash}>
              <div className="toolbar">
                <strong>{client.clientName}</strong>
                <RiskBadge risk={client.riskLevel} />
              </div>
              <p className="mono muted">{client.clientHash}</p>
              <p>Efectivo 24h: ${client.dailyCashTotal.toLocaleString("en-US")}</p>
              <p className="muted">{client.transactions.length} transacciones · {client.alerts.length} alertas</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
