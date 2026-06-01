import { useState, useRef, useEffect } from "react"

const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Urgente']
const ESTADOS_TAREA = ['Pendiente', 'En Progreso', 'En Revisión', 'Completada']
const ESTADOS_PROYECTO = ['Activo', 'Pausado', 'Completado', 'Cancelado']

const PRIORIDAD_COLOR = {
  Baja:    'border-slate-200 data-[activo=true]:bg-slate-600 data-[activo=true]:text-white data-[activo=true]:border-slate-600 text-slate-600 hover:border-slate-400',
  Media:   'border-blue-200 data-[activo=true]:bg-blue-600 data-[activo=true]:text-white data-[activo=true]:border-blue-600 text-blue-600 hover:border-blue-400',
  Alta:    'border-amber-200 data-[activo=true]:bg-amber-500 data-[activo=true]:text-white data-[activo=true]:border-amber-500 text-amber-600 hover:border-amber-400',
  Urgente: 'border-red-200 data-[activo=true]:bg-red-500 data-[activo=true]:text-white data-[activo=true]:border-red-500 text-red-600 hover:border-red-400',
}

const ESTADO_TAREA_COLOR = {
  Pendiente:    'border-slate-200 data-[activo=true]:bg-slate-600 data-[activo=true]:text-white text-slate-600 hover:border-slate-400',
  'En Progreso':'border-blue-200 data-[activo=true]:bg-blue-600 data-[activo=true]:text-white text-blue-600 hover:border-blue-400',
  'En Revisión':'border-amber-200 data-[activo=true]:bg-amber-500 data-[activo=true]:text-white text-amber-600 hover:border-amber-400',
  Completada:   'border-emerald-200 data-[activo=true]:bg-emerald-600 data-[activo=true]:text-white text-emerald-600 hover:border-emerald-400',
}

const PRESETS_FECHA = [
  { label: 'Todo', dias: null },
  { label: '7d', dias: 7 },
  { label: '30d', dias: 30 },
  { label: '90d', dias: 90 },
  { label: 'Rango', dias: 'custom' },
]

const PRESETS_KEY = 'nexo_filtros_presets'

export const FILTROS_VACIOS = {
  fechaDesde: '',
  fechaHasta: '',
  prioridad: [],
  estadoProyecto: '',
  estadoTarea: [],
  area: '',
  proyectoId: '',
  responsableId: '',
  soloVencidas: false,
}

const contarActivos = (f) => {
  let n = 0
  if (f.fechaDesde || f.fechaHasta) n++
  if (f.prioridad?.length) n++
  if (f.estadoProyecto) n++
  if (f.estadoTarea?.length) n++
  if (f.area?.trim()) n++
  if (f.proyectoId) n++
  if (f.responsableId) n++
  if (f.soloVencidas) n++
  return n
}

