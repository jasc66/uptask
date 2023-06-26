import express from "express";
import { registrar, autenticar } from "../contollers/usuarioController.js";

const router = express.Router();

//Autenticación, registro y confirmación de Usuarios
router.post('/', registrar); //Crear un nuevo usuario 
router.post('/login', autenticar)


export default router