import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import clienteAxios from "../config/clienteAxios"
import useSocket from "../hooks/useSocket"
import BarrasEstado from "../components/reportes/BarrasEstado"
import BarrasPrioridad from "../components/reportes/BarrasPrioridad"
import ExportMenu from "../components/reportes/ExportMenu"
import RealtimeBadge from "../components/reportes/RealtimeBadge"

const ROL_COLOR = {
  creador: 'bg-indigo-100 text-indigo-700',
  editor:  'bg-blue-100 text-blue-700',
  lector:  'bg-slate-100 text-slate-600',
}

const TIPO_ACTIVIDAD = {
  comentario:          { icon: '💬', label: 'Comentó' },
  cambio_estado:       { icon: '🔄', label: 'Cambió estado' },
  cambio_responsable:  { icon: '👤', label: 'Asignó responsable' },
}

const ReportesProyecto = ({ proyectoId, embedded = false }) => {
  const params = useParams()
  const id = proyectoId || params.id
  const reporteRef = useRef(null)
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const [wsConectado, setWsConectado] = useState(false)

  const cargar = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token || !id) return
    const config = { headers: { Authorization: `Bearer ${token}` } }
    setCargando(true)
    setError('')
    try {
      const res = await clienteAxios.get(`/reportes/proyecto/${id}`, config)
      setDatos(res.data)
      setUltimaActualizacion(Date.now())
    } catch {
      setError('No se pudo cargar el reporte de este proyecto.')
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Coalesce ráfagas de eventos socket — evita re-render por cada cambio
  const debounceTimer = useRef(null)
  const recargarDebounced = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => cargar(), 400)
  }, [cargar])

  useEffect(() => () => debounceTimer.current && clearTimeout(debounceTimer.current), [])

  const socketRef = useSocket({
    proyectoId: id,
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

  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-100 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-20 mb-3" />
              <div className="h-7 bg-slate-100 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-medium text-slate-600">{error}</p>
        {!embedded && (
          <Link to="/proyectos/reportes" className="mt-3 text-xs text-indigo-500 hover:underline">
            Volver a Reportes
          </Link>
        )}
      </div>
    )
  }

  const datosExport = {
    resumen: { avancePct: datos.avancePct, totalTareas: datos.totalTareas, completadas: datos.completadas },
    tareasPorEstado: datos.tareasPorEstado,
    tareasPorPrioridad: datos.tareasPorPrioridad,
    colaboradores: datos.colaboradores,
  }

  return (
    <div ref={reporteRef}>
      {!embedded && (
        <>
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Link to="/proyectos/reportes" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Reportes
            </Link>
            <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-xs text-slate-500">Proyecto</span>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Reporte del proyecto</h1>
              <p className="text-sm text-slate-500 mt-0.5">Métricas de avance y actividad del equipo</p>
            </div>
            <div className="flex items-center gap-3">
              <RealtimeBadge ultimaActualizacion={ultimaActualizacion} conectado={wsConectado} />
              <ExportMenu
                containerRef={reporteRef}
                datos={datosExport}
                tipo="proyecto"
                nombreArchivo="Nexo-Reporte-Proyecto"
              />
            </div>
          </div>
        </>
      )}

      {embedded && (
        <div className="flex items-center justify-end gap-3 mb-3">
          <RealtimeBadge ultimaActualizacion={ultimaActualizacion} conectado={wsConectado} />
          <ExportMenu
            containerRef={reporteRef}
            datos={datosExport}
            tipo="proyecto"
            nombreArchivo="Nexo-Reporte-Proyecto"
          />
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Avance', value: `${datos.avancePct}%`, color: 'text-indigo-600' },
          { label: 'Total tareas', value: datos.totalTareas, color: 'text-slate-800' },
          { label: 'Completadas', value: datos.completadas, color: 'text-emerald-600' },
          { label: 'Pendientes', value: datos.totalTareas - datos.completadas, color: 'text-amber-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-2 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de avance */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">Avance general</p>
          <span className="text-sm font-bold text-indigo-600">{datos.avancePct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-3 rounded-full transition-all duration-700"
            style={{ width: `${datos.avancePct}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          {datos.tareasPorEstado.map(({ estado, count }) => (
            <span key={estado} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
              {estado}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-1">Tareas por estado</p>
          <div className="h-44 mt-2">
            <BarrasEstado datos={datos.tareasPorEstado} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-1">Tareas por prioridad</p>
          <div className="h-44 mt-2">
            <BarrasPrioridad datos={datos.tareasPorPrioridad} />
          </div>
        </div>
      </div>

      {/* Colaboradores */}
      {datos.colaboradores.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Colaboradores</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {datos.colaboradores.map(c => (
              <li key={c.usuario._id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-indigo-600">
                    {c.usuario.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{c.usuario.nombre}</p>
                  <p className="text-xs text-slate-400">{c.usuario.email}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROL_COLOR[c.rol] ?? ROL_COLOR.editor}`}>
                  {c.rol}
                </span>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-500">{c.asignadas} asignadas</p>
                  <p className="text-xs text-emerald-500">{c.completadas} completadas</p>
                </div>
                {c.vencidas > 0 && (
                  <span className="text-xs font-medium text-red-500 hidden sm:inline">{c.vencidas} vencidas</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actividad reciente */}
      {datos.actividadReciente.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Actividad reciente</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {datos.actividadReciente.map((a, i) => {
              const meta = TIPO_ACTIVIDAD[a.tipo] ?? { icon: '•', label: a.tipo }
              return (
                <li key={i} className="flex items-start gap-3 px-6 py-3.5">
                  <span className="text-base shrink-0 mt-0.5">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{a.usuario?.nombre ?? 'Alguien'}</span>
                      {' '}{meta.label.toLowerCase()} en{' '}
                      <span className="font-medium">{a.tarea}</span>
                    </p>
                    {a.contenido && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{a.contenido}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(a.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {datos.actividadReciente.length === 0 && datos.colaboradores.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">Aún no hay actividad registrada</p>
        </div>
      )}
    </div>
  )
}

export default ReportesProyecto
