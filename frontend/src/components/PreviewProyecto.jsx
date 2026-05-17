import { useState } from "react"
import { Link } from "react-router-dom"
import useProyectos from "../hooks/useProyectos"
import useAuth from "../hooks/useAuth"

const badgeFecha = (fechaEntrega) => {
  if (!fechaEntrega) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const entrega = new Date(fechaEntrega)
  entrega.setHours(0, 0, 0, 0)
  const diff = Math.ceil((entrega - hoy) / (1000 * 60 * 60 * 24))

  if (diff < 0) return { label: 'Vencido', cls: 'bg-red-100 text-red-700' }
  if (diff <= 7) return { label: `${diff}d restantes`, cls: 'bg-amber-100 text-amber-700' }
  return {
    label: entrega.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
    cls: 'bg-emerald-100 text-emerald-700',
  }
}

const PreviewProyecto = ({ proyecto }) => {
  const { nombre, cliente, fechaEntrega, color, _id } = proyecto
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

  const { handleModalEditarProyecto, eliminarProyecto } = useProyectos()
  const { auth } = useAuth()

  const badge = badgeFecha(fechaEntrega)
  const accentColor = color ?? '#6366f1'

  const esCreadorDelProyecto = proyecto.creador?.toString() === auth._id?.toString()
  const puedeAdministrar = auth.rol === 'admin' || esCreadorDelProyecto

  const rolBadge = esCreadorDelProyecto
    ? { label: 'Creador', cls: 'bg-indigo-100 text-indigo-700' }
    : auth.rol === 'admin'
    ? { label: 'Admin', cls: 'bg-violet-100 text-violet-700' }
    : { label: 'Colaborador', cls: 'bg-slate-100 text-slate-500' }

  const totalTareas = proyecto.tareas?.length ?? 0
  const tareasCompletadas = proyecto.tareas?.filter(t => t.estado === 'Completada').length ?? 0
  const progresoPct = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Franja de color superior */}
      <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header de la card */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: `${accentColor}22` }}>
              <span className="text-sm font-bold" style={{ color: accentColor }}>
                {nombre?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm truncate">{nombre}</h3>
              <p className="text-xs text-slate-400 truncate">{cliente}</p>
            </div>
          </div>

          {/* Badge rol + Menú ⋯ */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rolBadge.cls}`}>
              {rolBadge.label}
            </span>

            {puedeAdministrar && (
              <div className="relative">
                <button
                  onClick={() => setMenuAbierto(!menuAbierto)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>

                {menuAbierto && (
                  <div className="absolute right-0 top-7 z-10 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-36">
                    <button
                      onClick={() => { handleModalEditarProyecto(proyecto); setMenuAbierto(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => { setConfirmarEliminar(true); setMenuAbierto(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Badge fecha + contador de tareas */}
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          {badge && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${badge.cls}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {badge.label}
            </span>
          )}
          {totalTareas > 0 && (
            <span className="text-xs text-slate-500 shrink-0">
              {tareasCompletadas}/{totalTareas} tareas
            </span>
          )}
        </div>

        {/* Barra de progreso */}
        {totalTareas > 0 && (
          <div className="mb-3">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progresoPct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                style={{ width: `${progresoPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Confirmar eliminación inline */}
        {confirmarEliminar && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700 font-medium mb-2">¿Eliminar este proyecto?</p>
            <div className="flex gap-2">
              <button
                onClick={() => eliminarProyecto(_id)}
                className="flex-1 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >Eliminar</button>
              <button
                onClick={() => setConfirmarEliminar(false)}
                className="flex-1 py-1.5 text-xs font-semibold bg-white text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >Cancelar</button>
            </div>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-slate-100">
          <Link
            to={`${_id}`}
            className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Ver proyecto
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Cierra menú al hacer click fuera */}
      {menuAbierto && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuAbierto(false)} />
      )}
    </div>
  )
}

export default PreviewProyecto
