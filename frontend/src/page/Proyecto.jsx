import { useEffect } from "react"
import { useParams } from "react-router-dom"
import useProyectos from "../hooks/useProyectos"
import Modal from "../components/Modal"
import FormularioTarea from "../components/FormularioTarea"
import Alerta from "../components/Alerta"

const PRIORIDAD_COLOR = {
  Alta: 'bg-red-100 text-red-700',
  Media: 'bg-amber-100 text-amber-700',
  Baja: 'bg-emerald-100 text-emerald-700',
}

const Proyecto = () => {
  const params = useParams()
  const {
    obtenerProyecto,
    proyecto,
    cargando,
    handleModalEditarProyecto,
    modalFormularioTarea,
    handleModalTarea,
    handleModalEditarTarea,
    eliminarTarea,
    alerta,
  } = useProyectos()

  useEffect(() => {
    obtenerProyecto(params.id)
  }, [])

  if (cargando) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-1/4" />
    </div>
  )

  const { nombre, descripcion, cliente, fechaEntrega, color, tareas } = proyecto

  const { msg } = alerta

  return (
    <div>
      {msg && <div className="mb-4"><Alerta alerta={alerta} /></div>}

      {/* Header del proyecto */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color ?? '#6366f1'}22` }}
          >
            <span className="font-bold text-lg" style={{ color: color ?? '#6366f1' }}>
              {nombre?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-800 truncate">{nombre}</h1>
            <p className="text-sm text-slate-400">{cliente}</p>
          </div>
        </div>

        <button
          onClick={() => handleModalEditarProyecto(proyecto)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Editar proyecto
        </button>
      </div>

      {/* Info del proyecto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Descripción</p>
          <p className="text-sm text-slate-700">{descripcion}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Cliente</p>
          <p className="text-sm font-semibold text-slate-800">{cliente}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Fecha de entrega</p>
          <p className="text-sm font-semibold text-slate-800">
            {fechaEntrega ? new Date(fechaEntrega).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      {/* Tareas */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Tareas</h2>
          <button
            onClick={handleModalTarea}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar tarea
          </button>
        </div>

        {tareas?.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {tareas.map(tarea => (
              <li key={tarea._id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{tarea.nombre}</p>
                  <p className="text-xs text-slate-400 truncate">{tarea.descripcion}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORIDAD_COLOR[tarea.prioridad] ?? 'bg-slate-100 text-slate-600'}`}>
                    {tarea.prioridad}
                  </span>
                  <button
                    onClick={() => handleModalEditarTarea(tarea)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => eliminarTarea(tarea._id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No hay tareas en este proyecto aún</p>
        )}
      </div>

      {modalFormularioTarea && (
        <Modal titulo="Tarea" onClose={handleModalTarea}>
          <FormularioTarea />
        </Modal>
      )}
    </div>
  )
}

export default Proyecto
