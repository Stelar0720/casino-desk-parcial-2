import { create } from "zustand";
import {
  approveRteRequest,
  clearToken,
  createBuyIn,
  createCashOut,
  createRosRequest,
  getAlerts,
  getAudit,
  getRos,
  getRtes,
  getTransactions,
  login,
  patchAlert,
  setToken
} from "./api";
import { initialAlerts, initialAudit, initialRos, initialRtes, initialTransactions, mockUsers } from "./mockData";
import type {
  AlertItem,
  AuditEvent,
  RiskLevel,
  RosRecord,
  RteRecord,
  ScreeningResult,
  Transaction,
  UserSession
} from "./types";

interface NewTransactionInput {
  type: "BUY_IN" | "CASH_OUT";
  clientDisplayName: string;
  documentNumber: string;
  amount: number;
  paymentMethod: Transaction["paymentMethod"];
  originOfFunds?: string;
  justification?: string;
  chipsPlayedRatio?: number;
  nationality?: string;
  residenceCountry?: string;
  sourceChannel?: "CAJA" | "MESA";
  documentCaptureMode?: "QR" | "MANUAL";
}

interface ManualAlertInput {
  title: string;
  description: string;
  clientHash?: string;
  amount?: number;
}

type ThemeMode = "light" | "dark";

interface UiPreferences {
  themeMode: ThemeMode;
  accentColor: string;
}

interface AppState {
  session: UserSession | null;
  backendAvailable: boolean;
  transactions: Transaction[];
  alerts: AlertItem[];
  rtes: RteRecord[];
  ros: RosRecord[];
  audit: AuditEvent[];
  uiPreferences: UiPreferences;
  loginAs: (role: UserSession["role"]) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
  submitTransaction: (input: NewTransactionInput) => Promise<ScreeningResult>;
  approveRte: (id: string) => Promise<void>;
  resolveAlert: (id: string, resolutionNote?: string) => Promise<void>;
  createRos: (alertId: string, narrative: string) => Promise<void>;
  createManualAlert: (input: ManualAlertInput) => Promise<void>;
  setThemeMode: (themeMode: ThemeMode) => void;
  setAccentColor: (accentColor: string) => void;
}

const HIGH_RISK_COUNTRIES = ["IRAN", "COLOMBIA RIESGO", "COREA DEL NORTE", "SIRIA", "VENEZUELA RIESGO"];

const normalizeValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const hashDocument = (documentNumber: string) => {
  const normalized = documentNumber.replace(/\s/g, "");
  const tail = normalized.slice(-4).padStart(4, "0");
  return `${normalized.length.toString(16)}a9f...${tail}`;
};

function detectRisk(client: string, amount: number, residenceCountry?: string): ScreeningResult {
  const normalized = normalizeValue(client);
  const normalizedResidence = normalizeValue(residenceCountry ?? "");

  if (normalized.includes("OFAC") || normalized.includes("SANCIONADO")) {
    return {
      level: "ROJO",
      amlMatches: ["OFAC SDN List"],
      requiresReview: false,
      timeout: false
    };
  }

  if (normalized.includes("TIMEOUT")) {
    return {
      level: "AMARILLO",
      amlMatches: [],
      requiresReview: true,
      timeout: true
    };
  }

  if (
    normalized.includes("PEP") ||
    normalized.includes("ALCALDE") ||
    amount >= 8000 ||
    HIGH_RISK_COUNTRIES.some((country) => normalizedResidence.includes(country))
  ) {
    return {
      level: "AMARILLO",
      amlMatches: HIGH_RISK_COUNTRIES.some((country) => normalizedResidence.includes(country)) ? ["Basel AML Index"] : [],
      pepMatch: normalized.includes("PEP") || normalized.includes("ALCALDE") ? "Perfil PEP o riesgo reforzado" : undefined,
      requiresReview: true,
      timeout: false
    };
  }

  return {
    level: "VERDE",
    amlMatches: [],
    requiresReview: false,
    timeout: false
  };
}

function riskWeight(level: RiskLevel) {
  return level === "ROJO" ? 100 : level === "AMARILLO" ? 65 : 18;
}

function makeAudit(actor: string, event: string, result: string): AuditEvent {
  return {
    id: `aud-${Date.now()}-${Math.round(Math.random() * 999)}`,
    actor,
    event,
    result,
    createdAt: new Date().toISOString()
  };
}

const UI_PREFERENCES_KEY = "casinodesk.uiPreferences";