const TogglePill = ({ activo, onClick, children, colorClass = '' }) => (
  <button
    type="button"
    data-activo={activo}
    onClick={onClick}
    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${colorClass || 'border-slate-200 text-slate-600 hover:border-indigo-300 data-[activo=true]:bg-indigo-600 data-[activo=true]:text-white data-[activo=true]:border-indigo-600'}`}
  >
    {children}
  </button>
)

const Seccion = ({ titulo, children }) => (
  <div className="mb-4">
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{titulo}</p>
    {children}
  </div>
)

const FilterPanel = ({ filtros, onChange, proyectos = [], usuarios = [] }) => {
  const [abierto, setAbierto] = useState(false)
  const [presetFecha, setPresetFecha] = useState('Todo')
  const [presets, setPresets] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PRESETS_KEY) ?? '[]') } catch { return [] }
  })
  const [nombrePreset, setNombrePreset] = useState('')
  const [guardandoPreset, setGuardandoPreset] = useState(false)
  const panelRef = useRef(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [abierto])

  const set = (campo, valor) => onChange({ ...filtros, [campo]: valor })

  const toggleArr = (campo, valor) => {
    const arr = filtros[campo] ?? []
    set(campo, arr.includes(valor) ? arr.filter(x => x !== valor) : [...arr, valor])
  }

  const aplicarPresetFecha = (preset) => {
    setPresetFecha(preset.label)
    if (!preset.dias) {
      onChange({ ...filtros, fechaDesde: '', fechaHasta: '' })
    } else if (preset.dias !== 'custom') {
      const hasta = new Date()
      const desde = new Date()
      desde.setDate(desde.getDate() - preset.dias)
      onChange({ ...filtros, fechaDesde: desde.toISOString().slice(0, 10), fechaHasta: hasta.toISOString().slice(0, 10) })
    }
  }

  const limpiar = () => { setPresetFecha('Todo'); onChange(FILTROS_VACIOS) }

  const guardarPreset = () => {
    if (!nombrePreset.trim()) return
    const nuevo = { nombre: nombrePreset.trim(), filtros: { ...filtros } }
    const actualizados = [...presets, nuevo]
    setPresets(actualizados)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(actualizados))
    setNombrePreset('')
    setGuardandoPreset(false)
  }

  const eliminarPreset = (idx) => {
    const actualizados = presets.filter((_, i) => i !== idx)
    setPresets(actualizados)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(actualizados))
  }

  const aplicarPreset = (p) => {
    onChange({ ...FILTROS_VACIOS, ...p.filtros })
    setAbierto(false)
  }

  const activos = contarActivos(filtros)

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setAbierto(!abierto)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
          activos > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        Filtros
        {activos > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
            {activos}
          </span>
        )}
        <svg className={`w-3 h-3 transition-transform ${abierto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-88 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-4 max-h-[80vh] overflow-y-auto" style={{ width: '340px' }}>

          {/* Presets guardados */}
          {presets.length > 0 && (
            <Seccion titulo="Mis presets">
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p, i) => (
                  <div key={i} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-full pr-1 pl-2.5 py-0.5">
                    <button onClick={() => aplicarPreset(p)} className="text-xs text-slate-700 hover:text-indigo-600 font-medium">{p.nombre}</button>
                    <button onClick={() => eliminarPreset(i)} className="text-slate-400 hover:text-red-500 ml-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </Seccion>
          )}

          {/* Período */}
          <Seccion titulo="Período (fecha límite)">
            <div className="flex gap-1 flex-wrap mb-2">
              {PRESETS_FECHA.map(p => (
                <button
                  key={p.label}
                  onClick={() => aplicarPresetFecha(p)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    presetFecha === p.label ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {presetFecha === 'Rango' && (
              <div className="flex gap-2">
                <input type="date" value={filtros.fechaDesde}
                  onChange={e => set('fechaDesde', e.target.value)}
                  className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-indigo-400"
                />
                <span className="self-center text-xs text-slate-400">—</span>
                <input type="date" value={filtros.fechaHasta}
                  onChange={e => set('fechaHasta', e.target.value)}
                  className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-indigo-400"
                />
              </div>
            )}
          </Seccion>

          {/* Solo vencidas */}
          <Seccion titulo="Vencimiento">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => set('soloVencidas', !filtros.soloVencidas)}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${filtros.soloVencidas ? 'bg-red-500' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${filtros.soloVencidas ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-xs text-slate-600">Solo tareas vencidas</span>
            </label>
          </Seccion>

          {/* Prioridad */}
          <Seccion titulo="Prioridad de tarea">
            <div className="flex gap-1.5 flex-wrap">
              {PRIORIDADES.map(p => (
                <TogglePill key={p} activo={filtros.prioridad?.includes(p)} onClick={() => toggleArr('prioridad', p)} colorClass={PRIORIDAD_COLOR[p]}>
                  {p}
                </TogglePill>
              ))}
            </div>
          </Seccion>

          {/* Estado de tarea */}
          <Seccion titulo="Estado de tarea">
            <div className="flex gap-1.5 flex-wrap">
              {ESTADOS_TAREA.map(e => (
                <TogglePill key={e} activo={filtros.estadoTarea?.includes(e)} onClick={() => toggleArr('estadoTarea', e)} colorClass={ESTADO_TAREA_COLOR[e]}>
                  {e}
                </TogglePill>
              ))}
            </div>
          </Seccion>

          {/* Estado de proyecto */}
          <Seccion titulo="Estado de proyecto">
            <div className="flex gap-1.5 flex-wrap">
              {ESTADOS_PROYECTO.map(e => (
                <TogglePill key={e} activo={filtros.estadoProyecto === e} onClick={() => set('estadoProyecto', filtros.estadoProyecto === e ? '' : e)}>
                  {e}
                </TogglePill>
              ))}
            </div>
          </Seccion>

          {/* Proyecto específico */}
          {proyectos.length > 0 && (
            <Seccion titulo="Proyecto">
              <select
                value={filtros.proyectoId}
                onChange={e => set('proyectoId', e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-indigo-400"
              >
                <option value="">Todos los proyectos</option>
                {proyectos.map(p => (
                  <option key={p._id} value={p._id}>{p.proyecto?.nombre ?? p.nombre ?? p._id}</option>
                ))}
              </select>
            </Seccion>
          )}

          {/* Responsable */}
          {usuarios.length > 0 && (
            <Seccion titulo="Responsable">
              <select
                value={filtros.responsableId}
                onChange={e => set('responsableId', e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-indigo-400"
              >
                <option value="">Todos los responsables</option>
                {usuarios.map(u => (
                  <option key={u.usuario._id} value={u.usuario._id}>{u.usuario.nombre}</option>
                ))}
              </select>
            </Seccion>
          )}

          {/* Área */}
          <Seccion titulo="Área del proyecto">
            <input
              type="text"
              value={filtros.area}
              onChange={e => set('area', e.target.value)}
              placeholder="Ej: Marketing, TI, Diseño…"
              className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-indigo-400 placeholder-slate-400"
            />
          </Seccion>

          {/* Guardar como preset */}
          <div className="border-t border-slate-100 pt-3 mt-1">
            {guardandoPreset ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nombrePreset}
                  onChange={e => setNombrePreset(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && guardarPreset()}
                  placeholder="Nombre del preset…"
                  className="flex-1 text-xs px-2 py-1.5 border border-indigo-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <button onClick={guardarPreset} className="text-xs px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">OK</button>
                <button onClick={() => setGuardandoPreset(false)} className="text-xs text-slate-400 hover:text-slate-600 px-1">✕</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {activos > 0 && (
                  <button onClick={() => setGuardandoPreset(true)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                    Guardar como preset
                  </button>
                )}
                {activos > 0 && (
                  <button onClick={limpiar} className="text-xs text-red-500 hover:text-red-600">
                    Limpiar ({activos})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterPanel
