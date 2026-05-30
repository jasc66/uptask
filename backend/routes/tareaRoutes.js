import express from "express"
import {
	agregarTarea,
	obtenerTarea,
	actualizarTarea,
	eliminarTarea,
	cambiarEstado,
	agregarComentario,
	obtenerMisTareas,
	agregarSubtarea,
	moverSeccion,
	agregarDependencia,
	eliminarDependencia,
	subirAdjunto,
	eliminarAdjunto,
} from "../contollers/tareaController.js";
import checkAuth from "../middleware/checkAuth.js";
import { uploadMiddleware } from "../middleware/cloudinaryUpload.js";

const router = express.Router();

router.get("/mis-tareas", checkAuth, obtenerMisTareas);
router.post("/", checkAuth, agregarTarea);
router
	.route('/:id')
	.get(checkAuth, obtenerTarea)
	.put(checkAuth, actualizarTarea)
	.delete(checkAuth, eliminarTarea)

router.post("/estado/:id", checkAuth, cambiarEstado);
router.post("/comentario/:id", checkAuth, agregarComentario);
router.post("/subtarea/:id", checkAuth, agregarSubtarea);
router.post("/mover-seccion/:id", checkAuth, moverSeccion);
router.post("/dependencia/:id", checkAuth, agregarDependencia);
router.delete("/dependencia/:id", checkAuth, eliminarDependencia);
router.post("/adjunto/:id", checkAuth, uploadMiddleware.single('archivo'), subirAdjunto);
router.delete("/adjunto/:id/:adjuntoId", checkAuth, eliminarAdjunto);

export default router;