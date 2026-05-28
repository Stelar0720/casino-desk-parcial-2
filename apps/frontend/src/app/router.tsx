import type { ReactElement } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { LoginPage } from "../features/auth/LoginPage";
import { AlertsPage } from "../features/compliance/AlertsPage";
import { OfficialDashboardPage } from "../features/compliance/OfficialDashboardPage";
import { AdminOverviewPage } from "../features/dashboard/AdminOverviewPage";
import { DealerDashboardPage } from "../features/dashboard/DealerDashboardPage";
import { HistoryPage } from "../features/dashboard/HistoryPage";
import { OperatorDashboardPage } from "../features/dashboard/OperatorDashboardPage";
import { ProfilePage } from "../features/dashboard/ProfilePage";
import { RoleHomePage } from "../features/dashboard/RoleHomePage";
import { SessionPage } from "../features/dashboard/SessionPage";
import { SupervisorDashboardPage } from "../features/dashboard/SupervisorDashboardPage";
import { useAppStore } from "./store";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const session = useAppStore((state) => state.session);
  return session ? children : <Navigate to="/auth" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <LoginPage />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoleHomePage /> },
      { path: "cashier", element: <OperatorDashboardPage /> },
      { path: "dealer", element: <DealerDashboardPage /> },
      { path: "supervisor", element: <SupervisorDashboardPage /> },
      { path: "admin", element: <AdminOverviewPage /> },
      { path: "session", element: <SessionPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "official", element: <OfficialDashboardPage /> }
    ]
  }
]);
