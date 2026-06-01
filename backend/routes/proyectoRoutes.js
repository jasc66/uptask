import express from "express";
import {
    obtenerProyectos,
    obtenerProyecto,
    nuevoProyecto,
    editarProyecto,
    eliminarProyecto,
    agregarColaborador,
    eliminarColaborador,
    obtenerCampos,
    crearCampo,
    actualizarCampo,
    eliminarCampo,
    obtenerEtiquetas,
    crearEtiqueta,
    eliminarEtiqueta,
    obtenerSecciones,
    crearSeccion,
    actualizarSeccion,
    eliminarSeccion,
    reordenarSecciones,
    exportarProyecto,
    importarProyecto,
    agregarStatusUpdate,
    crearProyectoDesdePlantilla,
} from "../contollers/proyectoController.js";
import {
    obtenerAutomatizaciones,
    crearAutomatizacion,
    actualizarAutomatizacion,
    eliminarAutomatizacion,
    toggleAutomatizacion,
} from "../contollers/automatizacionController.js";
import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

router
    .route("/")
    .get(checkAuth, obtenerProyectos)
    .post(checkAuth, nuevoProyecto);

router.post('/importar', checkAuth, importarProyecto);

router
    .route('/:id')
    .get(checkAuth, obtenerProyecto)
    .put(checkAuth, editarProyecto)
    .delete(checkAuth, eliminarProyecto)

router.get('/:id/exportar', checkAuth, exportarProyecto);

router.post('/agregar-colaborador/:id', checkAuth, agregarColaborador)
router.post('/eliminar-colaborador/:id', checkAuth, eliminarColaborador)

router.route('/:id/campos')
    .get(checkAuth, obtenerCampos)
    .post(checkAuth, crearCampo)
router.route('/:id/campos/:campoId')
    .put(checkAuth, actualizarCampo)
    .delete(checkAuth, eliminarCampo)

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

router.post('/desde-plantilla/:plantillaId', checkAuth, crearProyectoDesdePlantilla);
router.post('/:id/status-update', checkAuth, agregarStatusUpdate);

router.route('/:id/automatizaciones')
    .get(checkAuth, obtenerAutomatizaciones)
    .post(checkAuth, crearAutomatizacion);
router.route('/:id/automatizaciones/:automatizacionId')
    .put(checkAuth, actualizarAutomatizacion)
    .delete(checkAuth, eliminarAutomatizacion);
router.post('/:id/automatizaciones/:automatizacionId/toggle', checkAuth, toggleAutomatizacion);

export default router;
