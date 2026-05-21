import { useState, useEffect, useCallback, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import clienteAxios from "../config/clienteAxios"
import useAuth from "../hooks/useAuth"
import PreviewReporte from "../components/reportes/PreviewReporte"

const VISIBILIDAD_LABEL = {
  privado: { label: 'Privado', color: 'bg-slate-100 text-slate-600' },
  equipo: { label: 'Equipo', color: 'bg-blue-100 text-blue-700' },
  organizacion: { label: 'Organización', color: 'bg-emerald-100 text-emerald-700' },
}

const FUENTE_LABEL = {
  tareas: 'Tareas',
  proyectos: 'Proyectos',
  usuarios: 'Usuarios',
}

const ReportesGuardados = () => {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const [reportes, setReportes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [datosSeleccionado, setDatosSeleccionado] = useState(null)
  const [cargandoDatos, setCargandoDatos] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)

  const token = localStorage.getItem('token')
  const authConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const { data } = await clienteAxios.get('/reportes/guardados', authConfig)
      setReportes(data)
      if (data.length > 0 && !seleccionado) setSeleccionado(data[0])
    } catch (e) {
      setError(e.response?.data?.msg ?? 'No se pudieron cargar los reportes guardados')
    } finally {
      setCargando(false)
    }
  }, [authConfig, seleccionado])

  useEffect(() => { cargar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar datos del reporte seleccionado
  useEffect(() => {
    if (!seleccionado?._id) return
    const run = async () => {
      setCargandoDatos(true)
      setDatosSeleccionado(null)
      try {
        const { data } = await clienteAxios.get(`/reportes/guardados/${seleccionado._id}/datos`, authConfig)
        setDatosSeleccionado(data)
      } catch {
        setDatosSeleccionado(null)
      } finally {
        setCargandoDatos(false)
      }
    }
    run()
  }, [seleccionado?._id, authConfig])

  const eliminar = async () => {
    if (!confirmarEliminar) return
    try {
      await clienteAxios.delete(`/reportes/guardados/${confirmarEliminar._id}`, authConfig)
      setReportes((rs) => rs.filter((r) => r._id !== confirmarEliminar._id))
      if (seleccionado?._id === confirmarEliminar._id) setSeleccionado(null)
      setConfirmarEliminar(null)
    } catch (e) {
      setError(e.response?.data?.msg ?? 'No se pudo eliminar el reporte')
      setConfirmarEliminar(null)
    }
  }

  const puedeEditar = (reporte) =>
    auth.rol === 'admin' || (reporte.owner?._id ?? reporte.owner)?.toString() === auth._id?.toString()

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/proyectos/reportes" className="hover:text-indigo-600">Reportes</Link>
            <span>/</span>
            <span>Personalizados</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes personalizados</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Construye, guarda y comparte reportes ad-hoc sobre tareas, proyectos y usuarios.
          </p>
        </div>
        <button
          onClick={() => navigate('/proyectos/reportes/builder')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo reporte
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      ) : reportes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-700">Aún no hay reportes personalizados</p>
          <p className="text-sm text-slate-500 mt-1 max-w-md">
            Crea tu primer reporte ad-hoc combinando fuente, métricas, filtros y visualización.
          </p>
          <button
            onClick={() => navigate('/proyectos/reportes/builder')}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Crear reporte
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Lista */}
          <div className="space-y-2">
            {reportes.map((r) => {
              const activo = seleccionado?._id === r._id
              const vis = VISIBILIDAD_LABEL[r.visibilidad] ?? VISIBILIDAD_LABEL.privado
              return (
                <button
                  key={r._id}
                  type="button"
                  onClick={() => setSeleccionado(r)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    activo
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{r.nombre}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${vis.color} shrink-0`}>
                      {vis.label}
                    </span>
                  </div>
                  {r.descripcion && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{r.descripcion}</p>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded">
                      {FUENTE_LABEL[r.fuente] ?? r.fuente}
                    </span>
                    <span>·</span>
                    <span className="truncate">{r.owner?.nombre ?? 'Usuario'}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Detalle */}
          {seleccionado ? (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-800 truncate">{seleccionado.nombre}</h2>
                  {seleccionado.descripcion && (
                    <p className="text-sm text-slate-500 mt-0.5">{seleccionado.descripcion}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>Fuente: <span className="text-slate-600 font-medium">{FUENTE_LABEL[seleccionado.fuente]}</span></span>
                    <span>·</span>
                    <span>Owner: {seleccionado.owner?.nombre}</span>
                    <span>·</span>
                    <span>Actualizado: {new Date(seleccionado.updatedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                {puedeEditar(seleccionado) && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => navigate(`/proyectos/reportes/builder/${seleccionado._id}`)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmarEliminar(seleccionado)}
                      className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
              <div className="p-5">
                <PreviewReporte
                  datos={datosSeleccionado}
                  visualizacion={seleccionado.visualizacion}
                  cargando={cargandoDatos}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center text-sm text-slate-400">
              Selecciona un reporte para verlo.
            </div>
          )}
        </div>
      )}

      {/* Modal eliminar */}
      {confirmarEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <p className="text-base font-bold text-slate-800">Eliminar reporte</p>
            <p className="text-sm text-slate-500 mt-1">
              ¿Eliminar definitivamente <span className="font-semibold text-slate-700">{confirmarEliminar.nombre}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmarEliminar(null)}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={eliminar}
                className="px-3 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportesGuardados
