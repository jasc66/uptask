import { useState, useEffect, useRef, useCallback } from "react"
import { Link } from "react-router-dom"
import clienteAxios from "../config/clienteAxios"
import useAuth from "../hooks/useAuth"
import useSocket from "../hooks/useSocket"
import BarrasEstado from "../components/reportes/BarrasEstado"
import LineaEvolucion from "../components/reportes/LineaEvolucion"
import DonutPrioridad from "../components/reportes/DonutPrioridad"
import TablaCargaUsuarios from "../components/reportes/TablaCargaUsuarios"
import ExportMenu from "../components/reportes/ExportMenu"
import RealtimeBadge from "../components/reportes/RealtimeBadge"

const PERIODOS = [
  { label: 'Esta semana', value: '7' },
  { label: 'Este mes',    value: '30' },
  { label: 'Últimos 3m',  value: '90' },
  { label: 'Todo',        value: 'all' },
]

const KpiCard = ({ label, value, sub, color = 'indigo', carga }) => {
  const colores = {
    indigo:  'text-indigo-600',
    emerald: 'text-emerald-600',
    red:     'text-red-500',
    amber:   'text-amber-500',
    slate:   'text-slate-500',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {carga ? (
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-slate-100 rounded w-24" />
          <div className="h-7 bg-slate-100 rounded w-16 mt-3" />
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${colores[color]}`}>{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </>
      )}
    </div>
  )
}

const ChartCard = ({ titulo, descripcion, altura = 'h-48', children }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5">
    <p className="text-sm font-semibold text-slate-700">{titulo}</p>
    {descripcion && <p className="text-xs text-slate-400 mb-3">{descripcion}</p>}
    <div className={`${altura} mt-2`}>
      {children}
    </div>
  </div>
)

const Reportes = () => {
  const { auth } = useAuth()
  const reporteRef = useRef(null)
  const [periodo, setPeriodo] = useState('all')
  const [kpis, setKpis] = useState(null)
  const [proyectos, setProyectos] = useState([])
  const [porEstado, setPorEstado] = useState([])
  const [porPrioridad, setPorPrioridad] = useState([])
  const [evolucion, setEvolucion] = useState([])
  const [cargaUsuarios, setCargaUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const [wsConectado, setWsConectado] = useState(false)

  const cargar = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    const config = { headers: { Authorization: `Bearer ${token}` } }
    setCargando(true)
    setError('')
    try {
      const [resKpis, resProyectos, resEstado, resPrioridad, resEvolucion, resCarga] = await Promise.all([
        clienteAxios.get('/reportes/kpis', config),
        clienteAxios.get('/reportes/proyectos-resumen', config),
        clienteAxios.get('/reportes/tareas-por-estado', config),
        clienteAxios.get('/reportes/tareas-por-prioridad', config),
        clienteAxios.get('/reportes/evolucion-mensual?meses=6', config),
        clienteAxios.get('/reportes/carga-usuarios', config),
      ])
      setKpis(resKpis.data)
      setProyectos(resProyectos.data)
      setPorEstado(resEstado.data)
      setPorPrioridad(resPrioridad.data)
      setEvolucion(resEvolucion.data)
      setCargaUsuarios(resCarga.data)
      setUltimaActualizacion(Date.now())
    } catch {
      setError('No se pudieron cargar los datos del reporte.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Coalesce ráfagas de eventos socket — evita re-render por cada tarea actualizada
  const debounceTimer = useRef(null)
  const recargarDebounced = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => cargar(), 400)
  }, [cargar])

  useEffect(() => () => debounceTimer.current && clearTimeout(debounceTimer.current), [])

  const socketRef = useSocket({
    onEvento: recargarDebounced,
  })

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    const onConnect = () => setWsConectado(true)
    const onDisconnect = () => setWsConectado(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    if (socket.connected) setWsConectado(true)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [socketRef.current])

  return (
    <div ref={reporteRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Vista global · {auth.rol === 'admin' ? 'Todos los proyectos' : 'Tus proyectos'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <RealtimeBadge ultimaActualizacion={ultimaActualizacion} conectado={wsConectado} />
          <Link
            to="/proyectos/reportes/guardados"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Personalizados
          </Link>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {PERIODOS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  periodo === p.value
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <ExportMenu
            containerRef={reporteRef}
            datos={{ kpis, proyectos, porEstado, porPrioridad, evolucion, cargaUsuarios }}
            tipo="global"
            nombreArchivo="Nexo-Reportes-Global"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total proyectos"     value={kpis?.totalProyectos}               color="indigo"  carga={cargando} />
        <KpiCard label="Proyectos activos"   value={kpis?.proyectosActivos}             color="emerald" carga={cargando} />
        <KpiCard label="Proyectos atrasados" value={kpis?.proyectosAtrasados}           color="red"     carga={cargando} />
        <KpiCard label="% Cumplimiento"      value={kpis ? `${kpis.cumplimientoPct}%` : null} color="indigo" carga={cargando} />
        <KpiCard label="Tareas pendientes"   value={kpis?.tareasPendientes}             color="amber"   carga={cargando} />
        <KpiCard label="Tareas vencidas"     value={kpis?.tareasVencidas}               color="red"     carga={cargando} />
        <KpiCard label="Completadas (7d)"    value={kpis?.tareasCompletadasSemana}      color="emerald" sub="esta semana" carga={cargando} />
        <KpiCard label="Vencidas (7d)"       value={kpis?.tareasVencidaSemana}          color="amber"   sub="esta semana" carga={cargando} />
      </div>

      {/* Fila principal de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard titulo="Tareas por estado" descripcion="Distribución actual de todas las tareas" altura="h-52">
          {cargando
            ? <div className="w-full h-full bg-slate-50 rounded-lg animate-pulse" />
            : <BarrasEstado datos={porEstado} />
          }
        </ChartCard>

        <ChartCard titulo="Evolución mensual" descripcion="Creadas, completadas y vencidas — últimos 6 meses" altura="h-52">
          {cargando
            ? <div className="w-full h-full bg-slate-50 rounded-lg animate-pulse" />
            : <LineaEvolucion datos={evolucion} />
          }
        </ChartCard>
      </div>

      {/* Fila secundaria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard titulo="Distribución por prioridad" altura="h-52">
          {cargando
            ? <div className="w-full h-full bg-slate-50 rounded-lg animate-pulse" />
            : <DonutPrioridad datos={porPrioridad} />
          }
        </ChartCard>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-1">Carga por usuario</p>
          <p className="text-xs text-slate-400 mb-4">Tareas abiertas por responsable</p>
          <TablaCargaUsuarios datos={cargaUsuarios} cargando={cargando} />
        </div>
      </div>

      {/* Tabla proyectos */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Resumen de proyectos</span>
          {!cargando && (
            <span className="text-xs text-slate-400">{proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {cargando ? (
          <div className="divide-y divide-slate-100">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="h-3 bg-slate-100 rounded flex-1" />
                <div className="h-3 bg-slate-100 rounded w-16" />
                <div className="h-3 bg-slate-100 rounded w-12" />
              </div>
            ))}
          </div>
        ) : proyectos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">Sin proyectos aún</p>
            <p className="text-xs text-slate-400 mt-1">Crea tu primer proyecto para ver métricas aquí</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_100px] px-6 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide border-b border-slate-50">
              <span>Proyecto</span>
              <span className="text-center">Total</span>
              <span className="text-center">Completadas</span>
              <span className="text-center">Atrasadas</span>
              <span className="text-center">Progreso</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {proyectos.map(p => (
                <li key={p.proyecto._id}>
                  <Link
                    to={`/proyectos/${p.proyecto._id}`}
                    className="grid grid-cols-1 md:grid-cols-[1fr_80px_80px_80px_100px] items-center gap-2 px-6 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.proyecto.color ?? '#6366f1' }}
                      />
                      <span className="text-sm font-medium text-slate-800 truncate">{p.proyecto.nombre}</span>
                      {p.proyecto.fechaEntrega && (
                        <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">
                          {new Date(p.proyecto.fechaEntrega).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-center text-slate-600 hidden md:block">{p.totalTareas}</span>
                    <span className="text-sm text-center text-emerald-600 font-medium hidden md:block">{p.completadas}</span>
                    <span className={`text-sm text-center font-medium hidden md:block ${p.atrasadas > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {p.atrasadas}
                    </span>
                    <div className="items-center gap-2 hidden md:flex justify-center">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-[60px]">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${p.progresoPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{p.progresoPct}%</span>
                    </div>
                    <div className="flex items-center gap-3 md:hidden text-xs text-slate-500">
                      <span>{p.completadas}/{p.totalTareas} tareas</span>
                      {p.atrasadas > 0 && <span className="text-red-500">{p.atrasadas} atrasadas</span>}
                      <span className="ml-auto font-semibold text-indigo-600">{p.progresoPct}%</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

export default Reportes
