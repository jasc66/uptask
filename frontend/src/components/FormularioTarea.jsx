import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useProyectos from '../hooks/useProyectos'
import Alerta from './Alerta'

const PRIORIDADES = ['Baja', 'Media', 'Alta']

const FormularioTarea = () => {
  const { id } = useParams()
  const { submitTarea, alerta, mostrarAlerta, tareaEditar } = useProyectos()

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [tareaId, setTareaId] = useState(null)

  useEffect(() => {
    if (tareaEditar?._id) {
      setNombre(tareaEditar.nombre)
      setDescripcion(tareaEditar.descripcion)
      setPrioridad(tareaEditar.prioridad)
      setFechaEntrega(tareaEditar.fechaEntrega?.split('T')[0] ?? '')
      setTareaId(tareaEditar._id)
    } else {
      setNombre('')
      setDescripcion('')
      setPrioridad('')
      setFechaEntrega('')
      setTareaId(null)
    }
  }, [tareaEditar])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if ([nombre, descripcion, prioridad, fechaEntrega].includes('')) {
      mostrarAlerta({ msg: 'Todos los campos son obligatorios', error: true })
      return
    }

    await submitTarea({ id: tareaId, nombre, descripcion, prioridad, fechaEntrega, proyecto: id })
  }

  const { msg } = alerta

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg && <Alerta alerta={alerta} />}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="nombre">
          Nombre de la tarea
        </label>
        <input
          id="nombre"
          type="text"
          placeholder="Nombre de la tarea"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="descripcion">
          Descripción
        </label>
        <textarea
          id="descripcion"
          placeholder="Descripción de la tarea"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="fechaEntrega">
          Fecha de entrega
        </label>
        <input
          id="fechaEntrega"
          type="date"
          value={fechaEntrega}
          onChange={e => setFechaEntrega(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="prioridad">
          Prioridad
        </label>
        <select
          id="prioridad"
          value={prioridad}
          onChange={e => setPrioridad(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">-- Seleccionar prioridad --</option>
          {PRIORIDADES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {tareaId ? 'Guardar cambios' : 'Crear tarea'}
      </button>
    </form>
  )
}

export default FormularioTarea
