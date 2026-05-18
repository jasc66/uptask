import nodemailer from "nodemailer";

const frontendUrl = () =>
    (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();

export const emailRegistro = async (datos) => {
    const { email, nombre, token } = datos;

    const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    });

    await transport.sendMail({
        from: `"Nexo" <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
        to: email,
        subject: "Nexo - Comprueba tu cuenta",
        text: "Comprueba tu cuenta en Nexo",
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

    const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    });

    await transport.sendMail({
        from: `"Nexo" <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
        to: email,
        subject: "Nexo - Reestablece tu Password",
        text: "Reestablece tu Password",
        html: `
            <p>Hola ${nombre}, has solicitado reestablecer tu password</p>
            <p>Sigue el siguiente enlace para generar un nuevo password:</p>
            <a href="${frontendUrl()}/olvide-password/${token}">Reestablecer Password</a>
            <p>Si tú no solicitaste este email, puedes ignorar el mensaje</p>
        `
    });
};
