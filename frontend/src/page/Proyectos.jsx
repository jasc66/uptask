import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import useProyectos from "../hooks/useProyectos"
import useAuth from "../hooks/useAuth"
import PreviewProyecto from "../components/PreviewProyecto"

const ESTADO_COLOR = {
  'Pendiente':   'bg-slate-100 text-slate-500',
  'En Progreso': 'bg-blue-100 text-blue-700',
  'En Revisión': 'bg-amber-100 text-amber-700',
  'Completada':  'bg-emerald-100 text-emerald-700',
}

const contarTareas = (tareas = []) => {
  let total = 0
  const recorrer = (lista) => {
    for (const t of lista) {
      total++
      if (t.subtareas?.length) recorrer(t.subtareas)
    }
  }
  recorrer(tareas)
  return total
}

const Proyectos = () => {
  const { proyectos, handleModalFormulario, misTareas, importarProyecto, mostrarAlerta } = useProyectos()
  const { auth } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [modalImportar, setModalImportar] = useState(null)
  const [importando, setImportando] = useState(false)

  const ahora = new Date()
  const enUnaSemana = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)

  const activos = proyectos.filter(p => new Date(p.fechaEntrega) >= ahora).length
  const tareasPendientes = misTareas.filter(t => t.estado !== 'Completada')
  const tareasEstaSemana = tareasPendientes.filter(
    t => t.fechaEntrega && new Date(t.fechaEntrega) <= enUnaSemana
  )
  const proximasTareas = tareasPendientes.slice(0, 5)

  const hayAlerta = tareasEstaSemana.length > 0

  const handleArchivoSeleccionado = (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const datos = JSON.parse(ev.target.result)
        if (!datos?.version || !datos?.proyecto) {
          mostrarAlerta({ msg: 'El archivo no es un proyecto Nexo válido.', error: true })
          return
        }
        if (datos.version !== '1') {
          mostrarAlerta({ msg: `Versión de archivo no soportada (v${datos.version}). Se requiere versión 1.`, error: true })
          return
        }
        setModalImportar({
          datos,
          nombre: datos.proyecto.nombre,
          totalTareas: contarTareas(datos.tareas),
          totalEtiquetas: datos.etiquetas?.length ?? 0,
        })
      } catch {
        mostrarAlerta({ msg: 'El archivo JSON está dañado o tiene formato incorrecto.', error: true })
      }
    }
    reader.readAsText(archivo)
  }

  const confirmarImportacion = async () => {
    if (!modalImportar) return
    setImportando(true)
    const resultado = await importarProyecto(modalImportar.datos)
    setImportando(false)
    setModalImportar(null)
    if (resultado?.proyectoId) {
      navigate(`/proyectos/${resultado.proyectoId}`)
    }
  }

  const statCards = [
    {
      label: 'Proyectos',
      value: proyectos.length,
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      textColor: 'text-blue-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Activos',
      value: activos,
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Mis tareas',
      value: tareasPendientes.length,
      bg: 'bg-violet-50',
      iconBg: 'bg-violet-100',
      textColor: 'text-violet-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: 'Vencen esta semana',
      value: tareasEstaSemana.length,
      bg: hayAlerta ? 'bg-amber-50' : 'bg-slate-50',
      iconBg: hayAlerta ? 'bg-amber-100' : 'bg-slate-100',
      textColor: hayAlerta ? 'text-amber-600' : 'text-slate-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div>
      {/* Input oculto para importar */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleArchivoSeleccionado}
      />

      {/* Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            Dashboard
            {auth.rol === 'admin' && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">
                Admin · Vista global
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen de tus proyectos y tareas</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importar
          </button>
          <button
            onClick={handleModalFormulario}
            className="flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo proyecto
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className={`${card.bg} rounded-xl border border-slate-200 px-3 py-3 sm:px-5 sm:py-4 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 font-medium">{card.label}</p>
              <div className={`${card.iconBg} w-8 h-8 rounded-lg flex items-center justify-center shrink-0`}>
                <span className={card.textColor}>{card.icon}</span>
              </div>
            </div>
            <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        ))}
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
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#6d4afe]/30 text-slate-400 hover:border-[#6d4afe]/60 hover:text-[#6d4afe] hover:bg-violet-50/60 transition-all min-h-[160px]"
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
      {/* Modal de confirmación de importación */}
      {modalImportar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Importar proyecto</h3>
                <p className="text-xs text-slate-400">Confirma los detalles antes de importar</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Nombre</span>
                <span className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{modalImportar.nombre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Tareas</span>
                <span className="text-sm font-semibold text-slate-800">{modalImportar.totalTareas}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Etiquetas</span>
                <span className="text-sm font-semibold text-slate-800">{modalImportar.totalEtiquetas}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-amber-700">Los colaboradores no se importan — deberás re-invitarlos manualmente.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalImportar(null)}
                disabled={importando}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarImportacion}
                disabled={importando}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {importando ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Importando...
                  </>
                ) : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Proyectos
