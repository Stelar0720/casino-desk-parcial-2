import { useMemo, useState } from "react";
import { roleCapabilities } from "../../app/roles";
import { useAppStore } from "../../app/store";
import type { AlertItem } from "../../app/types";
import { RiskBadge } from "../../components/RiskBadge";

const filters = ["Todas", "Criticas", "PEP", "Fraccionamiento", "Manuales"] as const;

export function AlertsPage() {
  const alerts = useAppStore((state) => state.alerts);
  const resolveAlert = useAppStore((state) => state.resolveAlert);
  const createRos = useAppStore((state) => state.createRos);
  const session = useAppStore((state) => state.session);
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("Todas");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(alerts[0]?.id ?? null);
  const [narrative, setNarrative] = useState("");
  const [closureJustification, setClosureJustification] = useState(
    "Analisis completado sin elementos suficientes para ROS. Se mantiene trazabilidad documental."
  );

  const canCreateRos = session ? roleCapabilities[session.role].canCreateRos : false;

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (activeFilter === "Criticas") return alert.severity === "CRITICA";
      if (activeFilter === "PEP") return alert.type === "PEP";
      if (activeFilter === "Fraccionamiento") return alert.type === "FRACCIONAMIENTO";
      if (activeFilter === "Manuales") return alert.source === "MANUAL";
      return true;
    });
  }, [activeFilter, alerts]);

  const selectedAlert = filteredAlerts.find((item) => item.id === selectedAlertId) ?? filteredAlerts[0] ?? null;

  return (
    <div className="section-stack">
      <section className="panel table-card">
        <div className="section-heading">
          <h2>Bandeja privada de alertas</h2>
          <p>Lista filtrable, detalle consolidado y acciones discretas de cierre o ROS.</p>
        </div>

        <div className="filter-row" style={{ marginTop: 18 }}>
          {filters.map((filter) => (
            <button
              key={filter}
              className={`chip ${activeFilter === filter ? "chip--active" : ""}`}
              onClick={() => setActiveFilter(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid--sidebar" style={{ marginTop: 18 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Riesgo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className={selectedAlert?.id === alert.id ? "table__row--selected" : ""}
                    onClick={() => setSelectedAlertId(alert.id)}
                  >
                    <td>{alert.type}</td>
                    <td className="mono">{alert.clientHash}</td>
                    <td>${alert.amount.toLocaleString("en-US")}</td>
                    <td>
                      <RiskBadge risk={alert.risk} />
                    </td>
                    <td>{alert.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Detalle del caso</h3>
            </div>

            {selectedAlert ? (
              <div className="section-stack">
                <div className="receipt">
                  <div className="receipt__row">
                    <span>Alerta</span>
                    <span>{selectedAlert.title}</span>
                  </div>
                  <div className="receipt__row">
                    <span>Hash cliente</span>
                    <span className="mono">{selectedAlert.clientHash}</span>
                  </div>
                  <div className="receipt__row">
                    <span>Origen</span>
                    <span>{selectedAlert.source ?? "AUTOMATICA"}</span>
                  </div>
                  <div className="receipt__row">
                    <span>Asignada a</span>
                    <span>{selectedAlert.assignedRole ?? "Oficial"}</span>
                  </div>
                </div>

                <article className="list-item">
                  <strong>Cronologia</strong>
                  <p className="muted">{new Date(selectedAlert.createdAt).toLocaleString("es-PA")}</p>
                  <p>{selectedAlert.description}</p>
                  {selectedAlert.resolutionNote ? <p className="muted">Cierre: {selectedAlert.resolutionNote}</p> : null}
                </article>

                <div className="field">
                  <label>Justificacion de cierre sin ROS</label>
                  <textarea value={closureJustification} onChange={(event) => setClosureJustification(event.target.value)} />
                </div>
                <button
                  className="button button-secondary"
                  onClick={() => void resolveAlert(selectedAlert.id, closureJustification)}
                  type="button"
                >
                  Cerrar alerta con justificacion
                </button>

                <div className="field">
                  <label>Narrativa ROS</label>
                  <textarea
                    value={narrative}
                    onChange={(event) => setNarrative(event.target.value)}
                    placeholder="Describe el patron detectado, el origen del riesgo y el criterio de reporte."
                  />
                </div>
                <button
                  className="button button-primary"
                  disabled={!canCreateRos}
                  onClick={() =>
                    void createRos(
                      selectedAlert.id,
                      narrative || `ROS confidencial basado en ${selectedAlert.type} y session precargada del cliente.`
                    )
                  }
                  type="button"
                >
                  {canCreateRos ? "Crear ROS confidencial" : "Solo oficial/admin puede emitir ROS"}
                </button>
              </div>
            ) : (
              <p className="muted">No hay alertas para el filtro seleccionado.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
