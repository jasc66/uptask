const TablaCargaUsuarios = ({ datos = [], cargando }) => {
  if (cargando) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-slate-100 rounded-full shrink-0" />
              <div className="flex-1 h-3 bg-slate-100 rounded" />
              <div className="w-12 h-3 bg-slate-100 rounded" />
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!datos.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-6">
        <p className="text-xs text-slate-400">Sin tareas asignadas a usuarios</p>
      </div>
    )
  }

  const max = Math.max(...datos.map(d => d.tareasAbiertas), 1)

  return (
    <div className="space-y-3">
      {datos.slice(0, 7).map(d => (
        <div key={d.usuario._id}>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">
              {d.usuario.nombre?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
            <span className="text-xs font-medium text-slate-700 truncate flex-1">{d.usuario.nombre}</span>
            <span className="text-xs text-slate-500 shrink-0">{d.tareasAbiertas} abiertas</span>
            {d.tareasVencidas > 0 && (
              <span className="text-xs text-red-500 shrink-0">{d.tareasVencidas} venc.</span>
            )}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.max((d.tareasAbiertas / max) * 100, d.tareasAbiertas > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default TablaCargaUsuarios
