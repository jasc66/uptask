import { useState, useEffect, useCallback, useMemo } from "react"
import { Link } from "react-router-dom"
import clienteAxios from "../config/clienteAxios"

const FRECUENCIAS = [
  { id: 'diaria',  label: 'Diaria',  desc: 'Cada día a la hora indicada' },
  { id: 'semanal', label: 'Semanal', desc: 'Una vez por semana' },
  { id: 'mensual', label: 'Mensual', desc: 'Una vez al mes' },
]

const DIAS_SEMANA = [
  { id: 0, label: 'Domingo' },
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
]

const FORMATO_LABEL = {
  html: 'HTML',
  csv: 'HTML + CSV',
}

const ESTADO_BADGE = {
  pendiente: { label: 'Pendiente', color: 'bg-slate-100 text-slate-600' },
  enviado:   { label: 'Enviado',   color: 'bg-emerald-100 text-emerald-700' },
  error:     { label: 'Error',     color: 'bg-red-100 text-red-700' },
}

const CONFIG_INICIAL = {
  nombre: '',
  reporte: '',
  frecuencia: 'semanal',
  hora: '08:00',
  diaSemana: 1,
  diaMes: 1,
  destinatarios: [],
  formato: 'html',
  activo: true,
}

const formatearFecha = (fecha) => {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const proximaEjecucion = ({ frecuencia, hora, diaSemana, diaMes }) => {
  const [h, m] = (hora ?? '08:00').split(':').map((n) => parseInt(n, 10) || 0)
  const ahora = new Date()
  const fecha = new Date()
  fecha.setSeconds(0, 0)
  fecha.setHours(h, m, 0, 0)

  if (frecuencia === 'diaria') {
    if (fecha <= ahora) fecha.setDate(fecha.getDate() + 1)
  } else if (frecuencia === 'semanal') {
    const objetivo = ((diaSemana ?? 1) - fecha.getDay() + 7) % 7
    fecha.setDate(fecha.getDate() + objetivo)
    if (fecha <= ahora) fecha.setDate(fecha.getDate() + 7)
  } else if (frecuencia === 'mensual') {
    fecha.setDate(diaMes ?? 1)
    if (fecha <= ahora) fecha.setMonth(fecha.getMonth() + 1)
  }
  return fecha.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const ReportesProgramados = () => {
  const [programados, setProgramados] = useState([])
  const [reportes, setReportes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [alerta, setAlerta] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [config, setConfig] = useState(CONFIG_INICIAL)
  const [emailInput, setEmailInput] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [ejecutandoId, setEjecutandoId] = useState(null)

  const token = localStorage.getItem('token')
  const authConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token])

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [{ data: ps }, { data: rs }] = await Promise.all([
        clienteAxios.get('/reportes/programados', authConfig),
        clienteAxios.get('/reportes/guardados', authConfig),
      ])
      setProgramados(ps)
      setReportes(rs)
    } catch (e) {
      setAlerta({ tipo: 'error', msg: e.response?.data?.msg ?? 'No se pudieron cargar los reportes programados' })
    } finally {
      setCargando(false)
    }
  }, [authConfig])

  useEffect(() => { cargar() }, [cargar])

  const abrirNuevo = () => {
    if (reportes.length === 0) {
      setAlerta({
        tipo: 'error',
        msg: 'Primero crea un reporte personalizado para poder programar su envío.',
      })
      return
    }
    setEditando(null)
    setConfig({ ...CONFIG_INICIAL, reporte: reportes[0]?._id ?? '' })
    setEmailInput('')
    setModalAbierto(true)
  }

  const abrirEditar = (programado) => {
    setEditando(programado)
    setConfig({
      nombre: programado.nombre,
      reporte: programado.reporte?._id ?? programado.reporte ?? '',
      frecuencia: programado.frecuencia,
      hora: programado.hora,
      diaSemana: programado.diaSemana ?? 1,
      diaMes: programado.diaMes ?? 1,
      destinatarios: programado.destinatarios ?? [],
      formato: programado.formato,
      activo: programado.activo,
    })
    setEmailInput('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
    setConfig(CONFIG_INICIAL)
    setEmailInput('')
  }

  const agregarEmail = () => {
    const email = emailInput.trim().toLowerCase()
    if (!email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAlerta({ tipo: 'error', msg: 'Email con formato inválido' })
      setTimeout(() => setAlerta(null), 3000)
      return
    }
    if (config.destinatarios.includes(email)) {
      setEmailInput('')
      return
    }
    setConfig((c) => ({ ...c, destinatarios: [...c.destinatarios, email] }))
    setEmailInput('')
  }

  const quitarEmail = (email) => {
    setConfig((c) => ({ ...c, destinatarios: c.destinatarios.filter((e) => e !== email) }))
  }

  const handleGuardar = async () => {
    if (!config.nombre.trim()) {
      return setAlerta({ tipo: 'error', msg: 'El nombre es obligatorio' })
    }
    if (!config.reporte) {
      return setAlerta({ tipo: 'error', msg: 'Selecciona un reporte base' })
    }
    if (config.destinatarios.length === 0) {
      return setAlerta({ tipo: 'error', msg: 'Agrega al menos un destinatario' })
    }

    setGuardando(true)
    try {
      if (editando) {
        const { data } = await clienteAxios.put(`/reportes/programados/${editando._id}`, config, authConfig)
        setProgramados((ps) => ps.map((p) => (p._id === data._id ? data : p)))
        setAlerta({ tipo: 'ok', msg: 'Reporte programado actualizado' })
      } else {
        const { data } = await clienteAxios.post('/reportes/programados', config, authConfig)
        setProgramados((ps) => [data, ...ps])
        setAlerta({ tipo: 'ok', msg: 'Reporte programado creado' })
      }
      cerrarModal()
      setTimeout(() => setAlerta(null), 3000)
    } catch (e) {
      setAlerta({ tipo: 'error', msg: e.response?.data?.msg ?? 'No se pudo guardar' })
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async () => {
    if (!confirmarEliminar) return
    try {
      await clienteAxios.delete(`/reportes/programados/${confirmarEliminar._id}`, authConfig)
      setProgramados((ps) => ps.filter((p) => p._id !== confirmarEliminar._id))
      setAlerta({ tipo: 'ok', msg: 'Programado eliminado' })
      setConfirmarEliminar(null)
      setTimeout(() => setAlerta(null), 3000)
    } catch (e) {
      setAlerta({ tipo: 'error', msg: e.response?.data?.msg ?? 'No se pudo eliminar' })
      setConfirmarEliminar(null)
    }
  }

  const ejecutarAhora = async (programado) => {
    setEjecutandoId(programado._id)
    try {
      const { data } = await clienteAxios.post(
        `/reportes/programados/${programado._id}/ejecutar`,
        {},
        authConfig
      )
      setAlerta({ tipo: 'ok', msg: data.msg ?? 'Reporte enviado' })
      await cargar()
      setTimeout(() => setAlerta(null), 3500)
    } catch (e) {
      setAlerta({ tipo: 'error', msg: e.response?.data?.msg ?? 'No se pudo enviar el reporte' })
      await cargar()
    } finally {
      setEjecutandoId(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/proyectos/reportes" className="hover:text-indigo-600">Reportes</Link>
            <span>/</span>
            <span>Programados</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Reportes programados</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Recibe automáticamente tus reportes guardados por email con la frecuencia que elijas.
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nueva programación
        </button>
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

      {cargando ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : programados.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-700">No hay reportes programados</p>
          <p className="text-sm text-slate-500 mt-1 max-w-md">
            Programa el envío automático de cualquier reporte guardado por email a tu equipo o stakeholders.
          </p>
          <button
            onClick={abrirNuevo}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Crear programación
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {programados.map((p) => {
            const estado = ESTADO_BADGE[p.ultimoEstado] ?? ESTADO_BADGE.pendiente
            return (
              <div
                key={p._id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-base font-bold text-slate-800 truncate">{p.nombre}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${estado.color}`}>
                      {estado.label}
                    </span>
                    {!p.activo && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Pausado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-2">
                    Reporte base:{' '}
                    <span className="text-slate-700 font-medium">
                      {p.reporte?.nombre ?? 'Reporte eliminado'}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-slate-400">Frecuencia:</span>
                      <span className="font-medium text-slate-700 capitalize">{p.frecuencia}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="text-slate-400">Hora:</span>
                      <span className="font-medium text-slate-700">{p.hora}</span>
                    </span>
                    {p.frecuencia === 'semanal' && (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-slate-400">Día:</span>
                        <span className="font-medium text-slate-700">
                          {DIAS_SEMANA.find((d) => d.id === p.diaSemana)?.label}
                        </span>
                      </span>
                    )}
                    {p.frecuencia === 'mensual' && (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-slate-400">Día del mes:</span>
                        <span className="font-medium text-slate-700">{p.diaMes}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <span className="text-slate-400">Formato:</span>
                      <span className="font-medium text-slate-700">{FORMATO_LABEL[p.formato]}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="text-slate-400">Destinatarios:</span>
                      <span className="font-medium text-slate-700">{p.destinatarios?.length ?? 0}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                    <span>
                      <span className="text-slate-300">Última ejecución:</span>{' '}
                      {formatearFecha(p.ultimaEjecucion)}
                    </span>
                    {p.activo && (
                      <span>
                        <span className="text-slate-300">Próxima:</span>{' '}
                        {proximaEjecucion(p)}
                      </span>
                    )}
                  </div>
                  {p.ultimoEstado === 'error' && p.ultimoError && (
                    <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                      {p.ultimoError}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => ejecutarAhora(p)}
                    disabled={ejecutandoId === p._id || !p.reporte}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {ejecutandoId === p._id ? 'Enviando…' : 'Enviar ahora'}
                  </button>
                  <button
                    onClick={() => abrirEditar(p)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmarEliminar(p)}
                    className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                {editando ? 'Editar programación' : 'Nueva programación'}
              </h2>
              <button
                onClick={cerrarModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-medium text-slate-500">Nombre *</label>
                <input
                  type="text"
                  value={config.nombre}
                  onChange={(e) => setConfig((c) => ({ ...c, nombre: e.target.value }))}
                  placeholder="Ej. Resumen semanal de tareas vencidas"
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Reporte base *</label>
                <select
                  value={config.reporte}
                  onChange={(e) => setConfig((c) => ({ ...c, reporte: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Selecciona un reporte —</option>
                  {reportes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
                {reportes.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    No tienes reportes guardados.{' '}
                    <Link to="/proyectos/reportes/builder" className="underline">
                      Crea uno desde el builder
                    </Link>
                    .
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Frecuencia *</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {FRECUENCIAS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, frecuencia: f.id }))}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                        config.frecuencia === f.id
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div>{f.label}</div>
                      <div className="text-[10px] font-normal text-slate-400 mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">Hora (24h)</label>
                  <input
                    type="time"
                    value={config.hora}
                    onChange={(e) => setConfig((c) => ({ ...c, hora: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {config.frecuencia === 'semanal' && (
                  <div>
                    <label className="text-xs font-medium text-slate-500">Día de la semana</label>
                    <select
                      value={config.diaSemana}
                      onChange={(e) => setConfig((c) => ({ ...c, diaSemana: parseInt(e.target.value, 10) }))}
                      className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    >
                      {DIAS_SEMANA.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {config.frecuencia === 'mensual' && (
                  <div>
                    <label className="text-xs font-medium text-slate-500">Día del mes (1-28)</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={config.diaMes}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          diaMes: Math.min(28, Math.max(1, parseInt(e.target.value, 10) || 1)),
                        }))
                      }
                      className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Destinatarios *</label>
                <div className="flex gap-2 mt-1.5">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        agregarEmail()
                      }
                    }}
                    placeholder="email@ejemplo.com"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={agregarEmail}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    Agregar
                  </button>
                </div>
                {config.destinatarios.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {config.destinatarios.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs text-indigo-700"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => quitarEmail(email)}
                          className="hover:text-indigo-900"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Formato del email</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {[
                    { id: 'html', label: 'HTML', desc: 'Email con tabla integrada' },
                    { id: 'csv', label: 'HTML + CSV', desc: 'Adjunta CSV descargable' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, formato: f.id }))}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                        config.formato === f.id
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div>{f.label}</div>
                      <div className="text-[10px] font-normal text-slate-400 mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.activo}
                  onChange={(e) => setConfig((c) => ({ ...c, activo: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Programación activa (desactiva para pausar sin eliminar)
              </label>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={cerrarModal}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear programación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {confirmarEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <p className="text-base font-bold text-slate-800">Eliminar programación</p>
            <p className="text-sm text-slate-500 mt-1">
              ¿Eliminar definitivamente{' '}
              <span className="font-semibold text-slate-700">{confirmarEliminar.nombre}</span>?
              El envío automático se detendrá inmediatamente.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmarEliminar(null)}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
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

export default ReportesProgramados
