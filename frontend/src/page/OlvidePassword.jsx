import { Link } from "react-router-dom";

const OlvidePassword = () => {
  return (
    <>    
    <div className="relative flex flex-col justify-center min-h-screen overflow-hidden">
    <h1 className="text-green-800 font-black text-6xl capitalize text-center">Recupera tu acceso y no pierdas tus {''} <span className="next-slate-700">Tareas</span></h1>
      <div className="w-full p-6 m-auto bg-white rounded-md shadow-xl lg:max-w-xl bg-gradient-to-br from-gray-400 via-lime-100 to-red-100">
        <h1 className="text-3xl font-semibold text-center text-green-700 uppercase">
          Palma Tica S.A
        </h1>
        <form className="my-10 shadow rounded-lg px-10 py-10">
        <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-xl text-gray-700 font-bold">
              Email
            </label>
            <input
              type="email"
              placeholder="Email de Registro"
              id="email"
              name="email"
              className="w-full p-3 mt-3 border border-gray-400 rounded-xl  bg-gray-50"
            />
          </div>
          <div className="mt-6">
            <input
                type="submit"
                value="Enviar Instrucciones"
                className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-green-700 rounded-md hover:bg-green-600 focus:outline-none focus:bg-green-600 hover:cursor-pointer">
            </input>
          </div>
          <nav className="lg:flex lg:justify-between">
            <Link className="block text-center my-5 text-slate-500 uppercase text-sm"
            to="/registrar">¿No tienes una cuenta? Regístrate
            </Link>
            <Link className="block text-center my-5 text-slate-500 uppercase text-sm"
            to="/">Ya tienes una cuenta? Inicia Sesión
            </Link>
        </nav>
        </form>
      </div>
    </div>
    </>
  )
}

export default OlvidePassword
