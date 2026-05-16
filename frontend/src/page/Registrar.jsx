import { useState } from "react";
import { Link } from "react-router-dom";
import Alerta from "../components/Alerta.jsx";
import clienteAxios from "../config/clienteAxios.jsx";

const Registrar = () => {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repetirPassword, setRepetirPassword] = useState('')
  const [alerta, setAlerta] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showRepetir, setShowRepetir] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault();

    if ([nombre, email, password, repetirPassword].includes('')) {
      setAlerta({ msg: 'Todos los campos son obligatorios', error: true })
      return
    }
    if (password !== repetirPassword) {
      setAlerta({ msg: 'Las contraseñas no coinciden', error: true })
      return
    }
    if (password.length < 6) {
      setAlerta({ msg: 'La contraseña debe tener al menos 6 caracteres', error: true })
      return
    }

    setAlerta({})

    try {
      const { data } = await clienteAxios.post(`/usuarios`, { nombre, email, password })
      setAlerta({ msg: data.msg, error: false })
      setNombre('')
      setEmail('')
      setPassword('')
      setRepetirPassword('')
    } catch (error) {
      setAlerta({ msg: error.response.data.msg, error: true })
    }
  }

  const { msg } = alerta;

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-600 rounded-full opacity-10" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-600 rounded-full opacity-10" />

        <div className="relative z-10">
          <NexoLogo />
        </div>

        <div className="relative z-10 space-y-5">
          <h1 className="text-3xl font-bold text-white leading-tight">
            Empieza gratis.<br />
            <span className="text-violet-400">Sin compromisos.</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-xs">
            Crea tu cuenta y comienza a gestionar proyectos con tu equipo en minutos.
          </p>

          <div className="bg-white bg-opacity-5 rounded-2xl p-5 space-y-4 mt-6">
            {[
              { num: "01", text: "Crea tu cuenta" },
              { num: "02", text: "Confirma tu correo" },
              { num: "03", text: "Comienza a gestionar" },
            ].map(({ num, text }) => (
              <div key={num} className="flex items-center gap-4">
                <span className="text-xs font-bold text-indigo-400 w-6">{num}</span>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-600 text-xs">
          © {new Date().getFullYear()} Nexo. Todos los derechos reservados.
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-3/5 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20 bg-white overflow-y-auto py-12">
        <div className="lg:hidden mb-10">
          <NexoLogo dark />
        </div>

        <div className="w-full max-w-lg mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Crear cuenta</h2>
            <p className="text-slate-500">Completa los datos para registrarte</p>
          </div>

          {msg && <Alerta alerta={alerta} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-semibold text-slate-700 mb-2">
                Nombre completo
              </label>
              <input
                type="text"
                id="nombre"
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                placeholder="tu@ejemplo.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="password2" className="block text-sm font-semibold text-slate-700 mb-2">
                  Repetir contraseña
                </label>
                <div className="relative">
                  <input
                    type={showRepetir ? "text" : "password"}
                    id="password2"
                    placeholder="Repite tu contraseña"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
                    value={repetirPassword}
                    onChange={e => setRepetirPassword(e.target.value)}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowRepetir(!showRepetir)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showRepetir ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mt-2"
            >
              Crear cuenta
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/" className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function NexoLogo({ dark }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <span className={`text-xl font-bold tracking-tight ${dark ? 'text-slate-900' : 'text-white'}`}>Nexo</span>
    </div>
  )
}

function IconEye() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

export default Registrar
