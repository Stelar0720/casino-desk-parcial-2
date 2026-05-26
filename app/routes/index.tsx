import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="page-shell">
      <section className="panel">
        <p className="eyebrow">Casino Desk</p>
        <h1>Proyecto listo para ejecutar</h1>
        <p>
          La estructura base de TanStack Start ya esta configurada. Desde aqui
          puedes reconstruir las pantallas del parcial sobre rutas en
          <code>app/routes</code>.
        </p>
      </section>
    </main>
  );
}
