import { useState } from 'react'
import useProyectos from '../hooks/useProyectos'
import useAuth from '../hooks/useAuth'

const ROL_COLOR = {
  admin:  'bg-violet-100 text-violet-700',
  editor: 'bg-indigo-100 text-indigo-700',
  lector: 'bg-slate-100 text-slate-600',
}

const Colaboradores = () => {
  const { proyecto, agregarColaborador, eliminarColaborador, mostrarAlerta } = useProyectos()
  const { auth } = useAuth()

  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('editor')
  const [enviando, setEnviando] = useState(false)

  const creadorId = proyecto.creador?._id ?? proyecto.creador
  const puedeAdministrar =
    auth.rol === 'admin' || creadorId?.toString() === auth._id?.toString()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email.trim()) {
      mostrarAlerta({ msg: 'El email es obligatorio', error: true })
      return
    }
    setEnviando(true)
    await agregarColaborador(proyecto._id, { email: email.trim(), rol })
    setEmail('')
    setRol('editor')
    setEnviando(false)
  }

  const { colaboradores = [] } = proyecto

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-800 mb-4">
        Colaboradores
        <span className="ml-2 text-xs font-normal text-slate-400">
          ({colaboradores.length})
        </span>
      </h2>

      {colaboradores.length > 0 ? (
        <ul className="divide-y divide-slate-100 mb-6">
          {colaboradores.map(c => (
            <li key={c._id} className="flex items-center justify-between py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-indigo-600">
                    {c.usuario?.nombre?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.usuario?.nombre}</p>
                  <p className="text-xs text-slate-400 truncate">{c.usuario?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROL_COLOR[c.rol]}`}>
                  {c.rol}
                </span>
                {puedeAdministrar && (
                  <button
                    onClick={() => eliminarColaborador(proyecto._id, c.usuario._id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar colaborador"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400 mb-6">Este proyecto no tiene colaboradores aún</p>
      )}

      {puedeAdministrar && (
        <form onSubmit={handleSubmit}>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Agregar colaborador
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="email@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <select
              value={rol}
              onChange={e => setRol(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="editor">Editor</option>
              <option value="lector">Lector</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={enviando}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              {enviando ? 'Agregando…' : 'Agregar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default Colaboradores
