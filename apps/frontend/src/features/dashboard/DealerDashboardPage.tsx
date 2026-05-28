import { ShieldAlert, Ticket, UserSearch } from "lucide-react";
import { useAppStore } from "../../app/store";
import { useAppChrome } from "../../components/AppShell";

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export function DealerDashboardPage() {
  const { openModal } = useAppChrome();
  const transactions = useAppStore((state) => state.transactions);
  const alerts = useAppStore((state) => state.alerts);
  const session = useAppStore((state) => state.session);

  const mesaTransactions = transactions.filter((item) => item.sourceChannel === "MESA" || session?.station.includes("MESA"));
  const kycQueue = mesaTransactions.filter((item) => item.requiresKyc).length;
  const pendingPep = alerts.filter((item) => item.type === "PEP" && item.status !== "CERRADA").length;

  return (
    <div className="section-stack">
      <section className="role-hero role-hero--dealer">
        <div>
          <span className="eyebrow">Dealer · UC-01 Buy-in en mesa</span>
          <h1>Flujo rapido de mesa con KYC condicional</h1>
          <p>
            Puedes iniciar compras de fichas y capturar KYC desde mesa cuando el monto alcance el umbral. No gestionas cash-out
            ni reportes regulatorios.
          </p>
        </div>
        <div className="role-hero__actions">
          <button className="button button-primary" onClick={() => openModal("buyin")} type="button">
            Iniciar buy-in en mesa
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card panel">
          <div className="stat-header">
            <span>KYC activados en mesa</span>
            <UserSearch size={18} />
          </div>
          <div className="stat-value">{kycQueue}</div>
          <p className="muted">Compras desde {"$2,000"} con escaneo QR o captura manual.</p>
        </article>
        <article className="stat-card panel">
          <div className="stat-header">
            <span>Volumen buy-in mesa</span>
            <Ticket size={18} />
          </div>
          <div className="stat-value">{formatCurrency(mesaTransactions.reduce((sum, item) => sum + item.amount, 0))}</div>
          <p className="muted">Operado sin exponer el panel privado del oficial.</p>
        </article>
        <article className="stat-card panel">
          <div className="stat-header">
            <span>PEP pendientes</span>
            <ShieldAlert size={18} />
          </div>
          <div className="stat-value">{pendingPep}</div>
          <p className="muted">Escalados al oficial si el perfil economico no es proporcional.</p>
        </article>
      </section>

      <section className="panel table-card">
        <div className="section-heading">
          <h2>Checklist operativo del dealer</h2>
          <p>Lo que el PDF exige para mesa: umbral, KYC, listas AML/PEP y alerta discreta.</p>
        </div>
        <div className="tri-grid" style={{ marginTop: 18 }}>
          <article className="list-item">
            <strong>1. Recibir solicitud</strong>
            <p className="muted">Compra menor a $2,000 se procesa sin pedir identificacion.</p>
          </article>
          <article className="list-item">
            <strong>2. Escanear si supera umbral</strong>
            <p className="muted">QR preferido y captura manual disponible para documentos no legibles.</p>
          </article>
          <article className="list-item">
            <strong>3. Escalar discreto</strong>
            <p className="muted">PEP, timeout o comportamiento sospechoso se elevan sin exponer al cliente.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
