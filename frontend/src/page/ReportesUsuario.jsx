import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import clienteAxios from "../config/clienteAxios"
import useAuth from "../hooks/useAuth"
import LineaEvolucion from "../components/reportes/LineaEvolucion"

const ReportesUsuario = () => {
  const { id } = useParams()
  const { auth } = useAuth()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const esMiReporte = auth._id === id || auth._id?.toString() === id

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || !id) return
    const config = { headers: { Authorization: `Bearer ${token}` } }

    const cargar = async () => {
      setCargando(true)
      setError('')
      try {
        const res = await clienteAxios.get(`/reportes/usuario/${id}`, config)
        setDatos(res.data)
      } catch (err) {
        if (err.response?.status === 403) {
          setError('No tienes permiso para ver este reporte.')
        } else {
          setError('No se pudo cargar el reporte.')
        }
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id])

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
        <Link to="/proyectos/reportes" className="mt-3 text-xs text-indigo-500 hover:underline">
          Volver a Reportes
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-1">
        <Link to="/proyectos/reportes" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          Reportes
        </Link>
        <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-xs text-slate-500">Usuario</span>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {esMiReporte ? 'Mi rendimiento' : 'Rendimiento del usuario'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Productividad y métricas personales</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total asignadas', value: datos.total,       color: 'text-slate-800' },
          { label: 'Completadas',     value: datos.completadas, color: 'text-emerald-600' },
          { label: 'En progreso',     value: datos.enProgreso,  color: 'text-blue-600' },
          { label: 'Vencidas',        value: datos.vencidas,    color: 'text-red-500' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-2 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Ratio cumplimiento */}
      {datos.total > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">Tasa de completado</p>
            <span className="text-sm font-bold text-emerald-600">
              {Math.round((datos.completadas / datos.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.round((datos.completadas / datos.total) * 100)}%` }}
            />
          </div>
          {datos.tiempoPromedioResolucion && (
            <p className="text-xs text-slate-400 mt-2">
              Tiempo promedio de resolución: <span className="font-medium text-slate-600">{datos.tiempoPromedioResolucion}</span>
            </p>
          )}
        </div>
      )}

      {/* Productividad mensual */}
      {datos.productividadMensual?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <p className="text-sm font-semibold text-slate-700 mb-1">Productividad mensual (últimos 6 meses)</p>
          <p className="text-xs text-slate-400 mb-2">Tareas completadas por mes</p>
          <div className="h-44">
            <LineaEvolucion
              datos={datos.productividadMensual.map(m => ({
                mes: m.mes,
                creadas: 0,
                completadas: m.completadas,
                vencidas: 0,
              }))}
            />
          </div>
        </div>
      )}

      {datos.total === 0 && (
        <div className="flex flex-col items-center justify-center py-14 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">Sin tareas asignadas</p>
          <p className="text-xs text-slate-400 mt-1">Las métricas aparecerán cuando haya tareas asignadas</p>
        </div>
      )}
    </div>
  )
}

export default ReportesUsuario
