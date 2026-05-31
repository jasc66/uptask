import express from "express";
import {
    obtenerPortafolios,
    crearPortafolio,
    obtenerPortafolio,
    actualizarPortafolio,
    eliminarPortafolio,
    agregarProyecto,
    quitarProyecto,
    crearMeta,
    actualizarMeta,
    eliminarMeta,
} from "../contollers/portafolioController.js";
import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

router.route('/').get(checkAuth, obtenerPortafolios).post(checkAuth, crearPortafolio);
router.route('/:id').get(checkAuth, obtenerPortafolio).put(checkAuth, actualizarPortafolio).delete(checkAuth, eliminarPortafolio);

router.post('/:id/proyectos', checkAuth, agregarProyecto);
router.delete('/:id/proyectos/:proyectoId', checkAuth, quitarProyecto);

router.post('/:id/metas', checkAuth, crearMeta);
router.route('/:id/metas/:metaId').put(checkAuth, actualizarMeta).delete(checkAuth, eliminarMeta);

export default router;
