import { Link } from "react-router-dom"
import useProyectos from "../hooks/useProyectos"
import useAuth from "../hooks/useAuth"
import PreviewProyecto from "../components/PreviewProyecto"

const ESTADO_COLOR = {
  'Pendiente':   'bg-slate-100 text-slate-500',
  'En Progreso': 'bg-blue-100 text-blue-700',
  'En Revisión': 'bg-amber-100 text-amber-700',
  'Completada':  'bg-emerald-100 text-emerald-700',
}

const Proyectos = () => {
  const { proyectos, handleModalFormulario, misTareas } = useProyectos()
  const { auth } = useAuth()

  const ahora = new Date()
  const enUnaSemana = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)

  const activos = proyectos.filter(p => new Date(p.fechaEntrega) >= ahora).length
  const tareasPendientes = misTareas.filter(t => t.estado !== 'Completada')
  const tareasEstaSemana = tareasPendientes.filter(
    t => t.fechaEntrega && new Date(t.fechaEntrega) <= enUnaSemana
  )
  const proximasTareas = tareasPendientes.slice(0, 5)

  return (
    <div>
      {/* Heading */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            Dashboard
            {auth.rol === 'admin' && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">
                Admin · Vista global
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen de tus proyectos y tareas</p>
        </div>
        <button
          onClick={handleModalFormulario}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo proyecto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">Proyectos</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{proyectos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">Activos</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{activos}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">Mis tareas</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{tareasPendientes.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">Vencen esta semana</p>
          <p className={`text-3xl font-bold mt-1 ${tareasEstaSemana.length > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
            {tareasEstaSemana.length}
          </p>
        </div>
      </div>

      {/* Mis tareas próximas */}
      {proximasTareas.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="font-semibold text-slate-800 mb-4">Mis tareas próximas</h2>
          <ul className="divide-y divide-slate-100">
            {proximasTareas.map(tarea => (
              <li key={tarea._id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{tarea.nombre}</p>
                  {tarea.proyecto && (
                    <Link
                      to={`/proyectos/${tarea.proyecto._id}`}
                      className="text-xs text-indigo-500 hover:text-indigo-700 truncate flex items-center gap-1 mt-0.5 w-fit"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0 inline-block"
                        style={{ backgroundColor: tarea.proyecto.color ?? '#6366f1' }}
                      />
                      {tarea.proyecto.nombre}
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {tarea.fechaEntrega && (
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      new Date(tarea.fechaEntrega) <= enUnaSemana
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-50 text-slate-500'
                    }`}>
                      {new Date(tarea.fechaEntrega).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[tarea.estado] ?? ESTADO_COLOR['Pendiente']}`}>
                    {tarea.estado ?? 'Pendiente'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid de proyectos */}
      {proyectos.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {proyectos.map((proyecto) => (
            <PreviewProyecto key={proyecto._id} proyecto={proyecto} />
          ))}

          {/* Card "agregar nuevo" */}
          <button
            onClick={handleModalFormulario}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors min-h-[160px]"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Nuevo proyecto</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-slate-700 font-semibold text-lg">Sin proyectos aún</h3>
          <p className="text-slate-400 text-sm mt-1 mb-5">Crea tu primer proyecto para comenzar</p>
          <button
            onClick={handleModalFormulario}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Crear primer proyecto
          </button>
        </div>
      )}
    </div>
  )
}

export default Proyectos
