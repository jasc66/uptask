# Nexo — Gestor de Proyectos y Tareas

Monorepo gestionado con **pnpm workspaces** (`backend` + `frontend`).

## Requisitos

- Node.js >= 18
- pnpm >= 10 (la versión exacta está fijada en `packageManager`)

Si no tienes pnpm:

```bash
corepack enable
corepack prepare pnpm@10.10.0 --activate
```

o vía npm: `npm install -g pnpm@10.10.0`.

## Instalación

Desde la raíz del repo, **una sola vez**:

```bash
pnpm install
```

Esto instala las dependencias de los tres paquetes (`uptask`, `backend`, `frontend`) y genera un único `pnpm-lock.yaml` en la raíz.

## Desarrollo

```bash
pnpm dev              # backend + frontend en paralelo (concurrently)
pnpm dev:backend      # solo backend (nodemon)
pnpm dev:frontend     # solo frontend (vite)
```

## Build / Producción

```bash
pnpm build            # build del frontend (vite)
pnpm start            # arranca el backend en modo producción
```

También puedes apuntar a un workspace concreto:

```bash
pnpm --filter backend <script>
pnpm --filter frontend <script>
```

## Variables de entorno

### `backend/.env`
```
MONGO_URI=
JWT_SECRET=
PORT=4000
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
FRONTEND_URL=
```

### `frontend/.env`
```
VITE_BACKEND_URL=
```

## Despliegue

### Render (backend)

En el dashboard de Render, ajustar:

- **Root Directory**: dejar la raíz del repo (no `backend/`) para que detecte el workspace.
- **Build Command**:
  ```bash
  corepack enable && pnpm install --frozen-lockfile
  ```
- **Start Command**:
  ```bash
  pnpm --filter backend start
  ```

Render detecta `pnpm-lock.yaml` automáticamente si tiene Node 20+. Si no, forzar `corepack enable` en el build.

### Vercel (frontend)

Vercel autodetecta `pnpm-lock.yaml` y usa la versión fijada en `packageManager`. En la configuración del proyecto:

- **Root Directory**: `frontend`
- **Install Command** (auto): `pnpm install`
- **Build Command** (auto): `pnpm run build`
- **Output Directory**: `dist`

> Como el lockfile está en la raíz del monorepo, conviene ajustar el "Install Command" del proyecto Vercel a:
> ```bash
> cd .. && pnpm install --frozen-lockfile
> ```
> y el "Build Command" a `pnpm --filter frontend build`, dejando "Output Directory" en `dist`.

## Por qué pnpm

- **Seguridad**: `node_modules` no plano evita acceso a dependencias no declaradas (phantom deps).
- **Aprobación explícita de scripts**: los `postinstall` solo se ejecutan para paquetes listados en `pnpm.onlyBuiltDependencies` del `package.json` raíz.
- **Versión fija**: `packageManager: pnpm@10.10.0` asegura builds reproducibles en CI y local.

## Estructura

```
uptask/
├── pnpm-workspace.yaml      # workspaces (backend, frontend)
├── pnpm-lock.yaml           # único lockfile
├── package.json             # scripts globales + onlyBuiltDependencies
├── backend/                 # Express + Mongoose + Socket.IO
└── frontend/                # React 18 + Vite (SWC) + Tailwind
```
