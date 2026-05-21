import { useState, useRef, useEffect } from "react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import * as XLSX from "xlsx"
import useAuth from "../../hooks/useAuth"

const ExportMenu = ({ containerRef, datos = {}, tipo = 'global', nombreArchivo = 'Nexo-Reporte' }) => {
  const { auth } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const [exportando, setExportando] = useState(null)
  const menuRef = useRef(null)

  const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    const fn = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const exportarPDF = async () => {
    if (!containerRef?.current) return
    setExportando('pdf')
    setAbierto(false)
    try {
      const canvas = await html2canvas(containerRef.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 10
      const headerH = 14
      const footerH = 11
      const contentH = pageH - headerH - footerH

      const imgW = pageW - margin * 2
      const imgH = (canvas.height * imgW) / canvas.width
      const totalPages = Math.max(1, Math.ceil(imgH / contentH))

      const addHeaderFooter = (pageNum) => {
        pdf.setFillColor(99, 102, 241)
        pdf.rect(0, 0, pageW, 12, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(7.5)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Nexo · DGSC', margin, 8)
        pdf.setFont('helvetica', 'normal')
        pdf.text(fecha, pageW - margin, 8, { align: 'right' })

        pdf.setDrawColor(226, 232, 240)
        pdf.line(margin, pageH - 9, pageW - margin, pageH - 9)
        pdf.setTextColor(148, 163, 184)
        pdf.setFontSize(6.5)
        pdf.text(
          `Generado por ${auth.nombre ?? auth.email} · ${fecha}`,
          margin, pageH - 5
        )
        if (totalPages > 1) {
          pdf.text(`Pág. ${pageNum} / ${totalPages}`, pageW - margin, pageH - 5, { align: 'right' })
        } else {
          pdf.text('Nexo — Gestión de proyectos', pageW - margin, pageH - 5, { align: 'right' })
        }
      }

      for (let page = 1; page <= totalPages; page++) {
        if (page > 1) pdf.addPage()
        addHeaderFooter(page)
        const yImg = headerH - contentH * (page - 1)
        pdf.addImage(imgData, 'PNG', margin, yImg, imgW, imgH)
      }

      pdf.save(`${nombreArchivo}-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (e) {
      console.error('Error exportando PDF:', e)
    } finally {
      setExportando(null)
    }
  }

  const exportarExcel = () => {
    setExportando('excel')
    setAbierto(false)
    try {
      const wb = XLSX.utils.book_new()

      if (tipo === 'global') {
        if (datos.kpis) {
          const ws = XLSX.utils.json_to_sheet([{
            'Total Proyectos':    datos.kpis.totalProyectos ?? 0,
            'Proyectos Activos':  datos.kpis.proyectosActivos ?? 0,
            'Proyectos Atrasados': datos.kpis.proyectosAtrasados ?? 0,
            'Tareas Pendientes':  datos.kpis.tareasPendientes ?? 0,
            'Tareas Vencidas':    datos.kpis.tareasVencidas ?? 0,
            '% Cumplimiento':     datos.kpis.cumplimientoPct ?? 0,
            'Completadas (7d)':   datos.kpis.tareasCompletadasSemana ?? 0,
            'Vencidas (7d)':      datos.kpis.tareasVencidaSemana ?? 0,
          }])
          XLSX.utils.book_append_sheet(wb, ws, 'Resumen KPIs')
        }
        if (datos.proyectos?.length) {
          const ws = XLSX.utils.json_to_sheet(datos.proyectos.map(p => ({
            'Proyecto':      p.proyecto.nombre,
            'Total Tareas':  p.totalTareas,
            'Completadas':   p.completadas,
            'Atrasadas':     p.atrasadas,
            '% Progreso':    p.progresoPct,
            'Fecha Entrega': p.proyecto.fechaEntrega
              ? new Date(p.proyecto.fechaEntrega).toLocaleDateString('es-MX')
              : '',
          })))
          XLSX.utils.book_append_sheet(wb, ws, 'Proyectos')
        }
        if (datos.cargaUsuarios?.length) {
          const ws = XLSX.utils.json_to_sheet(datos.cargaUsuarios.map(u => ({
            'Usuario':        u.usuario.nombre,
            'Tareas Abiertas': u.tareasAbiertas,
            'Completadas':    u.tareasCompletadas,
            'Vencidas':       u.tareasVencidas,
          })))
          XLSX.utils.book_append_sheet(wb, ws, 'Carga Usuarios')
        }
      } else {
        if (datos.resumen) {
          const ws = XLSX.utils.json_to_sheet([{
            'Avance (%)':  datos.resumen.avancePct,
            'Total Tareas': datos.resumen.totalTareas,
            'Completadas': datos.resumen.completadas,
            'Pendientes':  datos.resumen.totalTareas - datos.resumen.completadas,
          }])
          XLSX.utils.book_append_sheet(wb, ws, 'Resumen')
        }
        if (datos.tareasPorEstado?.length) {
          const ws = XLSX.utils.json_to_sheet(datos.tareasPorEstado.map(e => ({
            'Estado':   e.estado,
            'Cantidad': e.count,
          })))
          XLSX.utils.book_append_sheet(wb, ws, 'Por Estado')
        }
        if (datos.tareasPorPrioridad?.length) {
          const ws = XLSX.utils.json_to_sheet(datos.tareasPorPrioridad.map(e => ({
            'Prioridad': e.prioridad,
            'Cantidad':  e.count,
          })))
          XLSX.utils.book_append_sheet(wb, ws, 'Por Prioridad')
        }
        if (datos.colaboradores?.length) {
          const ws = XLSX.utils.json_to_sheet(datos.colaboradores.map(c => ({
            'Nombre':    c.usuario.nombre,
            'Email':     c.usuario.email,
            'Rol':       c.rol,
            'Asignadas': c.asignadas,
            'Completadas': c.completadas,
            'Vencidas':  c.vencidas,
          })))
          XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores')
        }
      }

      if (wb.SheetNames.length === 0) return
      XLSX.writeFile(wb, `${nombreArchivo}-${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (e) {
      console.error('Error exportando Excel:', e)
    } finally {
      setExportando(null)
    }
  }

  const exportarCSV = () => {
    setExportando('csv')
    setAbierto(false)
    try {
      let headers = []
      let rows = []

      if (tipo === 'global' && datos.proyectos?.length) {
        headers = ['Proyecto', 'Total Tareas', 'Completadas', 'Atrasadas', '% Progreso', 'Fecha Entrega']
        rows = datos.proyectos.map(p => [
          p.proyecto.nombre,
          p.totalTareas,
          p.completadas,
          p.atrasadas,
          p.progresoPct,
          p.proyecto.fechaEntrega
            ? new Date(p.proyecto.fechaEntrega).toLocaleDateString('es-MX')
            : '',
        ])
      } else if (tipo === 'proyecto' && datos.colaboradores?.length) {
        headers = ['Nombre', 'Email', 'Rol', 'Asignadas', 'Completadas', 'Vencidas']
        rows = datos.colaboradores.map(c => [
          c.usuario.nombre,
          c.usuario.email,
          c.rol,
          c.asignadas,
          c.completadas,
          c.vencidas,
        ])
      }

      if (!rows.length) return

      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
      const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${nombreArchivo}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Error exportando CSV:', e)
    } finally {
      setExportando(null)
    }
  }

  const hayDatos = tipo === 'global'
    ? !!(datos.kpis || datos.proyectos?.length)
    : !!(datos.resumen || datos.tareasPorEstado?.length)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setAbierto(v => !v)}
        disabled={!!exportando || !hayDatos}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {exportando ? (
          <svg className="w-4 h-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        {exportando ? 'Exportando…' : 'Exportar'}
        {!exportando && (
          <svg
            className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${abierto ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-100/80 py-1 z-20">
          <button
            onClick={exportarPDF}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF
          </button>
          <button
            onClick={exportarExcel}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel (XLSX)
          </button>
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={exportarCSV}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
            </svg>
            CSV
          </button>
        </div>
      )}
    </div>
  )
}

export default ExportMenu
