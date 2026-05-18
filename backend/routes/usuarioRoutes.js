import express from "express";
import {
    registrar,
    autenticar,
    confirmar,
    olvidePassword,
    comprobarToken,
    nuevoPassword,
    perfil,
    obtenerUsuarios,
    crearUsuarioAdmin,
    editarUsuario,
    eliminarUsuario,
} from "../contollers/usuarioController.js";
import checkAuth from "../middleware/checkAuth.js";
import checkAdmin from "../middleware/checkAdmin.js";

const router = express.Router();

// Autenticación, registro y confirmación
router.post('/', registrar);
router.post('/login', autenticar);
router.get('/confirmar/:token', confirmar);
router.post('/olvide-password', olvidePassword);
router.route("/olvide-password/:token").get(comprobarToken).post(nuevoPassword);
router.get('/perfil', checkAuth, perfil);

// Admin: gestión de usuarios
router.get('/admin/lista', checkAuth, checkAdmin, obtenerUsuarios);
router.post('/admin/crear', checkAuth, checkAdmin, crearUsuarioAdmin);
router.put('/admin/:id', checkAuth, checkAdmin, editarUsuario);
router.delete('/admin/:id', checkAuth, checkAdmin, eliminarUsuario);

export default router;
