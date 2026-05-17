import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alerta from "../components/Alerta";
import clienteAxios from "../config/clienteAxios";
import useAuth from "../hooks/useAuth";

const FEATURES = [
  {
    text: "Gestión de proyectos en tiempo real",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    text: "Colaboración con equipos",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    text: "Seguimiento de tareas y estados",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [alerta, setAlerta] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const { setAuth } = useAuth();
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault();
    if ([email, password].includes('')) {
      setAlerta({ msg: 'Todos los campos son obligatorios', error: true });
      return
    }
    try {
      const { data } = await clienteAxios.post('/usuarios/login', { email, password })
      setAlerta({})
      localStorage.setItem('token', data.token)
      setAuth(data)
      navigate('/proyectos')
    } catch (error) {
      setAlerta({
        msg: error.response?.data?.msg ?? 'Error de conexión con el servidor',
        error: true
      })
    }
  }

  const { msg } = alerta

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 relative overflow-hidden flex-col justify-between p-12">
        {/* Dots background pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600 rounded-full opacity-10" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-violet-600 rounded-full opacity-10" />
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-indigo-500 rounded-full opacity-5 translate-x-1/2" />

        <div className="relative z-10">
          <NexoLogo textClass="text-white" />
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Gestiona proyectos,<br />
            <span className="text-indigo-400">conecta equipos.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Organiza tareas, colabora con tu equipo y lleva cada proyecto al siguiente nivel.
          </p>
          <div className="flex flex-col gap-4 pt-4">
            {FEATURES.map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(109,74,254,0.2)' }}
                >
                  <span style={{ color: '#a78bfa' }}>{feat.icon}</span>
                </div>
                <span className="text-slate-300 text-sm">{feat.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-600 text-xs">
          © {new Date().getFullYear()} Nexo. Todos los derechos reservados.
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-white">
        <div className="lg:hidden mb-10">
          <NexoLogo textClass="text-slate-900" />
        </div>

        <div className="w-full max-w-[420px] mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Bienvenido de vuelta</h2>
            <p className="text-slate-500">Ingresa a tu cuenta para continuar</p>
          </div>

          {msg && <Alerta alerta={alerta} />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                placeholder="tu@ejemplo.com"
                className="w-full px-4 py-3 rounded-[10px] border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-[3px] focus:ring-[#6d4afe] focus:border-transparent transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Contraseña
                </label>
                <Link
                  to="/olvide-password"
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-[3px] focus:ring-[#6d4afe] focus:border-transparent transition-all pr-12"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#6d4afe] text-white font-semibold rounded-[10px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6d4afe] focus:ring-offset-2 hover:brightness-110 hover:shadow-[0_4px_20px_rgba(109,74,254,0.4)]"
            >
              Iniciar sesión
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500 text-sm">
            ¿No tienes una cuenta?{' '}
            <Link to="/registrar" className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function NexoLogo({ textClass }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-[#6d4afe] rounded-xl flex items-center justify-center shadow-lg shadow-[#6d4afe]/30">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <span className={`text-xl font-bold tracking-tight ${textClass}`}>Nexo</span>
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

export default Login;
