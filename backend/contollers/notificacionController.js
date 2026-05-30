import Notificacion from "../models/Notificacion.js";

const listar = async (req, res) => {
    try {
        const { soloNoLeidas, limite = 50 } = req.query;
        const filtro = { usuario: req.usuario._id };
        if (soloNoLeidas === "true") filtro.leida = false;

        const items = await Notificacion.find(filtro)
            .sort({ createdAt: -1 })
            .limit(Math.min(Number(limite) || 50, 200))
            .populate("origen", "nombre")
            .populate("proyecto", "nombre color")
            .populate("tarea", "nombre")
            .lean();

        res.json(items);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: error.message });
    }
};

const contar = async (req, res) => {
    try {
        const noLeidas = await Notificacion.countDocuments({
            usuario: req.usuario._id,
            leida: false,
        });
        res.json({ noLeidas });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: error.message });
    }
};

const marcarLeida = async (req, res) => {
    try {
        const { id } = req.params;
        const noti = await Notificacion.findOne({ _id: id, usuario: req.usuario._id });
        if (!noti) return res.status(404).json({ msg: "Notificación no encontrada" });
        noti.leida = true;
        await noti.save();
        res.json(noti);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "ID no válido" });
    }
};

const marcarTodasLeidas = async (req, res) => {
    try {
        await Notificacion.updateMany(
            { usuario: req.usuario._id, leida: false },
            { $set: { leida: true } }
        );
        res.json({ msg: "Todas marcadas como leídas" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: error.message });
    }
};

const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const noti = await Notificacion.findOneAndDelete({
            _id: id,
            usuario: req.usuario._id,
        });
        if (!noti) return res.status(404).json({ msg: "Notificación no encontrada" });
        res.json({ msg: "Notificación eliminada" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "ID no válido" });
    }
};

export { listar, contar, marcarLeida, marcarTodasLeidas, eliminar };
