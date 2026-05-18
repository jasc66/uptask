import { useState, useEffect } from "react";
import { useParams, Link } from 'react-router-dom';
import clienteAxios from "../config/clienteAxios";

const STEPS = [
  'Registra tu cuenta con tu correo',
  'Confirma tu dirección de email',
  'Inicia sesión y crea tu primer proyecto',
];

const ConfirmarCuenta = () => {
  const [cargando, setCargando] = useState(true);
  const [cuentaConfirmada, setCuentaConfirmada] = useState(false);
  const [msg, setMsg] = useState('');

  const { id } = useParams();

  useEffect(() => {
    const confirmarCuenta = async () => {
      try {
        const { data } = await clienteAxios(`/usuarios/confirmar/${id}`);
        setMsg(data.msg);
        setCuentaConfirmada(true);
      } catch (err) {
        setMsg(err.response?.data?.msg ?? 'El enlace de confirmación no es válido o ya expiró.');
      } finally {
        setCargando(false);
      }
    };
    confirmarCuenta();
  }, [id]);

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 relative overflow-hidden flex-col justify-between p-12">
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
            Un paso más para<br />
            <span className="text-indigo-400">empezar a colaborar.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Confirma tu correo para activar tu cuenta y acceder a todas las funciones de Nexo.
          </p>
          <div className="flex flex-col gap-4 pt-4">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ backgroundColor: 'rgba(109,74,254,0.2)', color: '#a78bfa' }}
                >
                  {i + 1}
                </div>
                <span className="text-slate-300 text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-600 text-xs">
          © {new Date().getFullYear()} Nexo. Todos los derechos reservados.
        </p>
      </div>

      {/* Panel derecho — estado */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-white">
        <div className="lg:hidden mb-10">
          <NexoLogo textClass="text-slate-900" />
        </div>

        <div className="w-full max-w-[420px] mx-auto">
          {cargando ? (
            <LoadingState />
          ) : cuentaConfirmada ? (
            <SuccessState msg={msg} />
          ) : (
            <ErrorState msg={msg} />
          )}
        </div>
      </div>
    </div>
  );
};

function LoadingState() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-[#6d4afe] animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Verificando tu cuenta</h2>
      <p className="text-slate-500">Por favor espera un momento…</p>
    </div>
  );
}

function SuccessState({ msg }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Cuenta confirmada!</h2>
      <p className="text-slate-500 mb-8">{msg}</p>
      <Link
        to="/"
        className="block w-full py-3 px-4 bg-[#6d4afe] text-white font-semibold rounded-[10px] text-center transition-all duration-200 hover:brightness-110 hover:shadow-[0_4px_20px_rgba(109,74,254,0.4)] focus:outline-none focus:ring-2 focus:ring-[#6d4afe] focus:ring-offset-2"
      >
        Iniciar sesión
      </Link>
    </div>
  );
}

function ErrorState({ msg }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Enlace inválido</h2>
      <p className="text-slate-500 mb-8">{msg}</p>
      <Link
        to="/registrar"
        className="block w-full py-3 px-4 bg-[#6d4afe] text-white font-semibold rounded-[10px] text-center transition-all duration-200 hover:brightness-110 hover:shadow-[0_4px_20px_rgba(109,74,254,0.4)] focus:outline-none focus:ring-2 focus:ring-[#6d4afe] focus:ring-offset-2"
      >
        Volver a registrarse
      </Link>
    </div>
  );
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
  );
}

export default ConfirmarCuenta;
