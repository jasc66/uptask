import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

const frontendUrl = () =>
    (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();

const FROM = 'Nexo <onboarding@resend.dev>';

export const emailRegistro = async (datos) => {
    const { email, nombre, token } = datos;

    await getResend().emails.send({
        from: FROM,
        to: email,
        subject: "Nexo - Comprueba tu cuenta",
        html: `
            <p>Hola ${nombre}, comprueba tu cuenta en Nexo</p>
            <p>Tu cuenta ya está casi lista, solo debes confirmarla en el siguiente enlace:</p>
            <a href="${frontendUrl()}/confirmar/${token}">Comprobar Cuenta</a>
            <p>Si tú no creaste esta cuenta, puedes ignorar el mensaje</p>
        `
    });
};

export const emailOlvidePassword = async (datos) => {
    const { email, nombre, token } = datos;

    await getResend().emails.send({
        from: FROM,
        to: email,
        subject: "Nexo - Reestablece tu Password",
        html: `
            <p>Hola ${nombre}, has solicitado reestablecer tu password</p>
            <p>Sigue el siguiente enlace para generar un nuevo password:</p>
            <a href="${frontendUrl()}/olvide-password/${token}">Reestablecer Password</a>
            <p>Si tú no solicitaste este email, puedes ignorar el mensaje</p>
        `
    });
};

const escapeHtml = (v) =>
    String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const formatCell = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return Number.isInteger(v) ? v.toString() : v.toFixed(2);
    return String(v);
};

const renderTablaHtml = (datos) => {
    const columnas = datos?.columnas ?? [];
    const filas = datos?.filas ?? [];
    if (!filas.length) {
        return `<p style="color:#64748b;font-size:14px;">No hay datos para este período.</p>`;
    }
    const ths = columnas
        .map((c) => `<th style="text-align:left;padding:8px 12px;background:#eef2ff;color:#3730a3;font-weight:600;border-bottom:1px solid #c7d2fe;">${escapeHtml(c)}</th>`)
        .join('');
    const trs = filas
        .map((f) => {
            const tds = columnas
                .map((c) => `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#334155;">${escapeHtml(formatCell(f[c]))}</td>`)
                .join('');
            return `<tr>${tds}</tr>`;
        })
        .join('');
    return `
        <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
            <thead><tr>${ths}</tr></thead>
            <tbody>${trs}</tbody>
        </table>
    `;
};

const datosACsv = (datos) => {
    const columnas = datos?.columnas ?? [];
    const filas = datos?.filas ?? [];
    const escapar = (v) => {
        const s = formatCell(v);
        if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    const lineas = [columnas.join(',')];
    filas.forEach((f) => lineas.push(columnas.map((c) => escapar(f[c])).join(',')));
    return '﻿' + lineas.join('\n');
};

export const emailReporteProgramado = async ({ destinatarios, programado, reporte, datos }) => {
    if (!destinatarios?.length) return;

    const fechaEnvio = new Date().toLocaleString('es-MX', {
        dateStyle: 'long',
        timeStyle: 'short',
    });

    const tablaHtml = renderTablaHtml(datos);
    const subject = `Nexo · Reporte: ${reporte?.nombre ?? programado.nombre}`;

    const html = `
        <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
            <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <div style="background:#4f46e5;padding:20px 24px;color:#ffffff;">
                    <p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.85;">Nexo · Reporte programado</p>
                    <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;">${escapeHtml(reporte?.nombre ?? programado.nombre)}</h1>
                    ${reporte?.descripcion ? `<p style="margin:6px 0 0;font-size:13px;opacity:0.9;">${escapeHtml(reporte.descripcion)}</p>` : ''}
                </div>
                <div style="padding:20px 24px;">
                    <p style="margin:0 0 12px;color:#475569;font-size:13px;">
                        Enviado el ${escapeHtml(fechaEnvio)} · Frecuencia: ${escapeHtml(programado.frecuencia)}
                    </p>
                    ${tablaHtml}
                </div>
                <div style="background:#f1f5f9;padding:14px 24px;color:#64748b;font-size:12px;text-align:center;">
                    Generado automáticamente por Nexo. Inicia sesión para ver el detalle interactivo.
                </div>
            </div>
        </div>
    `;

    const attachments =
        programado.formato === 'csv'
            ? [
                  {
                      filename: `${(reporte?.nombre ?? 'reporte').replace(/[^a-z0-9-_]+/gi, '_')}.csv`,
                      content: Buffer.from(datosACsv(datos)).toString('base64'),
                  },
              ]
            : undefined;

    await getResend().emails.send({
        from: FROM,
        to: destinatarios,
        subject,
        html,
        attachments,
    });
};