function readUiPreferences(): UiPreferences {
  if (typeof window === "undefined") {
    return { themeMode: "light", accentColor: "#d4af37" };
  }

  try {
    const raw = window.localStorage.getItem(UI_PREFERENCES_KEY);
    if (!raw) {
      return { themeMode: "light", accentColor: "#d4af37" };
    }

    const parsed = JSON.parse(raw) as Partial<UiPreferences>;
    return {
      themeMode: parsed.themeMode === "dark" ? "dark" : "light",
      accentColor: typeof parsed.accentColor === "string" ? parsed.accentColor : "#d4af37"
    };
  } catch {
    return { themeMode: "light", accentColor: "#d4af37" };
  }
}

function persistUiPreferences(preferences: UiPreferences) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(preferences));
}

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  backendAvailable: false,
  transactions: initialTransactions,
  alerts: initialAlerts,
  rtes: initialRtes,
  ros: initialRos,
  audit: initialAudit,
  uiPreferences: readUiPreferences(),
  loginAs: async (role) => {
    const user = mockUsers.find((item) => item.role === role) ?? mockUsers[0];
    const usernameMap: Record<UserSession["role"], string> = {
      Cajero: "cajero",
      Dealer: "dealer",
      Oficial: "oficial",
      Supervisor: "supervisor",
      Administrador: "admin"
    };

    try {
      const auth = await login({
        username: usernameMap[role],
        password: "demo"
      });

      setToken(auth.accessToken);
      set({
        session: {
          id: user.id,
          fullName: auth.fullName,
          initials: auth.fullName
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join(""),
          role: auth.role,
          station: auth.station,
          accessToken: auth.accessToken
        },
        backendAvailable: true
      });
      await get().hydrate();
    } catch {
      set({ session: user, backendAvailable: false });
    }
  },
  logout: () => {
    clearToken();
    set({ session: null, backendAvailable: false });
  },
  hydrate: async () => {
    const session = get().session;
    if (!session) {
      return;
    }

    try {
      const [transactions, alerts, rtes, ros] = await Promise.all([
        getTransactions(),
        session.role === "Oficial" || session.role === "Administrador" ? getAlerts() : Promise.resolve(get().alerts),
        session.role === "Oficial" || session.role === "Administrador" ? getRtes() : Promise.resolve(get().rtes),
        session.role === "Oficial" || session.role === "Supervisor" || session.role === "Administrador"
          ? getRos()
          : Promise.resolve(get().ros)
      ]);

      const audit =
        session.role === "Oficial" || session.role === "Administrador"
          ? await getAudit()
          : get().audit;

      set({
        backendAvailable: true,
        transactions,
        alerts,
        rtes,
        ros,
        audit
      });
    } catch {
      set({ backendAvailable: false });
    }
  },
  submitTransaction: async (input) => {
    const screening = detectRisk(input.clientDisplayName, input.amount, input.residenceCountry);
    const clientHash = hashDocument(input.documentNumber);
    const requiresKyc = input.amount >= 2000;
    const requiresRte = input.paymentMethod === "EFECTIVO" && input.amount >= 10000;
    const actor = get().session?.fullName ?? "Sistema";
    const status =
      screening.level === "ROJO"
        ? "BLOQUEADA"
        : requiresRte
          ? "PENDIENTE_RTE"
          : screening.level === "AMARILLO"
            ? "PENDIENTE_REVISION"
            : "COMPLETADA";

    const transaction: Transaction = {
      id: `txn-${Date.now()}`,
      type: input.type,
      clientDisplayName: input.clientDisplayName,
      clientHash,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      risk: screening.level,
      status,
      createdAt: new Date().toISOString(),
      requiresKyc,
      requiresRte,
      chipsPlayedRatio: input.chipsPlayedRatio,
      nationality: input.nationality,
      residenceCountry: input.residenceCountry,
      originOfFunds: input.originOfFunds,
      sourceChannel: input.sourceChannel ?? "CAJA",
      documentCaptureMode: input.documentCaptureMode ?? "QR"
    };

    const newAlerts: AlertItem[] = [];

    if (screening.level === "ROJO") {
      newAlerts.push({
        id: `alt-${Date.now()}-aml`,
        type: "AML",
        title: "Transaccion bloqueada por screening",
        severity: "CRITICA",
        risk: "ROJO",
        createdAt: new Date().toISOString(),
        description: "Coincidencia detectada en listas AML o sanciones internacionales.",
        clientHash,
        amount: input.amount,
        status: "ABIERTA",
        source: "AUTOMATICA",
        createdBy: "Sistema AML",
        assignedRole: "Oficial",
        relatedTransactionIds: [transaction.id]
      });
    }

    if (screening.level === "AMARILLO") {
      newAlerts.push({
        id: `alt-${Date.now()}-pep`,
        type: screening.timeout ? "TIMEOUT" : "PEP",
        title: screening.timeout ? "Timeout precautorio AML" : "PEP o riesgo reforzado",
        severity: "ALTA",
        risk: "AMARILLO",
        createdAt: new Date().toISOString(),
        description: screening.timeout
          ? "Proveedor externo no respondio tras el reintento. Caso retenido por precaucion."
          : "Evaluar proporcionalidad del monto, origen de fondos y aprobacion privada del oficial.",
        clientHash,
        amount: input.amount,
        status: "ABIERTA",
        source: "AUTOMATICA",
        createdBy: "Sistema AML",
        assignedRole: "Oficial",
        relatedTransactionIds: [transaction.id]
      });
    }

    if (input.type === "CASH_OUT" && typeof input.chipsPlayedRatio === "number" && input.chipsPlayedRatio < 0.2) {
      newAlerts.push({
        id: `alt-${Date.now()}-comp`,
        type: "COMPORTAMIENTO",
        title: "Uso anomalo de fichas",
        severity: "ALTA",
        risk: "AMARILLO",
        createdAt: new Date().toISOString(),
        description: "El jugador aposto menos del 20% de las fichas compradas y requiere evaluacion discreta.",
        clientHash,
        amount: input.amount,
        status: "ABIERTA",
        source: "AUTOMATICA",
        createdBy: "Sistema AML",
        assignedRole: "Oficial",
        relatedTransactionIds: [transaction.id]
      });
    }

    const priorSmallTransactions = get().transactions.filter(
      (item) =>
        item.clientHash === clientHash &&
        item.amount < 2000 &&
        Math.abs(new Date(item.createdAt).getTime() - Date.now()) < 24 * 60 * 60 * 1000
    );

    if (input.amount < 2000 && priorSmallTransactions.length >= 2) {
      newAlerts.push({
        id: `alt-${Date.now()}-frac`,
        type: "FRACCIONAMIENTO",
        title: "Patron de fraccionamiento detectado",
        severity: "CRITICA",
        risk: "AMARILLO",
        createdAt: new Date().toISOString(),
        description: "Tres o mas transacciones menores al umbral en 24 horas entre caja y mesa.",
        clientHash,
        amount: input.amount + priorSmallTransactions.reduce((sum, item) => sum + item.amount, 0),
        status: "ABIERTA",
        source: "AUTOMATICA",
        createdBy: "Sistema AML",
        assignedRole: "Oficial",
        relatedTransactionIds: [transaction.id, ...priorSmallTransactions.map((item) => item.id)]
      });
    }

    const newRtes =
      requiresRte && input.originOfFunds
        ? [
            {
              id: `rte-${Date.now()}`,
              clientHash,
              totalAmount: input.amount,
              originOfFunds: input.originOfFunds,
              signedByClient: true,
              approvedByOfficer: false,
              transactionIds: [transaction.id],
              folio: `RTE-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
              createdAt: new Date().toISOString(),
              status: "PENDIENTE" as const
            },
            ...get().rtes
          ]
        : get().rtes;

    if (get().backendAvailable) {
      try {
        const payload = {
          clientName: input.clientDisplayName,
          documentNumber: input.documentNumber,
          amount: input.amount,
          paymentMethod: input.paymentMethod.charAt(0) + input.paymentMethod.slice(1).toLowerCase(),
          originOfFunds: input.originOfFunds,
          justification: input.justification,
          chipsPlayedRatio: input.chipsPlayedRatio
        };

        if (input.type === "BUY_IN") {
          await createBuyIn(payload);
        } else {
          await createCashOut(payload);
        }

        await get().hydrate();
        return screening;
      } catch {
        set({ backendAvailable: false });
      }
    }

    set({
      transactions: [transaction, ...get().transactions],
      alerts: [...newAlerts, ...get().alerts],
      rtes: newRtes,
      audit: [
        makeAudit(
          actor,
          `${input.type === "BUY_IN" ? "Buy-in" : "Cash-out"} registrado`,
          screening.level === "ROJO"
            ? "Transaccion bloqueada por screening AML."
            : screening.level === "AMARILLO"
              ? "Transaccion retenida para revision AML/PEP."
              : requiresRte
                ? "Operacion completada y enviada a flujo RTE."
                : "Operacion completada sin hallazgos."
        ),
        ...get().audit
      ]
    });

    return screening;
  },
  approveRte: async (id) => {
    const actor = get().session?.fullName ?? "Oficial";

    if (get().backendAvailable) {
      try {
        await approveRteRequest(id);
        await get().hydrate();
        return;
      } catch {
        set({ backendAvailable: false });
      }
    }

    set((state) => ({
      rtes: state.rtes.map((item) =>
        item.id === id ? { ...item, approvedByOfficer: true, status: "APROBADO" as const } : item
      ),
      audit: [makeAudit(actor, "RTE aprobado", `RTE ${id} aprobado por oficial.`), ...state.audit]
    }));
  },
  resolveAlert: async (id, resolutionNote) => {
    const actor = get().session?.fullName ?? "Oficial";

    if (get().backendAvailable) {
      try {
        await patchAlert(id, "CERRADA");
        await get().hydrate();
        return;
      } catch {
        set({ backendAvailable: false });
      }
    }

    set((state) => ({
      alerts: state.alerts.map((item) =>
        item.id === id ? { ...item, status: "CERRADA", resolutionNote: resolutionNote ?? "Caso cerrado con criterio interno." } : item
      ),
      audit: [makeAudit(actor, "Alerta cerrada", resolutionNote ?? `Alerta ${id} cerrada sin ROS.`), ...state.audit]
    }));
  },
  createRos: async (alertId, narrative) => {
    const actor = get().session?.fullName ?? "Oficial";

    if (get().backendAvailable) {
      try {
        await createRosRequest(alertId, narrative);
        await get().hydrate();
        return;
      } catch {
        set({ backendAvailable: false });
      }
    }

    set((state) => ({
      ros: [
        {
          id: `ros-${Date.now()}`,
          alertId,
          narrative,
          signedBy: actor,
          createdAt: new Date().toISOString(),
          status: "ENVIADO"
        },
        ...state.ros
      ],
      audit: [makeAudit(actor, "ROS generado", `ROS confidencial emitido para ${alertId}.`), ...state.audit]
    }));
  },
  createManualAlert: async (input) => {
    const actor = get().session?.fullName ?? "Supervisor";
    const role = get().session?.role ?? "Supervisor";
    const alert: AlertItem = {
      id: `alt-${Date.now()}-manual`,
      type: "MANUAL",
      title: input.title,
      severity: "ALTA",
      risk: "AMARILLO",
      createdAt: new Date().toISOString(),
      description: input.description,
      clientHash: input.clientHash ?? "sin-hash",
      amount: input.amount ?? 0,
      status: "ABIERTA",
      source: "MANUAL",
      createdBy: actor,
      assignedRole: role === "Supervisor" ? "Oficial" : role
    };

    set((state) => ({
      alerts: [alert, ...state.alerts],
      audit: [makeAudit(actor, "Alerta manual discreta", input.title), ...state.audit]
    }));
  },
  setThemeMode: (themeMode) =>
    set((state) => {
      const uiPreferences = { ...state.uiPreferences, themeMode };
      persistUiPreferences(uiPreferences);
      return { uiPreferences };
    }),
  setAccentColor: (accentColor) =>
    set((state) => {
      const uiPreferences = { ...state.uiPreferences, accentColor };
      persistUiPreferences(uiPreferences);
      return { uiPreferences };
    })
}));

export function buildClientCaseSummaries(transactions: Transaction[], alerts: AlertItem[]) {
  const hashes = new Set([...transactions.map((item) => item.clientHash), ...alerts.map((item) => item.clientHash)]);

  return Array.from(hashes).map((clientHash) => {
    const relatedTransactions = transactions.filter((item) => item.clientHash === clientHash);
    const relatedAlerts = alerts.filter((item) => item.clientHash === clientHash);
    const clientName = relatedTransactions[0]?.clientDisplayName ?? "Cliente monitoreado";
    const now = Date.now();
    const dailyCashTotal = relatedTransactions
      .filter((item) => item.paymentMethod === "EFECTIVO" && now - new Date(item.createdAt).getTime() <= 24 * 60 * 60 * 1000)
      .reduce((sum, item) => sum + item.amount, 0);
    const weeklyCashTotal = relatedTransactions
      .filter((item) => item.paymentMethod === "EFECTIVO" && now - new Date(item.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000)
      .reduce((sum, item) => sum + item.amount, 0);
    const maxRisk = [...relatedTransactions.map((item) => item.risk), ...relatedAlerts.map((item) => item.risk)].sort(
      (a, b) => riskWeight(b) - riskWeight(a)
    )[0] ?? "VERDE";

    return {
      clientHash,
      clientName,
      dailyCashTotal,
      weeklyCashTotal,
      transactions: relatedTransactions,
      alerts: relatedAlerts,
      riskScore: Math.min(
        100,
        relatedTransactions.reduce((sum, item) => sum + item.amount / 300, 0) + relatedAlerts.reduce((sum, item) => sum + riskWeight(item.risk), 0)
      ),
      riskLevel: maxRisk
    };
  });
}
