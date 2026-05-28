import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppStore } from "../../app/store";
import { RiskBadge } from "../../components/RiskBadge";
import type { ScreeningResult, Transaction } from "../../app/types";

const transactionSchema = z.object({
  clientDisplayName: z.string().min(3, "Ingrese el nombre del cliente."),
  documentNumber: z.string().min(5, "Documento requerido."),
  amount: z.coerce.number().positive("Monto invalido."),
  paymentMethod: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CHEQUE"]),
  originOfFunds: z.string().optional(),
  justification: z.string().optional(),
  chipsPlayedRatio: z.coerce.number().min(0).max(1).optional()
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

function ScreeningSummary({ result }: { result: ScreeningResult | null }) {
  if (!result) {
    return (
      <div className="list-item">
        <strong>Semaforo AML/PEP</strong>
        <p className="muted">El resultado consolidado aparecera aqui despues de registrar la operacion.</p>
      </div>
    );
  }

  return (
    <div className="list-item">
      <div className="toolbar">
        <strong>Resultado de screening</strong>
        <RiskBadge risk={result.level} />
      </div>
      <p className="muted">
        {result.level === "ROJO" && "Transaccion bloqueada por coincidencia en listas o sanciones."}
        {result.level === "AMARILLO" && "Revision reforzada requerida por PEP o contingencia de proveedor."}
        {result.level === "VERDE" && "Cliente limpio, sin coincidencias AML ni PEP."}
      </p>
    </div>
  );
}

function baseDefaults(): TransactionFormValues {
  return {
    clientDisplayName: "",
    documentNumber: "",
    amount: 0,
    paymentMethod: "EFECTIVO",
    originOfFunds: "",
    justification: "",
    chipsPlayedRatio: 0.5
  };
}

function transactionStatusHelp(type: Transaction["type"], amount: number, paymentMethod: Transaction["paymentMethod"]) {
  if (amount >= 10000 && paymentMethod === "EFECTIVO") {
    return "RTE obligatorio antes de completar la operacion.";
  }
  if (amount >= 2000) {
    return `${type === "BUY_IN" ? "Buy-in" : "Cash-out"} con KYC obligatorio y screening AML/PEP.`;
  }
  return "Operacion bajo umbral. Se procesa sin KYC, pero sigue monitoreada por fraccionamiento.";
}

export function BuyInForm() {
  const submitTransaction = useAppStore((state) => state.submitTransaction);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: baseDefaults()
  });
  const amount = form.watch("amount") || 0;
  const paymentMethod = form.watch("paymentMethod");

  const helperText = useMemo(() => transactionStatusHelp("BUY_IN", amount, paymentMethod), [amount, paymentMethod]);

  return (
    <section className="form-card panel">
      <div className="section-heading">
        <h2>Buy-in</h2>
        <p>Activacion automatica de KYC, screening paralelo y RTE por umbral.</p>
      </div>

      <form
        className="section-stack"
        style={{ marginTop: 18 }}
        onSubmit={form.handleSubmit(async (values) => {
          const screening = await submitTransaction({ ...values, type: "BUY_IN" });
          setResult(screening);
          form.reset(baseDefaults());
        })}
      >
        <div className="field-grid">
          <div className="field">
            <label>Nombre del cliente</label>
            <input {...form.register("clientDisplayName")} placeholder="Nombre completo" />
          </div>
          <div className="field">
            <label>Documento</label>
            <input {...form.register("documentNumber")} placeholder="Cedula o pasaporte" />
          </div>
          <div className="field">
            <label>Monto</label>
            <input type="number" min="0" step="100" {...form.register("amount")} />
          </div>
          <div className="field">
            <label>Instrumento de pago</label>
            <select {...form.register("paymentMethod")}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
        </div>

        {amount >= 2000 ? (
          <div className="field-grid">
            <div className="field">
              <label>Origen de fondos</label>
              <textarea {...form.register("originOfFunds")} placeholder="Declaracion requerida para revision reforzada o RTE." />
            </div>
            <div className="field">
              <label>Justificacion PEP</label>
              <textarea {...form.register("justification")} placeholder="Solo cuando el caso AMARILLO requiere proporcionalidad." />
            </div>
          </div>
        ) : null}

        <div className="toolbar">
          <p className="muted">{helperText}</p>
          <button className="button button-primary" type="submit">
            Registrar buy-in
          </button>
        </div>
      </form>

      <ScreeningSummary result={result} />
    </section>
  );
}

export function CashOutForm() {
  const submitTransaction = useAppStore((state) => state.submitTransaction);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: baseDefaults()
  });
  const amount = form.watch("amount") || 0;
  const paymentMethod = form.watch("paymentMethod");
  const chipsPlayedRatio = form.watch("chipsPlayedRatio");

  const helperText = useMemo(() => transactionStatusHelp("CASH_OUT", amount, paymentMethod), [amount, paymentMethod]);

  return (
    <section className="form-card panel">
      <div className="section-heading">
        <h2>Cash-out</h2>
        <p>Validacion de tickets, control AML y alerta por uso menor al 20% de fichas.</p>
      </div>

      <form
        className="section-stack"
        style={{ marginTop: 18 }}
        onSubmit={form.handleSubmit(async (values) => {
          const screening = await submitTransaction({ ...values, type: "CASH_OUT" });
          setResult(screening);
          form.reset(baseDefaults());
        })}
      >
        <div className="field-grid">
          <div className="field">
            <label>Nombre del cliente</label>
            <input {...form.register("clientDisplayName")} placeholder="Nombre completo" />
          </div>
          <div className="field">
            <label>Documento</label>
            <input {...form.register("documentNumber")} placeholder="Cedula o pasaporte" />
          </div>
          <div className="field">
            <label>Monto de canje</label>
            <input type="number" min="0" step="100" {...form.register("amount")} />
          </div>
          <div className="field">
            <label>Instrumento de pago</label>
            <select {...form.register("paymentMethod")}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="CHEQUE">Cheque</option>
              <option value="TARJETA">Tarjeta</option>
            </select>
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label>Ratio fichas apostadas</label>
            <input type="number" min="0" max="1" step="0.01" {...form.register("chipsPlayedRatio")} />
          </div>
          <div className="field">
            <label>Origen de fondos / soporte</label>
            <textarea
              {...form.register("originOfFunds")}
              placeholder="Declaracion obligatoria para acumulados de efectivo y casos reforzados."
            />
          </div>
        </div>

        <div className="toolbar">
          <p className="muted">
            {helperText} {typeof chipsPlayedRatio === "number" && chipsPlayedRatio < 0.2 ? "Se generara alerta de comportamiento." : ""}
          </p>
          <button className="button button-primary" type="submit">
            Registrar cash-out
          </button>
        </div>
      </form>

      <ScreeningSummary result={result} />
    </section>
  );
}
