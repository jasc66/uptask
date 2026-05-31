import express from "express";
import {
    obtenerPlantillas,
    crearPlantillaDesdeProyecto,
    eliminarPlantilla,
} from "../contollers/plantillaController.js";
import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

router.get("/", checkAuth, obtenerPlantillas);
router.post("/desde-proyecto/:id", checkAuth, crearPlantillaDesdeProyecto);
router.delete("/:id", checkAuth, eliminarPlantilla);

export default router;
