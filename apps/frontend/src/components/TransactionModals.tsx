import { useMemo, useState } from "react";
import { useAppStore } from "../app/store";
import { RiskBadge } from "./RiskBadge";

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

function ModalShell({
  isOpen,
  title,
  maxWidth,
  onClose,
  children,
  footer
}: {
  isOpen: boolean;
  title: string;
  maxWidth?: number;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{ maxWidth }} onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title text-gold">{title}</h2>
          <button className="modal__close" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function BuyInModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const submitTransaction = useAppStore((state) => state.submitTransaction);
  const session = useAppStore((state) => state.session);
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(2500);
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "CHEQUE">("EFECTIVO");
  const [documentNumber, setDocumentNumber] = useState("8-712-2241");
  const [name, setName] = useState("Carlos Andres Nunez Pinilla");
  const [nationality, setNationality] = useState("Panameña");
  const [residenceCountry, setResidenceCountry] = useState("Panamá");
  const [originOfFunds, setOriginOfFunds] = useState("Actividad comercial y disponibilidad de fondos declarada.");
  const [captureMode, setCaptureMode] = useState<"QR" | "MANUAL">("QR");
  const [proportionality, setProportionality] = useState<"PROPORCIONAL" | "NO_PROPORCIONAL">("PROPORCIONAL");
  const [riskLevel, setRiskLevel] = useState<"VERDE" | "AMARILLO" | "ROJO">("VERDE");

  const requiresKyc = amount >= 2000;
  const requiresRte = amount >= 10000 && paymentMethod === "EFECTIVO";

  const computedRisk = useMemo(() => {
    const upper = name.toUpperCase();
    const country = residenceCountry.toUpperCase();
    if (upper.includes("OFAC") || upper.includes("SANCIONADO")) return "ROJO" as const;
    if (upper.includes("PEP") || upper.includes("ALCALDE") || amount >= 8000 || country.includes("RIESGO")) return "AMARILLO" as const;
    return "VERDE" as const;
  }, [amount, name, residenceCountry]);

  const reset = () => {
    setStep(1);
    setAmount(2500);
    setPaymentMethod("EFECTIVO");
    setDocumentNumber("8-712-2241");
    setName("Carlos Andres Nunez Pinilla");
    setNationality("Panameña");
    setResidenceCountry("Panamá");
    setOriginOfFunds("Actividad comercial y disponibilidad de fondos declarada.");
    setCaptureMode("QR");
    setProportionality("PROPORCIONAL");
    setRiskLevel("VERDE");
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={() => {
        onClose();
        reset();
      }}
      title={session?.role === "Dealer" ? "Buy-in — Mesa de juego" : "Buy-in — Compra de fichas"}
      maxWidth={760}
      footer={
        <>
          <button
            className="btn btn--secondary"
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            style={{ visibility: step === 1 ? "hidden" : "visible" }}
            type="button"
          >
            Volver
          </button>
          <button className="btn btn--ghost" onClick={onClose} type="button">
            Pausar y atender siguiente
          </button>
          <button
            className="btn btn--primary"
            onClick={async () => {
              if (step === 1) {
                setStep(requiresKyc ? 2 : 3);
                return;
              }

              if (step === 2) {
                setRiskLevel(computedRisk);
                setStep(3);
                return;
              }

              const result = await submitTransaction({
                type: "BUY_IN",
                clientDisplayName: name,
                documentNumber,
                amount,
                paymentMethod,
                originOfFunds: requiresRte || proportionality === "NO_PROPORCIONAL" ? originOfFunds : undefined,
                justification: proportionality === "NO_PROPORCIONAL" ? originOfFunds : undefined,
                nationality,
                residenceCountry,
                sourceChannel: session?.role === "Dealer" ? "MESA" : "CAJA",
                documentCaptureMode: captureMode
              });
              setRiskLevel(result.level);
              onClose();
              reset();
              onSuccess();
            }}
            type="button"
          >
            {step === 3 ? "Registrar expediente" : "Continuar"}
          </button>
        </>
      }
    >
      <p className="modal__intro">
        Menor a <strong>$2,000</strong>: sin KYC. Igual o mayor: escaneo de documento, screening AML/PEP y control de trazabilidad.
      </p>

      {step === 1 ? (
        <div>
          <h4 className="modal__section-title">1. Umbral y canal operativo</h4>

          <div className="grid grid--2col mb-lg">
            <div className="form-group">
              <label className="form-label">MONTO DE LA TRANSACCIÓN</label>
              <input className="form-input form-input--large" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">CAPTURA DEL DOCUMENTO</label>
              <div className="radio-group">
                {(["QR", "MANUAL"] as const).map((mode) => (
                  <label className="radio-option" key={mode}>
                    <input checked={captureMode === mode} name="capture-mode" onChange={() => setCaptureMode(mode)} type="radio" />
                    <span className="radio-option__label">{mode === "QR" ? "Escaneo QR" : "Entrada manual"}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">INSTRUMENTO DE PAGO</label>
            <div className="radio-group">
              {(["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CHEQUE"] as const).map((method) => (
                <label className="radio-option" key={method}>
                  <input checked={paymentMethod === method} name="buyin-method" onChange={() => setPaymentMethod(method)} type="radio" />
                  <span className="radio-option__label">{method}</span>
                </label>
              ))}
            </div>
          </div>

          {requiresKyc ? (
            <div className="kyc-warning">
              <strong className="text-gold">KYC ACTIVADO</strong>
              <p>Art. 27 Ley 23/2015 · Documento, nacionalidad, residencia y screening AML/PEP.</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <h4 className="modal__section-title">2. Identificación del cliente</h4>
          <p className="form-hint">QR preferido. Si no es legible, se admite ingreso manual conforme al criterio del PDF.</p>

          <div className="grid grid--2col mb-lg">
            <div className="form-group">
              <label className="form-label">CÉDULA / PASAPORTE</label>
              <input className="form-input" value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">NACIONALIDAD</label>
              <input className="form-input" value={nationality} onChange={(event) => setNationality(event.target.value)} />
            </div>
          </div>

          <div className="grid grid--2col mb-lg">
            <div className="form-group">
              <label className="form-label">NOMBRE COMPLETO</label>
              <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">PAÍS DE RESIDENCIA</label>
              <input className="form-input" value={residenceCountry} onChange={(event) => setResidenceCountry(event.target.value)} />
            </div>
          </div>

          {computedRisk === "AMARILLO" ? (
            <div className="form-group">
              <label className="form-label">PROPORCIONALIDAD PEP / PERFIL ECONÓMICO</label>
              <div className="radio-group">
                {(["PROPORCIONAL", "NO_PROPORCIONAL"] as const).map((value) => (
                  <label className="radio-option" key={value}>
                    <input checked={proportionality === value} name="proportionality" onChange={() => setProportionality(value)} type="radio" />
                    <span className="radio-option__label">{value === "PROPORCIONAL" ? "Proporcional" : "No proporcional"}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {requiresRte || proportionality === "NO_PROPORCIONAL" ? (
            <div className="form-group">
              <label className="form-label">ORIGEN DE FONDOS / JUSTIFICACIÓN</label>
              <textarea className="form-input form-textarea" value={originOfFunds} onChange={(event) => setOriginOfFunds(event.target.value)} />
            </div>
          ) : null}

          <div className="screening-result">
            <h5>Screening AML/PEP</h5>
            <div className="screening-badges">
              <span className="badge badge--green">OFAC</span>
              <span className="badge badge--green">ONU</span>
              <span className="badge badge--green">UE</span>
              <span className="badge badge--green">PEP</span>
            </div>
            <div className="screening-summary">
              <RiskBadge risk={computedRisk} />
              <p className="text-secondary">
                {computedRisk === "VERDE" && "Sin coincidencias. Puede avanzar."}
                {computedRisk === "AMARILLO" && "Caso PEP o riesgo geográfico. Requiere evaluación privada."}
                {computedRisk === "ROJO" && "Coincidencia AML. La transacción quedará bloqueada."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <h4 className="modal__section-title">3. Expediente y semáforo</h4>
          <div className="receipt">
            <div className="receipt__header">
              <div className="receipt__title text-gold">EXPEDIENTE DE BUY-IN</div>
              <div className="receipt__id">TX-{new Date().getFullYear()}-{Date.now().toString().slice(-5)}</div>
            </div>
            <div className="receipt__row">
              <span>Canal</span>
              <span>{session?.role === "Dealer" ? "Mesa" : "Caja"}</span>
            </div>
            <div className="receipt__row">
              <span>Monto</span>
              <span className="text-gold">{formatCurrency(amount)}</span>
            </div>
            <div className="receipt__row">
              <span>Documento</span>
              <span>{captureMode === "QR" ? "Escaneo QR" : "Entrada manual"}</span>
            </div>
            <div className="receipt__row">
              <span>Cliente</span>
              <span>{name}</span>
            </div>
            <div className="receipt__row">
              <span>Residencia</span>
              <span>{residenceCountry}</span>
            </div>
            <div className="modal-risk-line">
              <RiskBadge risk={riskLevel} />
              {requiresRte ? <span className="badge badge--yellow">RTE requerido</span> : null}
              {proportionality === "NO_PROPORCIONAL" ? <span className="badge badge--yellow">Escalar PEP</span> : null}
            </div>
          </div>

          <div className="trace-panel">
            <strong>Trazabilidad</strong>
            <p>Hash+salt para documento, expediente inmutable y retención mínima de 5 años.</p>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}

export function CashOutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const submitTransaction = useAppStore((state) => state.submitTransaction);
  const [amount, setAmount] = useState(3000);
  const [documentNumber, setDocumentNumber] = useState("8-902-1547");
  const [name, setName] = useState("Luis Fernando Espinosa Quintero");
  const [nationality, setNationality] = useState("Panameña");
  const [residenceCountry, setResidenceCountry] = useState("Panamá");
  const [chipsPlayedRatio, setChipsPlayedRatio] = useState(0.18);
  const [captureMode, setCaptureMode] = useState<"QR" | "MANUAL">("QR");
  const netAmount = Math.round(amount * 0.985);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Cash-out — Canje de tickets"
      maxWidth={700}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="btn btn--primary"
            onClick={async () => {
              await submitTransaction({
                type: "CASH_OUT",
                clientDisplayName: name,
                documentNumber,
                amount,
                paymentMethod: "EFECTIVO",
                originOfFunds: "Canje validado contra tickets autenticados.",
                chipsPlayedRatio,
                nationality,
                residenceCountry,
                sourceChannel: "CAJA",
                documentCaptureMode: captureMode
              });
              onClose();
            }}
            type="button"
          >
            Confirmar — Entregar {formatCurrency(netAmount)}
          </button>
        </>
      }
    >
      <p className="modal__intro">
        Validación de autenticidad obligatoria antes de pagar. Si el total alcanza <strong>$2,000</strong>, se activa KYC.
      </p>

      <div className="form-group">
        <label className="form-label">TICKETS RECIBIDOS</label>
        <ul className="ticket-list">
          <li className="ticket-item">
            <span className="ticket-item__code">TKT-A47-2218</span>
            <span className="ticket-item__value">$1,800</span>
          </li>
          <li className="ticket-item">
            <span className="ticket-item__code">TKT-A47-2241</span>
            <span className="ticket-item__value">$950</span>
          </li>
          <li className="ticket-item">
            <span className="ticket-item__code">TKT-A47-2253</span>
            <span className="ticket-item__value">$250</span>
          </li>
        </ul>
      </div>

      <div className="receipt mb-lg">
        <div className="receipt__row">
          <span>Subtotal</span>
          <span className="font-mono">{formatCurrency(amount)}</span>
        </div>
        <div className="receipt__row">
          <span>Comisión (1.5%)</span>
          <span className="font-mono">-{formatCurrency(Math.round(amount * 0.015))}</span>
        </div>
        <div className="receipt__row receipt__row--total">
          <strong>Neto a entregar</strong>
          <strong className="text-gold">{formatCurrency(netAmount)}</strong>
        </div>
      </div>

      <div className="grid grid--2col mb-lg">
        <div className="form-group">
          <label className="form-label">IDENTIFICACIÓN</label>
          <input className="form-input" value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">CAPTURA</label>
          <div className="radio-group">
            {(["QR", "MANUAL"] as const).map((mode) => (
              <label className="radio-option" key={mode}>
                <input checked={captureMode === mode} name="cashout-capture" onChange={() => setCaptureMode(mode)} type="radio" />
                <span className="radio-option__label">{mode}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid--2col mb-lg">
        <div className="form-group">
          <label className="form-label">CLIENTE</label>
          <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">RATIO FICHAS APOSTADAS</label>
          <input className="form-input" max="1" min="0" step="0.01" type="number" value={chipsPlayedRatio} onChange={(event) => setChipsPlayedRatio(Number(event.target.value))} />
        </div>
      </div>

      <div className="grid grid--2col mb-lg">
        <div className="form-group">
          <label className="form-label">NACIONALIDAD</label>
          <input className="form-input" value={nationality} onChange={(event) => setNationality(event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">PAÍS DE RESIDENCIA</label>
          <input className="form-input" value={residenceCountry} onChange={(event) => setResidenceCountry(event.target.value)} />
        </div>
      </div>

      <div className="screening-result">
        <h5>Verificaciones</h5>
        <ul className="verification-list">
          <li>Tickets autenticados antes del pago.</li>
          <li>KYC obligatorio desde $2,000.</li>
          <li>Si el jugador apostó menos del 20%, se genera alerta automática al oficial.</li>
        </ul>
      </div>
    </ModalShell>
  );
}

export function ManualAlertModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createManualAlert = useAppStore((state) => state.createManualAlert);
  const session = useAppStore((state) => state.session);
  const [title, setTitle] = useState("Comportamiento sospechoso en sala");
  const [description, setDescription] = useState(
    "Jugador cambia su patron de juego, evita interacción y solicita dispersar operaciones entre mesa y caja."
  );
  const [clientHash, setClientHash] = useState("b88e...2741");
  const [amount, setAmount] = useState(1800);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Alerta discreta"
      maxWidth={620}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="btn btn--primary"
            onClick={async () => {
              await createManualAlert({ title, description, clientHash, amount });
              onClose();
            }}
            type="button"
          >
            Registrar sin alertar al cliente
          </button>
        </>
      }
    >
      <p className="modal__intro">
        {session?.role === "Supervisor" ? "Escala el caso al oficial" : "Deja constancia interna"} sin interrumpir la operación en
        sala.
      </p>

      <div className="form-group">
        <label className="form-label">MOTIVO</label>
        <input className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>
      <div className="grid grid--2col mb-lg">
        <div className="form-group">
          <label className="form-label">HASH DEL CLIENTE</label>
          <input className="form-input" value={clientHash} onChange={(event) => setClientHash(event.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">MONTO REFERENCIAL</label>
          <input className="form-input" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">DETALLE INTERNO</label>
        <textarea className="form-input form-textarea" value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
    </ModalShell>
  );
}

export function ReceiptModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const session = useAppStore((state) => state.session);

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Comprobante" maxWidth={420}>
      <div className="receipt">
        <div className="receipt__header">
          <div className="receipt__title text-gold">CASINODESK · EXPEDIENTE AML</div>
          <div className="receipt__id">EXP-{new Date().getFullYear()}-{Date.now().toString().slice(-6)}</div>
        </div>
        <div className="receipt__row">
          <span>Estación</span>
          <span>{session?.station} · {session?.initials}</span>
        </div>
        <div className="receipt__row">
          <span>Cliente</span>
          <span>Registro completado</span>
        </div>
        <div className="receipt__row">
          <span>Semáforo</span>
          <span className="badge badge--green">VERDE</span>
        </div>
        <div className="receipt__row receipt__row--total">
          <strong>ESTADO</strong>
          <strong className="text-gold">Expediente generado</strong>
        </div>
        <div className="receipt__footer">Trazabilidad obligatoria por 5 años conforme a la Ley 23/2015.</div>
      </div>
    </ModalShell>
  );
}
