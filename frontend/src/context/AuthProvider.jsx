import { useState, useEffect, createContext} from 'react'
import { useNavigate } from 'react-router-dom'
import clienteAxios from '../config/clienteAxios';

const AuthContext = createContext();


const AuthProvider = ({children}) => {

    const [auth, setAuth ] = useState({})
    const [cargando, setCargando] = useState(true)

    const navigate = useNavigate()

    useEffect(() => {
        const autenticarUsuario = async () => {
            const token = localStorage.getItem('token')
            if(!token){
                setCargando(false)
                return
            }

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            try {
                const { data } = await clienteAxios('/usuarios/perfil', config)
                setAuth(data)
                // Solo redirigir si está en una ruta de auth (login/registro), no desde rutas protegidas
                if (window.location.pathname === '/' || window.location.pathname.startsWith('/olvide') || window.location.pathname.startsWith('/registrar') || window.location.pathname.startsWith('/confirmar')) {
                    navigate('/proyectos')
                }
            } catch (error) {
                setAuth({})
            }
            setCargando(false)
        }
        autenticarUsuario()
    }, [])

    return (
        <AuthContext.Provider
            value={{
                auth,
                setAuth,
                cargando
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export {
    AuthProvider
}

export default AuthContext;
