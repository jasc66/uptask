import { useState } from "react";
import { Link } from "react-router-dom";
import clienteAxios from "../config/clienteAxios";
import Alerta from "../components/Alerta";

const OlvidePassword = () => {
  const [email, setEmail] = useState("");
  const [alerta, setAlerta] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (email === "" || email.length < 6) {
      setAlerta({
        msg: "El Email es obligatorio",
        error: true,
      });
      return;
    }
    try {
      
      const { data } = await clienteAxios.post(`/usuarios/olvide-password`, { email })

      setAlerta({
        msg: data.msg,
        error: false
      })

    } catch (error) {
      setAlerta({
        msg: error.response.data.msg,
        error: true
      })
    }
  };

  const { msg } = alerta;

  return (
    <>
      <div className="relative flex flex-col justify-center min-h-screen overflow-hidden">
        <h1 className="text-green-800 font-black text-6xl capitalize text-center">
          Recupera tu acceso y no pierdas tus {""}{" "}
          <span className="next-slate-700">Tareas</span>
        </h1>
        <div className="w-full p-6 m-auto bg-white rounded-md shadow-xl lg:max-w-xl">
          <h1 className="text-3xl font-semibold text-center text-green-700 uppercase">
            MAG
          </h1>

          {msg && <Alerta alerta={alerta} />}

          <form
            className="my-10 shadow rounded-lg px-10 py-10"
            onSubmit={handleSubmit}
          >
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block mb-2 text-xl text-gray-700 font-bold"
              >
                Email
              </label>
              <input
                type="email"
                placeholder="Email de Registro"
                id="email"
                name="email"
                className="w-full p-3 mt-3 border border-gray-400 rounded-xl  bg-gray-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mt-6">
              <input
                type="submit"
                value="Enviar Instrucciones"
                className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-green-700 rounded-md hover:bg-green-600 focus:outline-none focus:bg-green-600 hover:cursor-pointer"
              ></input>
            </div>
          </form>
          <nav className="lg:flex lg:justify-between">
              <Link
                className="block text-center my-5 text-slate-500 uppercase text-sm"
                to="/registrar"
              >
                ¿No tienes una cuenta? Regístrate
              </Link>
              <Link
                className="block text-center my-5 text-slate-500 uppercase text-sm"
                to="/"
              >
                Ya tienes una cuenta? Inicia Sesión
              </Link>
            </nav>
        </div>
      </div>
    </>
  );
};

export default OlvidePassword;
