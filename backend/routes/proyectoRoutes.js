import express from "express";
import {
    obtenerProyectos,
    obtenerProyecto,
    nuevoProyecto,
    editarProyecto,
    eliminarProyecto,
    agregarColaborador,
    eliminarColaborador,
    obtenerEtiquetas,
    crearEtiqueta,
    eliminarEtiqueta,
    obtenerSecciones,
    crearSeccion,
    actualizarSeccion,
    eliminarSeccion,
    reordenarSecciones,
} from "../contollers/proyectoController.js";
import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

router
    .route("/")
    .get(checkAuth, obtenerProyectos)
    .post(checkAuth, nuevoProyecto);

router
    .route('/:id')
    .get(checkAuth, obtenerProyecto)
    .put(checkAuth, editarProyecto)
    .delete(checkAuth, eliminarProyecto)

router.post('/agregar-colaborador/:id', checkAuth, agregarColaborador)
router.post('/eliminar-colaborador/:id', checkAuth, eliminarColaborador)

router.route('/:id/etiquetas')
    .get(checkAuth, obtenerEtiquetas)
    .post(checkAuth, crearEtiqueta)
router.delete('/:id/etiquetas/:etiquetaId', checkAuth, eliminarEtiqueta)

router.route('/:id/secciones')
    .get(checkAuth, obtenerSecciones)
    .post(checkAuth, crearSeccion)
router.put('/:id/secciones/reordenar', checkAuth, reordenarSecciones)
router.route('/:id/secciones/:seccionId')
    .put(checkAuth, actualizarSeccion)
    .delete(checkAuth, eliminarSeccion)

export default router;
