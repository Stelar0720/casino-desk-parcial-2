import type {
  AlertItem,
  AuditEvent,
  AlertType,
  RiskLevel,
  Role,
  RosRecord,
  RteRecord,
  ScreeningResult,
  Transaction
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const TOKEN_KEY = "casinodesk.accessToken";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  fullName: string;
  role: Role;
  station: string;
};

type BackendTransaction = {
  id: string;
  type: "BuyIn" | "CashOut";
  clientName: string;
  clientHash: string;
  amount: number;
  paymentMethod: "Efectivo" | "Tarjeta" | "Transferencia" | "Cheque";
  riskLevel: "Verde" | "Amarillo" | "Rojo";
  status: "Completada" | "Bloqueada" | "PendienteRte" | "PendienteRevision";
  requiresKyc: boolean;
  requiresRte: boolean;
  chipsPlayedRatio?: number | null;
  createdAt: string;
};

type BackendAlert = {
  id: string;
  type: "Pep" | "Aml" | "Fraccionamiento" | "Comportamiento" | "Manual" | "Timeout";
  title: string;
  description: string;
  riskLevel: "Verde" | "Amarillo" | "Rojo";
  severity: "ALTA" | "MEDIA" | "CRITICA";
  clientHash: string;
  amount: number;
  status: "ABIERTA" | "EN_REVISION" | "CERRADA";
  createdAt: string;
};

type BackendScreening = {
  level: "Verde" | "Amarillo" | "Rojo";
  requiresReview: boolean;
  timedOut: boolean;
  amlMatches: string[];
  pepMatch?: string | null;
};

function toRiskLevel(value: "Verde" | "Amarillo" | "Rojo"): RiskLevel {
  return value === "Verde" ? "VERDE" : value === "Amarillo" ? "AMARILLO" : "ROJO";
}

function toAlertType(value: BackendAlert["type"]): AlertType {
  switch (value) {
    case "Pep":
      return "PEP";
    case "Aml":
      return "AML";
    case "Fraccionamiento":
      return "FRACCIONAMIENTO";
    case "Comportamiento":
      return "COMPORTAMIENTO";
    case "Manual":
      return "MANUAL";
    case "Timeout":
      return "TIMEOUT";
  }
}

function mapTransaction(item: BackendTransaction): Transaction {
  return {
    id: item.id,
    type: item.type === "BuyIn" ? "BUY_IN" : "CASH_OUT",
    clientDisplayName: item.clientName,
    clientHash: item.clientHash,
    amount: item.amount,
    paymentMethod:
      item.paymentMethod === "Efectivo"
        ? "EFECTIVO"
        : item.paymentMethod === "Tarjeta"
          ? "TARJETA"
          : item.paymentMethod === "Transferencia"
            ? "TRANSFERENCIA"
            : "CHEQUE",
    risk: toRiskLevel(item.riskLevel),
    status:
      item.status === "PendienteRte"
        ? "PENDIENTE_RTE"
        : item.status === "PendienteRevision"
          ? "PENDIENTE_REVISION"
          : item.status === "Bloqueada"
            ? "BLOQUEADA"
            : "COMPLETADA",
    createdAt: item.createdAt,
    chipsPlayedRatio: item.chipsPlayedRatio ?? undefined,
    requiresKyc: item.requiresKyc,
    requiresRte: item.requiresRte
  };
}

function mapAlert(item: BackendAlert): AlertItem {
  return {
    id: item.id,
    type: toAlertType(item.type),
    title: item.title,
    severity: item.severity,
    risk: toRiskLevel(item.riskLevel),
    createdAt: item.createdAt,
    description: item.description,
    clientHash: item.clientHash,
    amount: item.amount,
    status: item.status
  };
}

function mapScreening(item: BackendScreening): ScreeningResult {
  return {
    level: toRiskLevel(item.level),
    amlMatches: item.amlMatches,
    pepMatch: item.pepMatch ?? undefined,
    requiresReview: item.requiresReview,
    timeout: item.timedOut
  };
}

type LoginPayload = {
  username: string;
  password: string;
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function login(payload: LoginPayload) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getTransactions() {
  const data = await request<BackendTransaction[]>("/transactions");
  return data.map(mapTransaction);
}

export async function createBuyIn(payload: unknown) {
  return request("/transactions/buy-in", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createCashOut(payload: unknown) {
  return request("/transactions/cash-out", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function runScreening(payload: unknown) {
  const data = await request<BackendScreening>("/screening/run", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return mapScreening(data);
}

export async function getAlerts() {
  const data = await request<BackendAlert[]>("/alerts");
  return data.map(mapAlert);
}

export async function patchAlert(id: string, status: string) {
  return request(`/alerts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export async function getRtes() {
  return request<RteRecord[]>("/rte");
}

export async function approveRteRequest(id: string) {
  return request(`/rte/${id}/approve`, {
    method: "PATCH"
  });
}

export async function getRos() {
  return request<RosRecord[]>("/ros");
}

export async function createRosRequest(alertId: string, narrative: string) {
  return request<RosRecord>("/ros", {
    method: "POST",
    body: JSON.stringify({ alertId, narrative })
  });
}

export async function getAudit() {
  return request<AuditEvent[]>("/audit");
}
