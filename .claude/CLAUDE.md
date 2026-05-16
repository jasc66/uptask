# Nexo — Gestor de Proyectos y Tareas

## Descripción del proyecto

**Nexo** es una aplicación web full-stack para gestión de proyectos y tareas colaborativas. Permite a usuarios registrarse, crear proyectos, asignar tareas y colaborar en equipo. Anteriormente llamada "MAG" — el nuevo nombre es **Nexo** en todos los archivos y UI.

## Stack tecnológico

### Frontend
- **React 18** + **Vite** (SWC)
- **TailwindCSS 3.3** — utilidades CSS
- **React Router DOM 6** — enrutamiento
- **Axios** — cliente HTTP

### Backend
- **Node.js + Express** (ESM modules)
- **MongoDB + Mongoose** — base de datos
- **JWT (jsonwebtoken)** — autenticación
- **bcrypt** — hash de contraseñas
- **nodemailer** — confirmación de cuenta y recuperación de contraseña

## Estructura de carpetas

```
uptask/
├── backend/
│   ├── config/db.js              # Conexión MongoDB
│   ├── contollers/               # (typo intencional en el original)
│   │   ├── usuarioController.js
│   │   ├── proyectoController.js
│   │   └── tareaController.js
│   ├── helpers/
│   │   ├── email.js              # nodemailer — envío de emails
│   │   ├── generarId.js          # UUID helper
│   │   └── generarJWT.js         # Firma JWT
│   ├── middleware/checkAuth.js   # Verificación de token JWT
│   ├── models/
│   │   ├── Usuario.js
│   │   ├── Proyecto.js
│   │   └── Tarea.js
│   ├── routes/
│   │   ├── usuarioRoutes.js
│   │   ├── proyectoRoutes.js
│   │   └── tareaRoutes.js
│   └── index.js                  # Entry point Express
│
└── frontend/
    └── src/
        ├── App.jsx               # Rutas principales
        ├── layouts/
        │   ├── AuthLayout.jsx    # Layout para rutas públicas
        │   └── RutaProtegida.jsx # Layout para rutas autenticadas
        ├── page/
        │   ├── Login.jsx
        │   ├── Registrar.jsx
        │   ├── OlvidePassword.jsx
        │   ├── NuevoPassword.jsx
        │   ├── ConfirmarCuenta.jsx
        │   ├── Proyectos.jsx
        │   ├── NuevoProyecto.jsx
        │   ├── Proyecto.jsx
        │   └── EditarProyecto.jsx
        ├── context/
        │   ├── AuthProvider.jsx  # Estado global de autenticación
        │   └── ProyectosProvider.jsx
        ├── components/
        │   ├── Header.jsx        # Barra de navegación (autenticado)
        │   ├── Sidebar.jsx
        │   ├── Alerta.jsx        # Componente de alertas/errores
        │   ├── FormularioProyecto.jsx
        │   └── PreviewProyecto.jsx
        ├── hooks/
        │   ├── useAuth.jsx
        │   └── useProyectos.jsx
        └── config/
            └── clienteAxios.jsx  # Instancia Axios con baseURL

```

## Paleta de colores (Nexo)

- **Primario**: `indigo-600` / `#6366f1`
- **Oscuro**: `slate-900` / `indigo-950` / `violet-950`
- **Texto**: `slate-700`, `slate-900`
- **Fondo inputs**: `slate-50`
- **Alertas error**: rojo gradient | **Alertas éxito**: sky gradient

## Autenticación

- JWT almacenado en `localStorage` bajo la clave `token`
- El contexto `AuthProvider` verifica el token al montar con `/usuarios/perfil`
- Rutas protegidas manejadas por `RutaProtegida.jsx`
- Flujo: Registro → Email confirmación → Confirmar cuenta → Login → Dashboard

## Convenciones

- Código en español (variables, rutas, labels)
- Componentes en PascalCase, hooks con prefijo `use`
- Los controllers están en `contollers/` (typo heredado — no renombrar sin actualizar imports)
- ESM modules en backend (`"type": "module"`)

## Comandos

```bash
# Desarrollo (desde raíz)
npm run dev          # Ejecuta backend + frontend con concurrently

# Backend solo
cd backend && npm run dev

# Frontend solo
cd frontend && npm run dev
```

## Variables de entorno

### Backend `.env`
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

### Frontend `.env`
```
VITE_BACKEND_URL=
```
