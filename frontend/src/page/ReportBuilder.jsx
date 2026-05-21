import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import clienteAxios from "../config/clienteAxios"
import useProyectos from "../hooks/useProyectos"
import PreviewReporte, { labelMetrica, labelAgrupacion } from "../components/reportes/PreviewReporte"

const ESTADOS_TAREA = ['Pendiente', 'En Progreso', 'En Revisión', 'Completada']
const PRIORIDADES_TAREA = ['Baja', 'Media', 'Alta', 'Urgente']
const ESTADOS_PROYECTO = ['Activo', 'Pausado', 'Completado', 'Cancelado']
const ROLES_USUARIO = ['admin', 'usuario']

const VISUALIZACIONES = [
  { id: 'tabla',   label: 'Tabla',   icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { id: 'barras',  label: 'Barras',  icon: 'M4 19V9m6 10V5m6 14v-7' },
  { id: 'lineas',  label: 'Líneas',  icon: 'M3 17l6-6 4 4 8-8' },
  { id: 'donut',   label: 'Donut',   icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 8v4l3 3' },
  { id: 'kpi',     label: 'KPI',     icon: 'M4 6h16M4 12h16M4 18h7' },
]

const VISIBILIDADES = [
  { id: 'privado',     label: 'Privado',          desc: 'Solo tú' },
  { id: 'equipo',      label: 'Equipo',           desc: 'Tú y admins' },
  { id: 'organizacion', label: 'Organización',    desc: 'Todos los usuarios' },
]

const CONFIG_INICIAL = {
  nombre: '',
  descripcion: '',
  visibilidad: 'privado',
  fuente: 'tareas',
  metricas: ['count'],
  filtros: {},
  agrupacion: 'estado',
  ordenamiento: { campo: 'count', direccion: 'desc' },
  visualizacion: 'barras',
}

const Chip = ({ activo, onClick, children, color = 'indigo' }) => {
  const activos = {
    indigo:  'bg-indigo-100 text-indigo-700 border-indigo-200',
    slate:   'bg-slate-100 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    amber:   'bg-amber-100 text-amber-700 border-amber-200',
    red:     'bg-red-100 text-red-700 border-red-200',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
        activo ? activos[color] : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

const Section = ({ titulo, descripcion, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
    <div>
      <p className="text-sm font-semibold text-slate-700">{titulo}</p>
      {descripcion && <p className="text-xs text-slate-400 mt-0.5">{descripcion}</p>}
    </div>
    {children}
  </div>
)

const ReportBuilder = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { proyectos } = useProyectos()
  const editando = Boolean(id)

  const [config, setConfig] = useState(CONFIG_INICIAL)
  const [definiciones, setDefiniciones] = useState(null)
  const [preview, setPreview] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [cargandoInicial, setCargandoInicial] = useState(editando)
  const [guardando, setGuardando] = useState(false)
  const [alerta, setAlerta] = useState(null)
  const debounceRef = useRef(null)

  const token = localStorage.getItem('token')
  const authConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token])

  // Cargar definiciones de fuentes
  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await clienteAxios.get('/reportes/guardados/definiciones', authConfig)
        setDefiniciones(data)
      } catch {
        setAlerta({ tipo: 'error', msg: 'No se pudieron cargar las definiciones del builder' })
      }
    }
    run()
  }, [authConfig])

  // Cargar reporte existente
  useEffect(() => {
    if (!editando) return
    const run = async () => {
      try {
        const { data } = await clienteAxios.get(`/reportes/guardados/${id}`, authConfig)
        setConfig({
          nombre: data.nombre,
          descripcion: data.descripcion ?? '',
          visibilidad: data.visibilidad,
          fuente: data.fuente,
          metricas: data.metricas?.length ? data.metricas : ['count'],
          filtros: data.filtros ?? {},
          agrupacion: data.agrupacion ?? 'ninguno',
          ordenamiento: data.ordenamiento ?? { campo: 'count', direccion: 'desc' },
          visualizacion: data.visualizacion ?? 'tabla',
        })
      } catch (e) {
        setAlerta({ tipo: 'error', msg: e.response?.data?.msg ?? 'No se pudo cargar el reporte' })
      } finally {
        setCargandoInicial(false)
      }
    }
    run()
  }, [id, editando, authConfig])

  // Debounced preview
  const generarPreview = useCallback(async (cfg) => {
    setCargando(true)
    try {
      const { data } = await clienteAxios.post('/reportes/guardados/preview', cfg, authConfig)
      setPreview(data)
    } catch {
      setPreview(null)
    } finally {
      setCargando(false)
    }
  }, [authConfig])

  useEffect(() => {
    if (!definiciones) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => generarPreview(config), 350)
    return () => clearTimeout(debounceRef.current)
  }, [config, definiciones, generarPreview])

  const fuenteDef = definiciones?.[config.fuente]

  const cambiarFuente = (fuente) => {
    const def = definiciones?.[fuente]
    if (!def) return
    setConfig((c) => ({
      ...c,
      fuente,
      metricas: ['count'],
      agrupacion: def.agrupaciones[0]?.id ?? 'ninguno',
      filtros: {},
      ordenamiento: { campo: 'count', direccion: 'desc' },
    }))
  }

  const toggleMetrica = (metricaId) => {
    setConfig((c) => {
      const existe = c.metricas.includes(metricaId)
      const nuevas = existe ? c.metricas.filter((m) => m !== metricaId) : [...c.metricas, metricaId]
      if (!nuevas.length) return c
      return { ...c, metricas: nuevas }
    })
  }

  const toggleFiltroMulti = (campo, valor) => {
    setConfig((c) => {
      const actuales = c.filtros[campo] ?? []
      const nuevos = actuales.includes(valor)
        ? actuales.filter((v) => v !== valor)
        : [...actuales, valor]
      return { ...c, filtros: { ...c.filtros, [campo]: nuevos } }
    })
  }

  const setFiltro = (campo, valor) => {
    setConfig((c) => ({ ...c, filtros: { ...c.filtros, [campo]: valor } }))
  }

  const handleGuardar = async () => {
    if (!config.nombre.trim()) {
      return setAlerta({ tipo: 'error', msg: 'El nombre del reporte es obligatorio' })
    }
    setGuardando(true)
    try {
      if (editando) {
        await clienteAxios.put(`/reportes/guardados/${id}`, config, authConfig)
        setAlerta({ tipo: 'ok', msg: 'Reporte actualizado' })
      } else {
        const { data } = await clienteAxios.post('/reportes/guardados', config, authConfig)
        setAlerta({ tipo: 'ok', msg: 'Reporte creado' })
        navigate(`/proyectos/reportes/builder/${data._id}`, { replace: true })
      }
      setTimeout(() => setAlerta(null), 3000)
    } catch (e) {
      setAlerta({ tipo: 'error', msg: e.response?.data?.msg ?? 'No se pudo guardar el reporte' })
    } finally {
      setGuardando(false)
    }
  }

  if (cargandoInicial || !definiciones) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-100 rounded w-64 animate-pulse" />
        <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/proyectos/reportes" className="hover:text-indigo-600">Reportes</Link>
            <span>/</span>
            <Link to="/proyectos/reportes/guardados" className="hover:text-indigo-600">Personalizados</Link>
            <span>/</span>
            <span>{editando ? 'Editar' : 'Nuevo'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {editando ? 'Editar reporte' : 'Nuevo reporte personalizado'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Construye un reporte definiendo fuente, métricas, filtros y visualización.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/proyectos/reportes/guardados"
            className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar reporte'}
          </button>
        </div>
      </div>

      {alerta && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${
          alerta.tipo === 'error'
            ? 'bg-red-50 border-red-200 text-red-600'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {alerta.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-5">
        {/* Configuración */}
        <div className="space-y-4">
          {/* Info */}
          <Section titulo="1. Información">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">Nombre del reporte *</label>
                <input
                  type="text"
                  value={config.nombre}
                  onChange={(e) => setConfig((c) => ({ ...c, nombre: e.target.value }))}
                  placeholder="Ej. Tareas vencidas por responsable"
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Descripción</label>
                <textarea
                  rows={2}
                  value={config.descripcion}
                  onChange={(e) => setConfig((c) => ({ ...c, descripcion: e.target.value }))}
                  placeholder="Para qué sirve este reporte"
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Visibilidad</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {VISIBILIDADES.map((v) => (
                    <Chip
                      key={v.id}
                      activo={config.visibilidad === v.id}
                      onClick={() => setConfig((c) => ({ ...c, visibilidad: v.id }))}
                    >
                      {v.label} <span className="text-slate-400">· {v.desc}</span>
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Fuente */}
          <Section titulo="2. Fuente de datos" descripcion="¿Qué quieres analizar?">
            <div className="flex flex-wrap gap-2">
              {Object.entries(definiciones).map(([id, def]) => (
                <Chip key={id} activo={config.fuente === id} onClick={() => cambiarFuente(id)}>
                  {def.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Métricas */}
          <Section titulo="3. Métricas" descripcion="Una o más medidas a calcular">
            <div className="flex flex-wrap gap-2">
              {fuenteDef?.metricas.map((m) => (
                <Chip
                  key={m.id}
                  activo={config.metricas.includes(m.id)}
                  onClick={() => toggleMetrica(m.id)}
                  color="emerald"
                >
                  {m.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Filtros */}
          <Section titulo="4. Filtros" descripcion="Acota los datos a incluir (opcional)">
            {config.fuente === 'tareas' && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Estado</p>
                  <div className="flex flex-wrap gap-2">
                    {ESTADOS_TAREA.map((e) => (
                      <Chip
                        key={e}
                        activo={(config.filtros.estado ?? []).includes(e)}
                        onClick={() => toggleFiltroMulti('estado', e)}
                        color="slate"
                      >
                        {e}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Prioridad</p>
                  <div className="flex flex-wrap gap-2">
                    {PRIORIDADES_TAREA.map((p) => (
                      <Chip
                        key={p}
                        activo={(config.filtros.prioridad ?? []).includes(p)}
                        onClick={() => toggleFiltroMulti('prioridad', p)}
                        color="amber"
                      >
                        {p}
                      </Chip>
                    ))}
                  </div>
                </div>
                {proyectos.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Proyectos</p>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {proyectos.map((p) => (
                        <Chip
                          key={p._id}
                          activo={(config.filtros.proyecto ?? []).includes(p._id)}
                          onClick={() => toggleFiltroMulti('proyecto', p._id)}
                        >
                          <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                            style={{ background: p.color ?? '#6366f1' }} />
                          {p.nombre}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Desde</p>
                    <input
                      type="date"
                      value={config.filtros.desde ?? ''}
                      onChange={(e) => setFiltro('desde', e.target.value || undefined)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Hasta</p>
                    <input
                      type="date"
                      value={config.filtros.hasta ?? ''}
                      onChange={(e) => setFiltro('hasta', e.target.value || undefined)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(config.filtros.soloVencidas)}
                    onChange={(e) => setFiltro('soloVencidas', e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Solo tareas vencidas
                </label>
              </div>
            )}

            {config.fuente === 'proyectos' && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Estado</p>
                  <div className="flex flex-wrap gap-2">
                    {ESTADOS_PROYECTO.map((e) => (
                      <Chip
                        key={e}
                        activo={(config.filtros.estado ?? []).includes(e)}
                        onClick={() => toggleFiltroMulti('estado', e)}
                        color="slate"
                      >
                        {e}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Desde</p>
                    <input
                      type="date"
                      value={config.filtros.desde ?? ''}
                      onChange={(e) => setFiltro('desde', e.target.value || undefined)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Hasta</p>
                    <input
                      type="date"
                      value={config.filtros.hasta ?? ''}
                      onChange={(e) => setFiltro('hasta', e.target.value || undefined)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {config.fuente === 'usuarios' && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Rol</p>
                <div className="flex flex-wrap gap-2">
                  {ROLES_USUARIO.map((r) => (
                    <Chip
                      key={r}
                      activo={(config.filtros.rol ?? []).includes(r)}
                      onClick={() => toggleFiltroMulti('rol', r)}
                      color="slate"
                    >
                      {r}
                    </Chip>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">Reportes de usuarios solo se ejecutan para admins.</p>
              </div>
            )}
          </Section>

          {/* Agrupación */}
          <Section titulo="5. Agrupación" descripcion="Cómo agregar los registros">
            <div className="flex flex-wrap gap-2">
              {fuenteDef?.agrupaciones.map((a) => (
                <Chip
                  key={a.id}
                  activo={config.agrupacion === a.id}
                  onClick={() => setConfig((c) => ({ ...c, agrupacion: a.id }))}
                >
                  {a.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Visualización */}
          <Section titulo="6. Visualización">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {VISUALIZACIONES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, visualizacion: v.id }))}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                    config.visualizacion === v.id
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={v.icon} />
                  </svg>
                  {v.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Ordenar por</p>
                <select
                  value={config.ordenamiento?.campo ?? config.metricas[0] ?? 'count'}
                  onChange={(e) => setConfig((c) => ({
                    ...c,
                    ordenamiento: { ...c.ordenamiento, campo: e.target.value },
                  }))}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="grupo">Categoría</option>
                  {config.metricas.map((m) => (
                    <option key={m} value={m}>{labelMetrica(m)}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Dirección</p>
                <select
                  value={config.ordenamiento?.direccion ?? 'desc'}
                  onChange={(e) => setConfig((c) => ({
                    ...c,
                    ordenamiento: { ...c.ordenamiento, direccion: e.target.value },
                  }))}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>
          </Section>
        </div>

        {/* Preview */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Vista previa</p>
                <p className="text-xs text-slate-400">
                  {definiciones[config.fuente]?.label}
                  {config.agrupacion !== 'ninguno' && ` · agrupado por ${labelAgrupacion(config.agrupacion).toLowerCase()}`}
                </p>
              </div>
              {cargando && (
                <span className="text-xs text-slate-400 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                  Actualizando…
                </span>
              )}
            </div>
            <PreviewReporte
              datos={preview}
              visualizacion={config.visualizacion}
              cargando={cargando && !preview}
            />
          </div>

          {/* Resumen rápido */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-700 mb-2">Resumen</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li><span className="text-slate-400">Fuente:</span> {definiciones[config.fuente]?.label}</li>
              <li>
                <span className="text-slate-400">Métricas:</span>{' '}
                {config.metricas.map(labelMetrica).join(', ')}
              </li>
              <li>
                <span className="text-slate-400">Agrupación:</span>{' '}
                {config.agrupacion === 'ninguno' ? 'Totales' : labelAgrupacion(config.agrupacion)}
              </li>
              <li>
                <span className="text-slate-400">Visualización:</span>{' '}
                {VISUALIZACIONES.find((v) => v.id === config.visualizacion)?.label}
              </li>
              <li>
                <span className="text-slate-400">Visibilidad:</span>{' '}
                {VISIBILIDADES.find((v) => v.id === config.visibilidad)?.label}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportBuilder
