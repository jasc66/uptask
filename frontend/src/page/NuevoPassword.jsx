
const NuevoPassword = () => {
  return (
    <>    
    <div className="relative flex flex-col justify-center min-h-screen overflow-hidden">
    <h1 className="text-green-800 font-black text-6xl capitalize text-center">Reestablece tu password y no pierdas acceso a tus {''}<span className="next-slate-700">Tareas</span></h1>
      <div className="w-full p-6 m-auto bg-white rounded-md shadow-xl lg:max-w-xl">
        <h1 className="text-3xl font-semibold text-center text-green-700 uppercase">
          MAG
        </h1>
        <form className="my-10 shadow rounded-lg px-10 py-10">

          <div className="mb-4">
            <label htmlFor="password" className="block mb-2 text-xl font-bold text-gray-700">
             Nuevo Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Escribe tu Nuevo Password"
              name="password"
              className="w-full p-3 mt-3 border border-gray-400 rounded-xl  bg-gray-50"
            />
          </div>
          <div className="mt-6">
            <input
                type="submit"
                value="Guardar tu Nuevo Password"
                className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-green-700 rounded-md hover:bg-green-600 focus:outline-none focus:bg-green-600 hover:cursor-pointer">
            </input>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

export default NuevoPassword
