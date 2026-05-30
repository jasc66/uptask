import { NavLink } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import useProyectos from "../hooks/useProyectos"
import useNotificaciones from "../hooks/useNotificaciones"

const Sidebar = ({ isOpen, onClose }) => {
  const { auth } = useAuth()
  const { handleModalFormulario } = useProyectos()
  const { noLeidas = 0 } = useNotificaciones() ?? {}

  const iniciales = auth.nombre
    ? auth.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-slate-800 text-indigo-400'
        : 'text-slate-400 hover:text-white hover:bg-white/10'
    }`

  const handleNavClick = () => {
    onClose?.()
  }

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900
      transform transition-transform duration-300 ease-in-out
      md:relative md:translate-x-0 md:shrink-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Nexo</span>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Cerrar menú"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
        <NavLink to="/proyectos" end className={navClass} onClick={handleNavClick}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Inicio
        </NavLink>
        <NavLink to="/proyectos/mis-tareas" className={navClass} onClick={handleNavClick}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Mis tareas
        </NavLink>
        <NavLink to="/proyectos/notificaciones" className={navClass} onClick={handleNavClick}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
          </svg>
          <span className="flex-1">Notificaciones</span>
          {noLeidas > 0 && (
            <span className="min-w-[1.1rem] h-[1.1rem] px-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </NavLink>
        <NavLink to="/proyectos/reportes" end className={navClass} onClick={handleNavClick}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Reportes
        </NavLink>
        <NavLink to="/proyectos/reportes/guardados" className={navClass} onClick={handleNavClick}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Personalizados
        </NavLink>
        <NavLink to="/proyectos/reportes/programados" className={navClass} onClick={handleNavClick}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Programados
        </NavLink>
      </nav>

      {/* Admin */}
      {auth.rol === 'admin' && (
        <>
          <hr className="border-white/10 mx-4 my-2" />
          <p className="text-[10px] text-slate-500 uppercase tracking-widest px-3 mb-1">Administración</p>
          <nav className="px-4">
            <NavLink to="/proyectos/admin-usuarios" className={navClass} onClick={handleNavClick}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Usuarios
            </NavLink>
          </nav>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Botón nuevo proyecto */}
      <div className="px-4 pb-6">
        <button
          onClick={() => { handleModalFormulario(); onClose?.() }}
          className="flex items-center justify-center gap-2 w-full min-h-[44px] py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
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
