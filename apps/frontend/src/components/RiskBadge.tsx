import type { RiskLevel } from "../app/types";

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const className =
    risk === "VERDE" ? "badge badge-green" : risk === "AMARILLO" ? "badge badge-yellow" : "badge badge-red";

  return (
    <span className={className}>
      <span className={`risk-dot ${risk === "VERDE" ? "risk-green" : risk === "AMARILLO" ? "risk-yellow" : "risk-red"}`} />
      {risk}
    </span>
  );
}
