import { useState, useEffect, useRef, useContext } from "react";
import clienteAxios from "../config/clienteAxios";
import AuthContext from "./AuthProvider";
import ProyectoContext from "./ProyectoContext";

const ProyectosProvider = ({children}) => {

    const { auth } = useContext(AuthContext)

    const [proyectos, setProyectos] = useState([])
    const [alerta, setAlerta] = useState({})
    const [proyecto, setProyecto] = useState({})
    const [cargando, setCargando] = useState(false)
    const [modalFormularioProyecto, setModalFormularioProyecto] = useState(false)
    const [proyectoEditar, setProyectoEditar] = useState({})
    const [modalFormularioTarea, setModalFormularioTarea] = useState(false)
    const [tareaEditar, setTareaEditar] = useState({})
    const [tareaDetalle, setTareaDetalle] = useState(null)
    const [misTareas, setMisTareas] = useState([])
    const [etiquetasProyecto, setEtiquetasProyecto] = useState([])
    const [secciones, setSecciones] = useState([])
    const prevAuthId = useRef(undefined)

    useEffect(()=>{
        const currentId = auth?._id
        const previousId = prevAuthId.current
        prevAuthId.current = currentId

        // Logout: was authenticated, now isn't — clear all state
        if (previousId && !currentId) {
            setProyectos([])
            setMisTareas([])
            setProyecto({})
            return
        }

        if (!currentId) return

        const token = localStorage.getItem('token')
        if(!token) return
        const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }

        const obtenerProyectos = async () => {
            try {
                const { data } = await clienteAxios('/proyectos', config)
                setProyectos(data)
            } catch (error) {
                console.log(error)
            }
        }

        const cargarMisTareas = async () => {
            try {
                const { data } = await clienteAxios('/tareas/mis-tareas', config)
                setMisTareas(data)
            } catch (error) {
                console.log(error)
            }
        }

        obtenerProyectos()
        cargarMisTareas()
    }, [auth?._id])

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
        setTareaDetalle(null)
        setModalFormularioTarea(!modalFormularioTarea)
    }

    const handleModalEditarTarea = async (tarea) => {
        setTareaEditar(tarea)
        setTareaDetalle(null)
        setModalFormularioTarea(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios(`/tareas/${tarea._id}`, config)
            setTareaDetalle(data)
        } catch (error) {
            console.log(error)
        }
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
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al crear la tarea', error: true })
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
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al actualizar la tarea', error: true })
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
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al eliminar la tarea', error: true })
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
            const [{ data }, { data: etiquetas }, { data: seccionesData }] = await Promise.all([
                clienteAxios(`/proyectos/${id}`, config),
                clienteAxios(`/proyectos/${id}/etiquetas`, config),
                clienteAxios(`/proyectos/${id}/secciones`, config),
            ])
            setProyecto(data.proyecto)
            setEtiquetasProyecto(etiquetas)
            setSecciones(seccionesData)
        } catch (error) {
            console.log(error)
        }finally {
            setCargando(false)
        }
    }

    const crearEtiqueta = async (proyectoId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/proyectos/${proyectoId}/etiquetas`, datos, config)
            setEtiquetasProyecto(prev => [...prev, data])
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al crear etiqueta', error: true })
        }
    }

    const eliminarEtiqueta = async (proyectoId, etiquetaId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.delete(`/proyectos/${proyectoId}/etiquetas/${etiquetaId}`, config)
            setEtiquetasProyecto(prev => prev.filter(e => e._id !== etiquetaId))
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al eliminar etiqueta', error: true })
        }
    }

    const agregarSubtarea = async (tareaId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/tareas/subtarea/${tareaId}`, datos, config)
            setTareaDetalle(prev => ({
                ...prev,
                subtareas: [...(prev?.subtareas ?? []), data]
            }))
            setProyecto(prev => ({
                ...prev,
                tareas: prev.tareas?.map(t =>
                    t._id === tareaId
                        ? { ...t, subtareas: [...(t.subtareas ?? []), data] }
                        : t
                )
            }))
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al crear subtarea', error: true })
        }
    }

    const cambiarEstadoSubtarea = async (subtareaId, tareaId, estado) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/tareas/estado/${subtareaId}`, { estado }, config)
            setTareaDetalle(prev => ({
                ...prev,
                subtareas: prev?.subtareas?.map(s => s._id === subtareaId ? { ...s, estado: data.estado } : s) ?? []
            }))
            setProyecto(prev => ({
                ...prev,
                tareas: prev.tareas?.map(t =>
                    t._id === tareaId
                        ? { ...t, subtareas: t.subtareas?.map(s => s._id === subtareaId ? { ...s, estado: data.estado } : s) ?? [] }
                        : t
                )
            }))
        } catch (error) {
            console.log(error)
        }
    }

    const cambiarEstadoTarea = async (tareaId, estado) => {
        if (!tareaId) return
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/tareas/estado/${tareaId}`, { estado }, config)
            setProyecto(prev => ({
                ...prev,
                tareas: prev.tareas.map(t => t._id === data._id ? { ...t, estado: data.estado } : t)
            }))
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al cambiar estado', error: true })
        }
    }

    const agregarComentario = async (tareaId, contenido) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/tareas/comentario/${tareaId}`, { contenido }, config)
            setTareaDetalle(prev => ({
                ...prev,
                actividad: [...(prev?.actividad ?? []), data]
            }))
        } catch (error) {
            console.log(error)
        }
    }

    const crearSeccion = async (proyectoId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/proyectos/${proyectoId}/secciones`, datos, config)
            setSecciones(prev => [...prev, data])
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al crear sección', error: true })
        }
    }

    const actualizarSeccion = async (proyectoId, seccionId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.put(`/proyectos/${proyectoId}/secciones/${seccionId}`, datos, config)
            setSecciones(prev => prev.map(s => s._id === seccionId ? data : s))
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al actualizar sección', error: true })
        }
    }

    const eliminarSeccion = async (proyectoId, seccionId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.delete(`/proyectos/${proyectoId}/secciones/${seccionId}`, config)
            setSecciones(prev => prev.filter(s => s._id !== seccionId))
            setProyecto(prev => ({
                ...prev,
                tareas: prev.tareas?.map(t =>
                    (t.seccion?._id ?? t.seccion) === seccionId ? { ...t, seccion: null } : t
                )
            }))
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al eliminar sección', error: true })
        }
    }

    const reordenarSecciones = async (proyectoId, orden) => {
        setSecciones(prev => {
            const mapa = Object.fromEntries(prev.map(s => [s._id, s]))
            return orden.map((id, idx) => ({ ...mapa[id], orden: idx })).filter(Boolean)
        })
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.put(`/proyectos/${proyectoId}/secciones/reordenar`, { orden }, config)
            setSecciones(data)
        } catch (error) {
            console.log(error)
        }
    }

    const actualizarFechaTarea = async (tareaId, fechaEntrega) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.put(`/tareas/${tareaId}`, { fechaEntrega }, config)
            setProyecto(prev => ({
                ...prev,
                tareas: prev.tareas?.map(t => t._id === data._id ? { ...t, fechaEntrega: data.fechaEntrega } : t)
            }))
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al actualizar la fecha', error: true })
        }
    }

    const moverTareaASeccion = async (tareaId, seccionId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            await clienteAxios.post(`/tareas/mover-seccion/${tareaId}`, { seccionId: seccionId || null }, config)
            setProyecto(prev => ({
                ...prev,
                tareas: prev.tareas?.map(t =>
                    t._id === tareaId
                        ? { ...t, seccion: seccionId ? { _id: seccionId } : null }
                        : t
                )
            }))
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al mover la tarea', error: true })
        }
    }

    const agregarColaborador = async (proyectoId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/proyectos/agregar-colaborador/${proyectoId}`, datos, config)
            mostrarAlerta({ msg: data.msg, error: false })
            await obtenerProyecto(proyectoId)
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al agregar colaborador', error: true })
        }
    }

    const eliminarColaborador = async (proyectoId, usuarioId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/proyectos/eliminar-colaborador/${proyectoId}`, { usuarioId }, config)
            mostrarAlerta({ msg: data.msg, error: false })
            await obtenerProyecto(proyectoId)
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al eliminar colaborador', error: true })
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
                agregarColaborador,
                eliminarColaborador,
                cambiarEstadoTarea,
                tareaDetalle,
                agregarComentario,
                misTareas,
                etiquetasProyecto,
                crearEtiqueta,
                eliminarEtiqueta,
                agregarSubtarea,
                cambiarEstadoSubtarea,
                secciones,
                setSecciones,
                crearSeccion,
                actualizarSeccion,
                eliminarSeccion,
                reordenarSecciones,
                moverTareaASeccion,
                actualizarFechaTarea,
            }}
            >{children}

            </ProyectoContext.Provider>
    )
}

export { ProyectosProvider }
