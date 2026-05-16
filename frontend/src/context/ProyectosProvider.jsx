import { useState, useEffect, createContext } from "react";
import clienteAxios from "../config/clienteAxios";

const ProyectoContext = createContext();

const ProyectosProvider = ({children}) => {

    const [proyectos, setProyectos] = useState([])
    const [alerta, setAlerta] = useState({})
    const [proyecto, setProyecto] = useState({})
    const [cargando, setCargando] = useState(false)
    const [modalFormularioProyecto, setModalFormularioProyecto] = useState(false)
    const [proyectoEditar, setProyectoEditar] = useState({})
    const [modalFormularioTarea, setModalFormularioTarea] = useState(false)
    const [tareaEditar, setTareaEditar] = useState({})

    useEffect(()=>{
        const obtenerProyectos = async () => {
            try {
                const token = localStorage.getItem('token')
                if(!token) return
    
                const config = {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
                const { data } = await clienteAxios('/proyectos', config)
                setProyectos(data)
    
            } catch (error) {
                console.log(error)        
            }
        }
        obtenerProyectos()
    }, [])

    const mostrarAlerta = alerta => {
        setAlerta(alerta)
        setTimeout(()=>{
            setAlerta({})
        }, 5000)
    }

    const submitProyecto = async proyecto => {

        if(proyecto.id){
            await editarProyecto(proyecto)
        }else {
           await nuevoProyecto(proyecto)
        }

    }

    const editarProyecto = async proyecto => {
        try {
            const token = localStorage.getItem('token')
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const {data} = await clienteAxios.put(`/proyectos/${proyecto.id}`, proyecto, config)
            const proyectosActualizados = proyectos.map(proyectoState => proyectoState._id === data._id ? data : proyectoState)
            setProyectos(proyectosActualizados)
            mostrarAlerta({ msg: 'Proyecto actualizado correctamente', error: false })
            
        } catch (error) {
            console.log(error)
        }
    }
    const nuevoProyecto = async proyecto => {
            
        try {
            const token = localStorage.getItem('token')
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }

            const { data } = await clienteAxios.post('/proyectos', proyecto, config)
            setProyectos([...proyectos, data])
            mostrarAlerta({ msg: 'Proyecto creado correctamente', error: false })

        } catch (error) {
            console.log(error)
        }
    }

    const eliminarProyecto = async id => {
        try {
            const token = localStorage.getItem('token')
            if(!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.delete(`/proyectos/${id}`, config)
            setProyectos(proyectos.filter(p => p._id !== id))
            mostrarAlerta({ msg: data.msg, error: false })
        } catch (error) {
            console.log(error)
        }
    }

    const handleModalFormulario = () => {
        setProyectoEditar({})
        setModalFormularioProyecto(!modalFormularioProyecto)
    }

    const handleModalEditarProyecto = (proyecto) => {
        setProyectoEditar(proyecto)
        setModalFormularioProyecto(true)
    }

    const handleModalTarea = () => {
        setTareaEditar({})
        setModalFormularioTarea(!modalFormularioTarea)
    }

    const handleModalEditarTarea = (tarea) => {
        setTareaEditar(tarea)
        setModalFormularioTarea(true)
    }

    const submitTarea = async (tarea) => {
        if (tarea.id) {
            await editarTarea(tarea)
        } else {
            await agregarTarea(tarea)
        }
    }

    const agregarTarea = async (tarea) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post('/tareas', tarea, config)
            setProyecto(prev => ({ ...prev, tareas: [...(prev.tareas ?? []), data] }))
            mostrarAlerta({ msg: 'Tarea creada correctamente', error: false })
            setModalFormularioTarea(false)
        } catch (error) {
            console.log(error)
        }
    }

    const editarTarea = async (tarea) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.put(`/tareas/${tarea.id}`, tarea, config)
            setProyecto(prev => ({
                ...prev,
                tareas: prev.tareas.map(t => t._id === data._id ? data : t)
            }))
            mostrarAlerta({ msg: 'Tarea actualizada correctamente', error: false })
            setModalFormularioTarea(false)
        } catch (error) {
            console.log(error)
        }
    }

    const eliminarTarea = async (id) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.delete(`/tareas/${id}`, config)
            setProyecto(prev => ({ ...prev, tareas: prev.tareas.filter(t => t._id !== id) }))
            mostrarAlerta({ msg: data.msg, error: false })
        } catch (error) {
            console.log(error)
        }
    }

    const obtenerProyecto = async id => {
        setCargando(true)
        try {
            const token = localStorage.getItem('token')
            if(!token) return

            const config = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
            const {data} = await clienteAxios(`/proyectos/${id}`, config)
            const {proyecto} = data
            setProyecto(proyecto)
        } catch (error) {
            console.log(error)
        }finally {
            setCargando(false)
        }
    }
    

    return (
        <ProyectoContext.Provider
            value={{
                proyectos,
                mostrarAlerta,
                alerta,
                submitProyecto,
                obtenerProyecto,
                proyecto,
                cargando,
                modalFormularioProyecto,
                handleModalFormulario,
                handleModalEditarProyecto,
                proyectoEditar,
                setProyectos,
                eliminarProyecto,
                modalFormularioTarea,
                handleModalTarea,
                handleModalEditarTarea,
                submitTarea,
                tareaEditar,
                eliminarTarea,
            }}
            >{children}

            </ProyectoContext.Provider>
    )
}

export {
    ProyectosProvider
}

export default ProyectoContext
