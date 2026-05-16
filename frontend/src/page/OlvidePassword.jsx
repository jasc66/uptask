import { useState } from "react";
import { Link } from "react-router-dom";
import clienteAxios from "../config/clienteAxios";
import Alerta from "../components/Alerta";

const OlvidePassword = () => {
  const [email, setEmail] = useState("");
  const [alerta, setAlerta] = useState({});

  const handleSubmit = async e => {
    e.preventDefault();
    if (email === "" || email.length < 6) {
      setAlerta({ msg: "El email es obligatorio", error: true });
      return;
    }
    try {
      const { data } = await clienteAxios.post(`/usuarios/olvide-password`, { email })
      setAlerta({ msg: data.msg, error: false })
    } catch (error) {
      setAlerta({ msg: error.response.data.msg, error: true })
    }
  };

  const { msg } = alerta;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Nexo</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">¿Olvidaste tu contraseña?</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Ingresa tu correo y te enviaremos las instrucciones para recuperar tu acceso.
            </p>
          </div>

          {msg && <Alerta alerta={alerta} />}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Enviar instrucciones
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link to="/" className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
              ← Volver al login
            </Link>
            <Link to="/registrar" className="text-slate-500 hover:text-slate-700 transition-colors">
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OlvidePassword;
