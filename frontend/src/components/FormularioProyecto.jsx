import { useState, useEffect } from "react"
import useProyectos from "../hooks/useProyectos"
import Alerta from "./Alerta"

const COLORES = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#64748b', // slate
]

const FormularioProyecto = () => {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [cliente, setCliente] = useState('')
  const [color, setColor] = useState(COLORES[0])
  const [estado, setEstado] = useState('Activo')
  const [area, setArea] = useState('')
  const [id, setId] = useState(null)

  const { mostrarAlerta, alerta, submitProyecto, proyectoEditar, handleModalFormulario } = useProyectos()

  useEffect(() => {
    if (proyectoEditar?._id) {
      setId(proyectoEditar._id)
      setNombre(proyectoEditar.nombre)
      setDescripcion(proyectoEditar.descripcion)
      setFechaEntrega(proyectoEditar.fechaEntrega?.split('T')[0] ?? '')
      setFechaInicio(proyectoEditar.fechaInicio?.split('T')[0] ?? '')
      setCliente(proyectoEditar.cliente)
      setColor(proyectoEditar.color ?? COLORES[0])
      setEstado(proyectoEditar.estado ?? 'Activo')
      setArea(proyectoEditar.area ?? '')
    } else {
      setId(null)
      setNombre('')
      setDescripcion('')
      setFechaEntrega('')
      setFechaInicio('')
      setCliente('')
      setColor(COLORES[0])
      setEstado('Activo')
      setArea('')
    }
  }, [proyectoEditar])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if ([nombre, descripcion, fechaEntrega, cliente].includes('')) {
      mostrarAlerta({ msg: 'Todos los campos son obligatorios', error: true })
      return
    }
    await submitProyecto({ id, nombre, descripcion, fechaEntrega, fechaInicio: fechaInicio || null, cliente, color, estado, area: area || null })
    handleModalFormulario()
  }

  const { msg } = alerta

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {msg && <Alerta alerta={alerta} />}

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Color del proyecto
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLORES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
              style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none' }}
            />
          ))}
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="nombre">
          Nombre del proyecto
        </label>
        <input
          id="nombre"
          type="text"
          placeholder="Ej. Rediseño web corporativa"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="descripcion">
          Descripción
        </label>
        <textarea
          id="descripcion"
          rows={3}
          placeholder="Describe brevemente el objetivo del proyecto"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      {/* Fechas en grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="fecha-inicio">
            Fecha de inicio
          </label>
          <input
            id="fecha-inicio"
            type="date"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="fecha-entrega">
            Fecha de entrega
          </label>
          <input
            id="fecha-entrega"
            type="date"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
          />
        </div>
      </div>

      {/* Cliente + Estado en grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="cliente">
            Cliente
          </label>
          <input
            id="cliente"
            type="text"
            placeholder="Nombre del cliente"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="estado">
            Estado
          </label>
          <select
            id="estado"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="Activo">Activo</option>
            <option value="Pausado">Pausado</option>
            <option value="Completado">Completado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Área */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="area">
          Área / Departamento <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <input
          id="area"
          type="text"
          placeholder="ej. Tecnología, RRHH, Operaciones…"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
      >
        {id ? 'Guardar cambios' : 'Crear proyecto'}
      </button>
    </form>
  )
}

export default FormularioProyecto
