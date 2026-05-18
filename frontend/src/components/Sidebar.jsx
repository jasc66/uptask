import { NavLink } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import useProyectos from "../hooks/useProyectos"

const Sidebar = () => {
  const { auth } = useAuth()
  const { handleModalFormulario } = useProyectos()

  const iniciales = auth.nombre
    ? auth.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-slate-800 text-indigo-400'
        : 'text-slate-400 hover:text-white hover:bg-white/10'
    }`

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">Nexo</span>
      </div>

      {/* Avatar usuario */}
      <div className="flex items-center gap-3 mx-4 mt-5 mb-3 px-3 py-2.5 bg-slate-800 rounded-xl">
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{iniciales}</span>
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{auth.nombre}</p>
          <p className="text-[12px] truncate" style={{ color: '#a0aec0' }}>{auth.email}</p>
        </div>
      </div>

      <hr className="border-white/10 mx-4 mb-2" />

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-4">
        <NavLink to="/proyectos" end className={navClass}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Inicio
        </NavLink>
        <NavLink to="/proyectos/mis-tareas" className={navClass}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Mis tareas
        </NavLink>
      </nav>

      {/* Admin */}
      {auth.rol === 'admin' && (
        <>
          <hr className="border-white/10 mx-4 my-2" />
          <p className="text-[10px] text-slate-500 uppercase tracking-widest px-3 mb-1">Administración</p>
          <NavLink to="/proyectos/admin-usuarios" className={navClass}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Usuarios
          </NavLink>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Botón nuevo proyecto */}
      <div className="px-4 pb-6">
        <button
          onClick={handleModalFormulario}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Proyecto
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
