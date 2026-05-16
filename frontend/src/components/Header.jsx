import { Link } from "react-router-dom"

const Header = () => {
  return (
    <header className="px-4 py-5 bg-white border-b">
        <div className="md:flex md:justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Nexo</h2>
            </div>
            <input 
            type="search"
            placeholder="Buscar Proyecto"
            className="rounded-lg lg:w-96 block p-2 border"
            >
            </input>

            <div className="flex items-center gap-4">
                <Link
                to="/proyectos"
                className="font-bold uppercase"
                >Poyectos</Link>
                
                <button
                type="button"
                className="text-white text-sm bg-green-600 p-3 rounded-md uppercase font-bold"
                >
                    Cerrar Sesión
                </button>
            </div>

        </div>

    </header>
  )
}

export default Header
