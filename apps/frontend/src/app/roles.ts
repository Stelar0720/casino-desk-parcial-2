import type { Role, RoleCapability } from "./types";

export const roleCapabilities: Record<Role, RoleCapability> = {
  Cajero: {
    canBuyIn: true,
    canCashOut: true,
    canRunKyc: true,
    canRaiseManualAlert: true,
    canApprovePep: false,
    canReviewRte: false,
    canCreateRos: false,
    canAccessPrivateCompliance: false
  },
  Dealer: {
    canBuyIn: true,
    canCashOut: false,
    canRunKyc: true,
    canRaiseManualAlert: true,
    canApprovePep: false,
    canReviewRte: false,
    canCreateRos: false,
    canAccessPrivateCompliance: false
  },
  Oficial: {
    canBuyIn: false,
    canCashOut: false,
    canRunKyc: false,
    canRaiseManualAlert: false,
    canApprovePep: true,
    canReviewRte: true,
    canCreateRos: true,
    canAccessPrivateCompliance: true
  },
  Supervisor: {
    canBuyIn: false,
    canCashOut: false,
    canRunKyc: false,
    canRaiseManualAlert: true,
    canApprovePep: false,
    canReviewRte: false,
    canCreateRos: false,
    canAccessPrivateCompliance: true
  },
  Administrador: {
    canBuyIn: true,
    canCashOut: true,
    canRunKyc: true,
    canRaiseManualAlert: true,
    canApprovePep: true,
    canReviewRte: true,
    canCreateRos: true,
    canAccessPrivateCompliance: true
  }
};

export function getRoleHome(role: Role) {
  switch (role) {
    case "Dealer":
      return "/dealer";
    case "Oficial":
      return "/official";
    case "Supervisor":
      return "/supervisor";
    case "Administrador":
      return "/admin";
    default:
      return "/";
  }
}

export function getRoleBadge(role: Role) {
  switch (role) {
    case "Dealer":
      return "Mesa de juego";
    case "Oficial":
      return "Panel privado";
    case "Supervisor":
      return "Monitoreo de sala";
    case "Administrador":
      return "Vista global";
    default:
      return "Caja operativa";
  }
}
