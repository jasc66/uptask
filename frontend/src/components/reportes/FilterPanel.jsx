import { useState } from "react"

const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Urgente']
const ESTADOS_PROYECTO = ['Activo', 'Pausado', 'Completado', 'Cancelado']

const PRIORIDAD_COLOR = {
  Baja:    'bg-slate-100 text-slate-600 border-slate-200 data-[activo=true]:bg-slate-600 data-[activo=true]:text-white data-[activo=true]:border-slate-600',
  Media:   'bg-blue-50 text-blue-600 border-blue-200 data-[activo=true]:bg-blue-600 data-[activo=true]:text-white data-[activo=true]:border-blue-600',
  Alta:    'bg-amber-50 text-amber-600 border-amber-200 data-[activo=true]:bg-amber-500 data-[activo=true]:text-white data-[activo=true]:border-amber-500',
  Urgente: 'bg-red-50 text-red-600 border-red-200 data-[activo=true]:bg-red-500 data-[activo=true]:text-white data-[activo=true]:border-red-500',
}

const ESTADO_PROYECTO_COLOR = {
  Activo:     'bg-emerald-50 text-emerald-600 border-emerald-200 data-[activo=true]:bg-emerald-600 data-[activo=true]:text-white data-[activo=true]:border-emerald-600',
  Pausado:    'bg-amber-50 text-amber-600 border-amber-200 data-[activo=true]:bg-amber-500 data-[activo=true]:text-white data-[activo=true]:border-amber-500',
  Completado: 'bg-indigo-50 text-indigo-600 border-indigo-200 data-[activo=true]:bg-indigo-600 data-[activo=true]:text-white data-[activo=true]:border-indigo-600',
  Cancelado:  'bg-slate-100 text-slate-500 border-slate-200 data-[activo=true]:bg-slate-500 data-[activo=true]:text-white data-[activo=true]:border-slate-500',
}

const PRESETS = [
  { label: 'Todo', dias: null },
  { label: '7 días', dias: 7 },
  { label: '30 días', dias: 30 },
  { label: '90 días', dias: 90 },
  { label: 'Rango', dias: 'custom' },
]

const FILTROS_VACIOS = {
  fechaDesde: '',
  fechaHasta: '',
  prioridad: [],
  estadoProyecto: '',
  area: '',
}

const contarActivos = (filtros) => {
  let n = 0
  if (filtros.fechaDesde || filtros.fechaHasta) n++
  if (filtros.prioridad?.length) n++
  if (filtros.estadoProyecto) n++
  if (filtros.area?.trim()) n++
  return n
}

const FilterPanel = ({ filtros, onChange }) => {
  const [abierto, setAbierto] = useState(false)
  const [presetActivo, setPresetActivo] = useState('Todo')

  const aplicarPreset = (preset) => {
    setPresetActivo(preset.label)
    if (!preset.dias) {
      onChange({ ...filtros, fechaDesde: '', fechaHasta: '' })
    } else if (preset.dias === 'custom') {
      // Mostrar inputs de rango — mantener fechas actuales
    } else {
      const hasta = new Date()
      const desde = new Date()
      desde.setDate(desde.getDate() - preset.dias)
      onChange({
        ...filtros,
        fechaDesde: desde.toISOString().slice(0, 10),
        fechaHasta: hasta.toISOString().slice(0, 10),
      })
    }
  }

  const togglePrioridad = (p) => {
    const arr = filtros.prioridad || []
    onChange({ ...filtros, prioridad: arr.includes(p) ? arr.filter(x => x !== p) : [...arr, p] })
  }

  const setEstadoProyecto = (e) => {
    onChange({ ...filtros, estadoProyecto: filtros.estadoProyecto === e ? '' : e })
  }

  const limpiar = () => {
    setPresetActivo('Todo')
    onChange(FILTROS_VACIOS)
  }

  const activos = contarActivos(filtros)

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
          activos > 0
            ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
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
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-4">
          {/* Período */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Período (fecha límite)</p>
            <div className="flex gap-1 flex-wrap">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => aplicarPreset(p)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    presetActivo === p.label
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {presetActivo === 'Rango' && (
              <div className="flex gap-2 mt-2">
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={e => onChange({ ...filtros, fechaDesde: e.target.value })}
                  className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-indigo-400"
                />
                <span className="self-center text-xs text-slate-400">—</span>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={e => onChange({ ...filtros, fechaHasta: e.target.value })}
                  className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-indigo-400"
                />
              </div>
            )}
          </div>

          {/* Prioridad */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Prioridad de tarea</p>
            <div className="flex gap-1.5 flex-wrap">
              {PRIORIDADES.map(p => (
                <button
                  key={p}
                  data-activo={filtros.prioridad?.includes(p)}
                  onClick={() => togglePrioridad(p)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${PRIORIDAD_COLOR[p]}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Estado de proyecto */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Estado de proyecto</p>
            <div className="flex gap-1.5 flex-wrap">
              {ESTADOS_PROYECTO.map(e => (
                <button
                  key={e}
                  data-activo={filtros.estadoProyecto === e}
                  onClick={() => setEstadoProyecto(e)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${ESTADO_PROYECTO_COLOR[e]}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Área */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Área del proyecto</p>
            <input
              type="text"
              value={filtros.area}
              onChange={e => onChange({ ...filtros, area: e.target.value })}
              placeholder="Ej: Marketing, TI, Diseño…"
              className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-indigo-400 placeholder-slate-400"
            />
          </div>

          {/* Limpiar */}
          {activos > 0 && (
            <button
              onClick={limpiar}
              className="w-full text-xs text-red-500 hover:text-red-600 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
            >
              Limpiar filtros ({activos})
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export { FILTROS_VACIOS }
export default FilterPanel
