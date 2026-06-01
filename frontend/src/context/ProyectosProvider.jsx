import { useState, useEffect, useRef, useContext } from "react";
import clienteAxios from "../config/clienteAxios";
import AuthContext from "./AuthProvider";
import ProyectoContext from "./ProyectoContext";
import { marcarProgresoOnboarding } from "../hooks/useOnboarding";

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
    const [plantillas, setPlantillas] = useState([])
    const [camposProyecto, setCamposProyecto] = useState([])
    const [portafolios, setPortafolios] = useState([])
    const [portafolioActual, setPortafolioActual] = useState(null)
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
            marcarProgresoOnboarding('crear_proyecto')

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
            marcarProgresoOnboarding('crear_tarea')
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
            const [{ data }, { data: etiquetas }, { data: seccionesData }, { data: camposData }] = await Promise.all([
                clienteAxios(`/proyectos/${id}`, config),
                clienteAxios(`/proyectos/${id}/etiquetas`, config),
                clienteAxios(`/proyectos/${id}/secciones`, config),
                clienteAxios(`/proyectos/${id}/campos`, config),
            ])
            setProyecto(data.proyecto)
            setEtiquetasProyecto(etiquetas)
            setSecciones(seccionesData)
            setCamposProyecto(camposData)
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

    const crearCampo = async (proyectoId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/proyectos/${proyectoId}/campos`, datos, config)
            setCamposProyecto(prev => [...prev, data])
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al crear campo', error: true })
        }
    }

    const actualizarCampo = async (proyectoId, campoId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.put(`/proyectos/${proyectoId}/campos/${campoId}`, datos, config)
            setCamposProyecto(prev => prev.map(c => c._id === campoId ? data : c))
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al actualizar campo', error: true })
        }
    }

    const eliminarCampo = async (proyectoId, campoId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.delete(`/proyectos/${proyectoId}/campos/${campoId}`, config)
            setCamposProyecto(prev => prev.filter(c => c._id !== campoId))
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al eliminar campo', error: true })
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
            if (estado === 'Completada') marcarProgresoOnboarding('completar_tarea')
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

    const exportarProyecto = async (proyectoId, nombreProyecto) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            }
            const { data } = await clienteAxios.get(`/proyectos/${proyectoId}/exportar`, config)
            const url = URL.createObjectURL(data)
            const a = document.createElement('a')
            a.href = url
            a.download = `${(nombreProyecto || 'proyecto').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_nexo.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            mostrarAlerta({ msg: 'Error al exportar el proyecto', error: true })
        }
    }

    const importarProyecto = async (jsonData) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post('/proyectos/importar', jsonData, config)
            const { data: proyectosData } = await clienteAxios('/proyectos', config)
            setProyectos(proyectosData)
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al importar el proyecto', error: true })
            return null
        }
    }

    const agregarDependencia = async (tareaId, tareaDependenciaId, tipo) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(
                `/tareas/dependencia/${tareaId}`,
                { tareaDependenciaId, tipo },
                config
            )
            setProyecto(prev => ({
                ...prev,
                tareas: prev.tareas?.map(t => {
                    if (t._id === data.origen._id) return { ...t, dependencias: data.origen.dependencias }
                    if (t._id === data.destino._id) return { ...t, dependencias: data.destino.dependencias }
                    return t
                })
            }))
            setTareaDetalle(prev => prev && prev._id === data.origen._id
                ? { ...prev, dependencias: data.origen.dependencias }
                : prev
            )
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al agregar dependencia', error: true })
            return null
        }
    }

    const eliminarDependencia = async (tareaId, tareaDependenciaId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                data: { tareaDependenciaId },
            }
            const { data } = await clienteAxios.delete(`/tareas/dependencia/${tareaId}`, config)
            setProyecto(prev => ({
                ...prev,
                tareas: prev.tareas?.map(t => {
                    if (t._id === data.origen._id) return { ...t, dependencias: data.origen.dependencias }
                    if (t._id === data.destino._id) return { ...t, dependencias: data.destino.dependencias }
                    return t
                })
            }))
            setTareaDetalle(prev => prev && prev._id === data.origen._id
                ? { ...prev, dependencias: data.origen.dependencias }
                : prev
            )
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al eliminar dependencia', error: true })
            return null
        }
    }

    const subirAdjunto = async (tareaId, archivo) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const formData = new FormData()
            formData.append('archivo', archivo)
            const config = { headers: { Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/tareas/adjunto/${tareaId}`, formData, config)
            setTareaDetalle(prev => ({
                ...prev,
                adjuntos: [...(prev?.adjuntos ?? []), data],
            }))
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al subir el archivo', error: true })
            return null
        }
    }

    const eliminarAdjunto = async (tareaId, adjuntoId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.delete(`/tareas/adjunto/${tareaId}/${adjuntoId}`, config)
            setTareaDetalle(prev => ({
                ...prev,
                adjuntos: prev?.adjuntos?.filter(a => a._id !== adjuntoId) ?? [],
            }))
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al eliminar el archivo', error: true })
        }
    }

    const agregarStatusUpdate = async (proyectoId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/proyectos/${proyectoId}/status-update`, datos, config)
            setProyecto(prev => ({
                ...prev,
                statusUpdates: [...(prev.statusUpdates ?? []), data],
            }))
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al publicar el status update', error: true })
            return null
        }
    }

    const obtenerPlantillas = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios('/plantillas', config)
            setPlantillas(data)
            return data
        } catch (error) {
            console.log(error)
            return []
        }
    }

    const crearPlantillaDesdeProyecto = async (proyectoId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/plantillas/desde-proyecto/${proyectoId}`, datos, config)
            setPlantillas(prev => [...prev, data])
            mostrarAlerta({ msg: `Plantilla "${data.nombre}" guardada correctamente`, error: false })
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al guardar la plantilla', error: true })
            return null
        }
    }

    const eliminarPlantilla = async (plantillaId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.delete(`/plantillas/${plantillaId}`, config)
            setPlantillas(prev => prev.filter(p => p._id !== plantillaId))
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al eliminar la plantilla', error: true })
        }
    }

    const crearProyectoDesdePlantilla = async (plantillaId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/proyectos/desde-plantilla/${plantillaId}`, datos, config)
            const { data: proyectosData } = await clienteAxios('/proyectos', config)
            setProyectos(proyectosData)
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al crear el proyecto desde plantilla', error: true })
            return null
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

    // --- Integraciones ---
    const obtenerIntegraciones = async (proyectoId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return []
            const config = { headers: { Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios(`/proyectos/${proyectoId}/integraciones`, config)
            return data
        } catch (error) {
            console.log(error)
            return []
        }
    }

    const crearIntegracion = async (proyectoId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/proyectos/${proyectoId}/integraciones`, datos, config)
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al crear integración', error: true })
            return null
        }
    }

    const eliminarIntegracion = async (proyectoId, integracionId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.delete(`/proyectos/${proyectoId}/integraciones/${integracionId}`, config)
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al eliminar integración', error: true })
        }
    }

    const toggleIntegracion = async (proyectoId, integracionId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/proyectos/${proyectoId}/integraciones/${integracionId}/toggle`, {}, config)
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al cambiar estado', error: true })
            return null
        }
    }

    const testearIntegracion = async (proyectoId, integracionId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return false
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/proyectos/${proyectoId}/integraciones/${integracionId}/test`, {}, config)
            mostrarAlerta({ msg: data.msg, error: false })
            return true
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al testear integración', error: true })
            return false
        }
    }

    const descargarIcal = async (proyectoId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/proyectos/${proyectoId}/ical`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Error al generar iCal')
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `nexo-proyecto.ics`
            a.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            mostrarAlerta({ msg: 'Error al descargar el archivo iCal', error: true })
        }
    }

    // --- Automatizaciones ---
    const obtenerAutomatizaciones = async (proyectoId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return []
            const config = { headers: { Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios(`/proyectos/${proyectoId}/automatizaciones`, config)
            return data
        } catch (error) {
            console.log(error)
            return []
        }
    }

    const crearAutomatizacion = async (proyectoId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/proyectos/${proyectoId}/automatizaciones`, datos, config)
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al crear automatización', error: true })
            return null
        }
    }

    const actualizarAutomatizacion = async (proyectoId, automatizacionId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.put(`/proyectos/${proyectoId}/automatizaciones/${automatizacionId}`, datos, config)
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al actualizar automatización', error: true })
            return null
        }
    }

    const eliminarAutomatizacion = async (proyectoId, automatizacionId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.delete(`/proyectos/${proyectoId}/automatizaciones/${automatizacionId}`, config)
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al eliminar automatización', error: true })
        }
    }

    const toggleAutomatizacion = async (proyectoId, automatizacionId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/proyectos/${proyectoId}/automatizaciones/${automatizacionId}/toggle`, {}, config)
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al cambiar estado', error: true })
            return null
        }
    }

    // --- Portafolios ---
    const obtenerPortafolios = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios('/portafolios', config)
            setPortafolios(data)
        } catch (error) {
            console.log(error)
        }
    }

    const obtenerPortafolioById = async (id) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios(`/portafolios/${id}`, config)
            setPortafolioActual(data)
        } catch (error) {
            console.log(error)
        }
    }

    const crearPortafolio = async (datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post('/portafolios', datos, config)
            setPortafolios(prev => [...prev, data])
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al crear portafolio', error: true })
            return null
        }
    }

    const actualizarPortafolio = async (id, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.put(`/portafolios/${id}`, datos, config)
            setPortafolios(prev => prev.map(p => p._id === id ? { ...p, ...data } : p))
            setPortafolioActual(prev => prev?._id === id ? { ...prev, ...data } : prev)
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al actualizar portafolio', error: true })
        }
    }

    const eliminarPortafolio = async (id) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.delete(`/portafolios/${id}`, config)
            setPortafolios(prev => prev.filter(p => p._id !== id))
            if (portafolioActual?._id === id) setPortafolioActual(null)
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al eliminar portafolio', error: true })
        }
    }

    const agregarProyectoPortafolio = async (portafolioId, proyectoId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/portafolios/${portafolioId}/proyectos`, { proyectoId }, config)
            setPortafolioActual(prev => prev ? { ...prev, proyectos: [...(prev.proyectos ?? []), data] } : prev)
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al agregar proyecto', error: true })
        }
    }

    const quitarProyectoPortafolio = async (portafolioId, proyectoId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.delete(`/portafolios/${portafolioId}/proyectos/${proyectoId}`, config)
            setPortafolioActual(prev => prev ? { ...prev, proyectos: prev.proyectos.filter(p => p._id !== proyectoId) } : prev)
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al quitar proyecto', error: true })
        }
    }

    const crearMetaPortafolio = async (portafolioId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return null
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.post(`/portafolios/${portafolioId}/metas`, datos, config)
            setPortafolioActual(prev => prev ? { ...prev, metas: [...(prev.metas ?? []), data] } : prev)
            return data
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al crear meta', error: true })
            return null
        }
    }

    const actualizarMetaPortafolio = async (portafolioId, metaId, datos) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            const { data } = await clienteAxios.put(`/portafolios/${portafolioId}/metas/${metaId}`, datos, config)
            setPortafolioActual(prev => prev ? { ...prev, metas: prev.metas.map(m => m._id === metaId ? data : m) } : prev)
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al actualizar meta', error: true })
        }
    }

    const eliminarMetaPortafolio = async (portafolioId, metaId) => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            const config = { headers: { Authorization: `Bearer ${token}` } }
            await clienteAxios.delete(`/portafolios/${portafolioId}/metas/${metaId}`, config)
            setPortafolioActual(prev => prev ? { ...prev, metas: prev.metas.filter(m => m._id !== metaId) } : prev)
        } catch (error) {
            mostrarAlerta({ msg: error.response?.data?.msg || 'Error al eliminar meta', error: true })
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
            marcarProgresoOnboarding('agregar_colaborador')
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
                camposProyecto,
                crearCampo,
                actualizarCampo,
                eliminarCampo,
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
                exportarProyecto,
                importarProyecto,
                agregarDependencia,
                eliminarDependencia,
                subirAdjunto,
                eliminarAdjunto,
                agregarStatusUpdate,
                plantillas,
                obtenerPlantillas,
                crearPlantillaDesdeProyecto,
                eliminarPlantilla,
                crearProyectoDesdePlantilla,
                obtenerIntegraciones,
                crearIntegracion,
                eliminarIntegracion,
                toggleIntegracion,
                testearIntegracion,
                descargarIcal,
                obtenerAutomatizaciones,
                crearAutomatizacion,
                actualizarAutomatizacion,
                eliminarAutomatizacion,
                toggleAutomatizacion,
                portafolios,
                portafolioActual,
                obtenerPortafolios,
                obtenerPortafolioById,
                crearPortafolio,
                actualizarPortafolio,
                eliminarPortafolio,
                agregarProyectoPortafolio,
                quitarProyectoPortafolio,
                crearMetaPortafolio,
                actualizarMetaPortafolio,
                eliminarMetaPortafolio,
            }}
            >{children}

            </ProyectoContext.Provider>
    )
}

export { ProyectosProvider }
