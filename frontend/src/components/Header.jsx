import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import clienteAxios from "../config/clienteAxios"
import useAuth from "../hooks/useAuth"
import useNotificaciones from "../hooks/useNotificaciones"

const ESTADO_COLOR = {
  'Pendiente':   'bg-slate-100 text-slate-600',
  'En Progreso': 'bg-blue-100 text-blue-700',
  'En Revisión': 'bg-amber-100 text-amber-700',
  'Completada':  'bg-emerald-100 text-emerald-700',
}

const TIPO_ICON = {
  mencion: '@',
  asignacion: '👤',
  cambio_estado: '✓',
  comentario: '💬',
  vencimiento: '⏰',
  dependencia_resuelta: '🔓',
}

const Header = ({ onMenuClick, onIniciarTour }) => {
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones() ?? {}
  const [searchOpen, setSearchOpen] = useState(false)
  const [consulta, setConsulta] = useState('')
  const [resultados, setResultados] = useState({ proyectos: [], tareas: [] })
  const [buscando, setBuscando] = useState(false)
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const [notiAbierto, setNotiAbierto] = useState(false)
  const debounceRef = useRef(null)
  const contenedorRef = useRef(null)
  const notiRef = useRef(null)

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    setAuth({})
  }

  // Debounce + fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const texto = consulta.trim()
    if (texto.length < 2) {
      setResultados({ proyectos: [], tareas: [] })
      setBuscando(false)
      return
    }
    setBuscando(true)
    debounceRef.current = setTimeout(async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setBuscando(false)
        return
      }
      try {
        const { data } = await clienteAxios.get(
          `/buscar?q=${encodeURIComponent(texto)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setResultados(data)
      } catch {
        setResultados({ proyectos: [], tareas: [] })
      } finally {
        setBuscando(false)
      }
    }, 250)
    return () => debounceRef.current && clearTimeout(debounceRef.current)
  }, [consulta])

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setDropdownAbierto(false)
      }
      if (notiRef.current && !notiRef.current.contains(e.target)) {
        setNotiAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const irA = (ruta) => {
    setDropdownAbierto(false)
    setConsulta('')
    setSearchOpen(false)
    navigate(ruta)
  }

  const tieneResultados = resultados.proyectos.length > 0 || resultados.tareas.length > 0
  const mostrarDropdown = dropdownAbierto && consulta.trim().length >= 2

  const Dropdown = () => (
    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
      {buscando && (
        <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" />
          </svg>
          Buscando…
        </div>
      )}

      {!buscando && !tieneResultados && (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-slate-400">Sin resultados para "{consulta}"</p>
        </div>
      )}

      {!buscando && resultados.proyectos.length > 0 && (
        <div>
          <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Proyectos</p>
          <ul>
            {resultados.proyectos.map(p => (
              <li key={p._id}>
                <button
                  onClick={() => irA(`/proyectos/${p._id}`)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color ?? '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.nombre}</p>
                    {p.cliente && <p className="text-xs text-slate-400 truncate">{p.cliente}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!buscando && resultados.tareas.length > 0 && (
        <div className={resultados.proyectos.length > 0 ? 'border-t border-slate-100' : ''}>
          <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tareas</p>
          <ul>
            {resultados.tareas.map(t => (
              <li key={t._id}>
                <button
                  onClick={() => irA(`/proyectos/${t.proyecto?._id}?tarea=${t._id}`)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{t.nombre}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {t.proyecto?.nombre ?? 'Sin proyecto'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${ESTADO_COLOR[t.estado] ?? 'bg-slate-100 text-slate-500'}`}>
                    {t.estado}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <header className="bg-white border-b border-slate-200 px-3 md:px-6 py-3 flex items-center gap-2 shrink-0">
      {/* Hamburger - mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Search - desktop */}
      <div ref={contenedorRef} className="flex-1 hidden sm:block">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onFocus={() => setDropdownAbierto(true)}
            placeholder="Buscar proyectos o tareas..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {mostrarDropdown && <Dropdown />}
        </div>
      </div>

      {/* Mobile: expanded search field */}
      {searchOpen && (
        <div ref={contenedorRef} className="flex-1 flex items-center gap-2 sm:hidden">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input
              autoFocus
              type="search"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              onFocus={() => setDropdownAbierto(true)}
              placeholder="Buscar proyectos o tareas..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {mostrarDropdown && <Dropdown />}
          </div>
          <button
            onClick={() => { setSearchOpen(false); setConsulta('') }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            aria-label="Cerrar búsqueda"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Mobile: spacer when search is collapsed */}
      {!searchOpen && <div className="flex-1 sm:hidden" />}

      {/* Mobile: search icon toggle */}
      {!searchOpen && (
        <button
          onClick={() => setSearchOpen(true)}
          className="sm:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          aria-label="Buscar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
        </button>
      )}

      {/* Notificaciones */}
      <div ref={notiRef} className="relative shrink-0">
        <button
          onClick={() => setNotiAbierto(v => !v)}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Notificaciones"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
          </svg>
          {noLeidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </button>

        {notiAbierto && (
          <div className="absolute right-0 mt-1 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-[28rem] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">Notificaciones</p>
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodasLeidas}
                  className="text-xs text-indigo-500 hover:text-indigo-700"
                >
                  Marcar todas leídas
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {(notificaciones?.length ?? 0) === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-slate-400">Sin notificaciones</p>
                </div>
              )}
              {notificaciones?.slice(0, 12).map(n => (
                <button
                  key={n._id}
                  onClick={() => {
                    marcarLeida(n._id)
                    setNotiAbierto(false)
                    if (n.proyecto?._id) {
                      const tareaParam = n.tarea?._id ? `?tarea=${n.tarea._id}` : ''
                      navigate(`/proyectos/${n.proyecto._id}${tareaParam}`)
                    }
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 transition-colors ${!n.leida ? 'bg-indigo-50/40' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base shrink-0" aria-hidden>
                      {TIPO_ICON[n.tipo] ?? '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{n.titulo}</p>
                      {n.mensaje && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.mensaje}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {n.proyecto?.nombre && <span>{n.proyecto.nombre} · </span>}
                        {new Date(n.createdAt).toLocaleString('es-MX', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {!n.leida && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-slate-100 px-4 py-2">
              <button
                onClick={() => { setNotiAbierto(false); navigate('/proyectos/notificaciones') }}
                className="w-full text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Ver todas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={cerrarSesion}
        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>

      {onIniciarTour && (
        <button
          onClick={onIniciarTour}
          title="Iniciar tour de bienvenida"
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
    </header>
  )
}

export default Header
