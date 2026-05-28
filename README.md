# CasinoDesk v3

Migracion del prototipo original a una base full-stack con:

- `apps/frontend`: React + TypeScript + Vite
- `apps/backend/CasinoDesk.Api`: ASP.NET Core Web API

## Estado actual

- El prototipo original se mantiene intacto en la raiz como referencia visual y funcional.
- El frontend nuevo ya implementa:
  - login por rol,
  - dashboard operador,
  - buy-in y cash-out,
  - screening AML/PEP mock,
  - semaforo de riesgo,
  - alertas,
  - RTE,
  - ROS,
  - auditoria y sesion del cliente,
  - tema claro basado en tokens.
- El backend nuevo deja listos:
  - auth,
  - RBAC,
  - contratos principales,
  - endpoints del plan,
  - servicios mock de AML/PEP,
  - hashing de identificadores,
  - fraccionamiento,
  - RTE, ROS y auditoria en memoria.

## Ejecutar frontend

```bash
npm install
npm run dev
```

## Ejecutar backend

```bash
dotnet run --project .\apps\backend\CasinoDesk.Api
```

o usando el script:

```bash
npm run dev:api
```

Ese script fuerza la API en `http://localhost:5067`.

## Build frontend

```bash
npm run build
```

## Docker

Con Docker Desktop abierto, otra persona puede levantar todo con:

```bash
docker compose up --build
```

Puertos esperados:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5067`
- Swagger: `http://localhost:5067/swagger`

Si algo falla en compilacion o arranque, Docker mostrara el error directamente en consola durante `build` o `up`.

## Verificaciones realizadas

- `dotnet build .\apps\backend\CasinoDesk.Api -c Debug`
- `npm run build`
- arranque temporal del backend y validacion real de `POST /auth/login`

## Backend

El backend corre por defecto en `http://localhost:5067` y el frontend ya intenta conectarse a esa URL para login, transacciones, alertas, RTE, ROS y auditoria. Si la API no esta disponible, el frontend cae en el store local mock para no bloquear la demo.

Nota: `GET /` devuelve `404` y eso es normal. Usa `http://localhost:5067/swagger` o los endpoints `/auth`, `/transactions`, `/alerts`, etc.

```bash
dotnet run --project apps/backend/CasinoDesk.Api
```
