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
} from "../contollers/tareaController.js";
import checkAuth from "../middleware/checkAuth.js";

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

export default router;