import { useState, useEffect } from 'react'
import clienteAxios from '../config/clienteAxios'
import useAuth from '../hooks/useAuth'
import Alerta from '../components/Alerta'

const FORM_INICIAL = { nombre: '', email: '', password: '', rol: 'usuario', activo: true }

const AdminUsuarios = () => {
  const { auth } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [alerta, setAlerta] = useState({})
  const [modalCrear, setModalCrear] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [enviando, setEnviando] = useState(false)

  const token = localStorage.getItem('token')
  const config = { headers: { Authorization: `Bearer ${token}` } }

  const mostrarAlerta = (msg, error = false) => {
    setAlerta({ msg, error })
    setTimeout(() => setAlerta({}), 4000)
  }

  const cargarUsuarios = async () => {
    try {
      const { data } = await clienteAxios('/usuarios/admin/lista', config)
      setUsuarios(data)
    } catch (error) {
      mostrarAlerta(error.response?.data?.msg || 'Error al cargar usuarios', true)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const abrirCrear = () => {
    setForm(FORM_INICIAL)
    setModalCrear(true)
  }

  const abrirEditar = (usuario) => {
    setUsuarioSeleccionado(usuario)
    setForm({ nombre: usuario.nombre, email: usuario.email, password: '', rol: usuario.rol, activo: usuario.activo })
    setModalEditar(true)
  }

  const abrirEliminar = (usuario) => {
    setUsuarioSeleccionado(usuario)
    setModalEliminar(true)
  }

  const handleCrear = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.email || !form.password) {
      return mostrarAlerta('Nombre, email y contraseña son obligatorios', true)
    }
    setEnviando(true)
    try {
      const { data } = await clienteAxios.post('/usuarios/admin/crear', form, config)
      mostrarAlerta(data.msg)
      setModalCrear(false)
      cargarUsuarios()
    } catch (error) {
      mostrarAlerta(error.response?.data?.msg || 'Error al crear usuario', true)
    } finally {
      setEnviando(false)
    }
  }

  const handleEditar = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.email) {
      return mostrarAlerta('Nombre y email son obligatorios', true)
    }
    setEnviando(true)
    try {
      const payload = { nombre: form.nombre, email: form.email, rol: form.rol, activo: form.activo }
      const { data } = await clienteAxios.put(`/usuarios/admin/${usuarioSeleccionado._id}`, payload, config)
      mostrarAlerta(data.msg)
      setModalEditar(false)
      cargarUsuarios()
    } catch (error) {
      mostrarAlerta(error.response?.data?.msg || 'Error al actualizar usuario', true)
    } finally {
      setEnviando(false)
    }
  }

  const handleEliminar = async () => {
    setEnviando(true)
    try {
      const { data } = await clienteAxios.delete(`/usuarios/admin/${usuarioSeleccionado._id}`, config)
      mostrarAlerta(data.msg)
      setModalEliminar(false)
      cargarUsuarios()
    } catch (error) {
      mostrarAlerta(error.response?.data?.msg || 'Error al eliminar usuario', true)
    } finally {
      setEnviando(false)
    }
  }

  const toggleActivo = async (usuario) => {
    if (usuario._id === auth._id) {
      return mostrarAlerta('No puedes desactivarte a ti mismo', true)
    }
    try {
      await clienteAxios.put(`/usuarios/admin/${usuario._id}`, { activo: !usuario.activo }, config)
      cargarUsuarios()
    } catch (error) {
      mostrarAlerta(error.response?.data?.msg || 'Error al cambiar estado', true)
    }
  }

  const confirmarUsuario = async (usuario) => {
    try {
      await clienteAxios.put(`/usuarios/admin/${usuario._id}`, { confirmado: true }, config)
      mostrarAlerta(`Cuenta de ${usuario.nombre} confirmada`)
      cargarUsuarios()
    } catch (error) {
      mostrarAlerta(error.response?.data?.msg || 'Error al confirmar usuario', true)
    }
  }

  const totalActivos = usuarios.filter(u => u.activo).length
  const totalAdmins = usuarios.filter(u => u.rol === 'admin').length

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-slate-500 text-sm mt-0.5">Administra cuentas, roles y accesos</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      {alerta.msg && <Alerta alerta={alerta} />}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total usuarios', valor: usuarios.length, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Activos', valor: totalActivos, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Administradores', valor: totalAdmins, color: 'bg-violet-50 text-violet-700' },
        ].map(({ label, valor, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color.split(' ')[1]}`}>{valor}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {cargando ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No hay usuarios registrados</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuenta</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Activo</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map(usuario => (
                <tr key={usuario._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-indigo-700 text-xs font-bold">
                          {usuario.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-slate-800">
                        {usuario.nombre}
                        {usuario._id === auth._id && (
                          <span className="ml-2 text-[10px] text-slate-400 font-normal">(tú)</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{usuario.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      usuario.rol === 'admin'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {usuario.confirmado ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirmada
                      </span>
                    ) : (
                      <button
                        onClick={() => confirmarUsuario(usuario)}
                        title="Confirmar cuenta manualmente"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pendiente
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleActivo(usuario)}
                      disabled={usuario._id === auth._id}
                      title={usuario._id === auth._id ? 'No puedes desactivarte' : (usuario.activo ? 'Desactivar' : 'Activar')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        usuario.activo ? 'bg-emerald-500' : 'bg-slate-300'
                      } ${usuario._id === auth._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                        usuario.activo ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => abrirEditar(usuario)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {usuario._id !== auth._id && (
                        <button
                          onClick={() => abrirEliminar(usuario)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear */}
      {modalCrear && (
        <ModalOverlay onClose={() => setModalCrear(false)} titulo="Nuevo usuario">
          <form onSubmit={handleCrear} className="space-y-4">
            <CampoForm label="Nombre completo" id="nombre" value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Juan García" />
            <CampoForm label="Email" id="email" type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} placeholder="juan@empresa.com" />
            <CampoForm label="Contraseña" id="password" type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
            <CampoRol value={form.rol} onChange={rol => setForm({ ...form, rol })} />
            <BotonesModal onCancel={() => setModalCrear(false)} enviando={enviando} labelOk="Crear usuario" />
          </form>
        </ModalOverlay>
      )}

      {/* Modal Editar */}
      {modalEditar && (
        <ModalOverlay onClose={() => setModalEditar(false)} titulo="Editar usuario">
          <form onSubmit={handleEditar} className="space-y-4">
            <CampoForm label="Nombre completo" id="nombre-editar" value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <CampoForm label="Email" id="email-editar" type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
            <CampoRol value={form.rol} onChange={rol => setForm({ ...form, rol })} />
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-700">Cuenta activa</p>
                <p className="text-xs text-slate-400">El usuario puede iniciar sesión</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, activo: !form.activo })}
                disabled={usuarioSeleccionado?._id === auth._id}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${
                  form.activo ? 'bg-emerald-500' : 'bg-slate-300'
                } ${usuarioSeleccionado?._id === auth._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                  form.activo ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
            <BotonesModal onCancel={() => setModalEditar(false)} enviando={enviando} labelOk="Guardar cambios" />
          </form>
        </ModalOverlay>
      )}

      {/* Modal Eliminar */}
      {modalEliminar && (
        <ModalOverlay onClose={() => setModalEliminar(false)} titulo="Eliminar usuario">
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">
              ¿Estás seguro de que deseas eliminar a{' '}
              <span className="font-semibold text-slate-800">{usuarioSeleccionado?.nombre}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setModalEliminar(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={enviando}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60"
              >
                {enviando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ── Sub-componentes internos ────────────────────────────────────────────────

const ModalOverlay = ({ onClose, titulo, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800">{titulo}</h2>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

const CampoForm = ({ label, id, type = 'text', value, onChange, placeholder = '' }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
    />
  </div>
)

const CampoRol = ({ value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
    <div className="grid grid-cols-2 gap-2">
      {[
        { val: 'usuario', label: 'Usuario', desc: 'Acceso estándar' },
        { val: 'admin', label: 'Administrador', desc: 'Acceso total' },
      ].map(({ val, label, desc }) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={`p-3 rounded-lg border-2 text-left transition-all ${
            value === val
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className={`text-sm font-semibold ${value === val ? 'text-indigo-700' : 'text-slate-700'}`}>{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </button>
      ))}
    </div>
  </div>
)

const BotonesModal = ({ onCancel, enviando, labelOk }) => (
  <div className="flex gap-3 pt-2">
    <button
      type="button"
      onClick={onCancel}
      className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
    >
      Cancelar
    </button>
    <button
      type="submit"
      disabled={enviando}
      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60"
    >
      {enviando ? 'Guardando...' : labelOk}
    </button>
  </div>
)

export default AdminUsuarios
