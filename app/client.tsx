import { StartClient } from "@tanstack/start/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

function ClientEntry() {
  return (
    <StrictMode>
      <StartClient />
    </StrictMode>
  );
}

hydrateRoot(document, <ClientEntry />);

export default ClientEntry;
