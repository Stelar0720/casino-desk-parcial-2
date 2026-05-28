import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRoleBadge, getRoleHome } from "../../app/roles";
import { useAppStore } from "../../app/store";
import type { Role } from "../../app/types";

const roles: Role[] = ["Cajero", "Dealer", "Oficial", "Supervisor", "Administrador"];

export function LoginPage() {
  const navigate = useNavigate();
  const loginAs = useAppStore((state) => state.loginAs);

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="sidebar-brand" style={{ marginBottom: 22 }}>
          <div className="brand-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="brand-title">CasinoDesk v3</p>
            <p className="brand-subtitle">AML/CFT, KYC condicional, RTE, ROS y trazabilidad regulatoria</p>
          </div>
        </div>

        <div className="section-stack">
          <div className="panel" style={{ padding: 18 }}>
            <div className="section-heading">
              <h2>Acceso por rol</h2>
              <p>Cada rol aterriza en un workspace distinto con permisos y campos visibles diferentes.</p>
            </div>

            <div className="login-role-grid" style={{ marginTop: 16 }}>
              {roles.map((role) => (
                <button
                  key={role}
                  className="role-login-card"
                  onClick={async () => {
                    await loginAs(role);
                    navigate(getRoleHome(role));
                  }}
                  type="button"
                >
                  <strong>{role}</strong>
                  <span>{getRoleBadge(role)}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="footer-note">
            El frontend ahora separa caja, mesa, panel privado del oficial, monitoreo de supervisor y vista global de
            administración.
          </p>
        </div>
      </div>
    </div>
  );
}
