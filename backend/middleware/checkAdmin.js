const checkAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ msg: "Acción no permitida" });
  }
  next();
};

export default checkAdmin;
