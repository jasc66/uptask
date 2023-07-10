import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import axios from "axios"
import Alerta from "../components/Alerta"


const NuevoPassword = () => {
  
  const [password, setPassword] = useState({})
  const [tokenValido, setTokenValido ] = useState(false)
  const [alerta, setAlerta] = useState({})
  const [passwordModificado, setPasswordModificado] = useState(false)

  const params = useParams()
  const { token } = params

  useEffect(()=>{
    const comprobarToken = async () => {
      try {
        //TODO: MOVER HACIA UN CLIENTE AXIOS 
        await axios(`http://localhost:4000/api/usuarios/olvide-password/${token}`);
        setTokenValido(true)
      } catch (error) {
        setAlerta({
          msg: error.response.data.msg,
          error: true
        })
      }
    }
    comprobarToken();
  }, [token])

  const handleSubmit = async e => {
    e.preventDefault();

    if(password.length < 8 ){
      setAlerta({
        msg: 'El Password debe ser minimo de 8 caracteres',
        error: true
      })
      return
    }

    try {
      const url = `http://localhost:4000/api/usuarios/olvide-password/${token}`
      const { data } = await axios.post(url, { password })
      setAlerta({
        msg: data.msg,
        error: false
      })
      setPasswordModificado(true)
    } catch (error) {
      setAlerta({
        msg: error.response.data.msg,
        error:true
      })
    }
  }

  const { msg } = alerta

  return (
    <>    
    <div className="relative flex flex-col justify-center min-h-screen overflow-hidden">
    <h1 className="text-green-800 font-black text-6xl capitalize text-center">Reestablece tu password y no pierdas acceso a tus {''}<span className="next-slate-700">Tareas</span></h1>
    {msg && <Alerta alerta={alerta} />}
      <div className="w-full p-6 m-auto bg-white rounded-md shadow-xl lg:max-w-xl">
        <h1 className="text-3xl font-semibold text-center text-green-700 uppercase">
          MAG
        </h1>
        { tokenValido && ( 
          <form
           className="my-10 shadow rounded-lg px-10 py-10"
           onSubmit={handleSubmit}
           >

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
              value={password}
              onChange={e => setPassword(e.target.value)}
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
        )}
                  {passwordModificado && (
            <Link 
                className='block text-center my-5 text-slate-500 uppercase text-sm'
                to="/"
            >Inicia Sesión</Link>
          )}
      </div>
    </div>
    </>
  )
}

export default NuevoPassword
