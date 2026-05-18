const frontendUrl = () =>
    (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();

const sendEmail = async ({ to, subject, html }) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: { name: 'Nexo', email: process.env.EMAIL_USER },
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al enviar email');
    }
};

export const emailRegistro = async (datos) => {
    const { email, nombre, token } = datos;

    await sendEmail({
        to: email,
        subject: 'Nexo - Comprueba tu cuenta',
        html: `
            <p>Hola ${nombre}, comprueba tu cuenta en Nexo</p>
            <p>Tu cuenta ya está casi lista, solo debes confirmarla en el siguiente enlace:</p>
            <a href="${frontendUrl()}/confirmar/${token}">Comprobar Cuenta</a>
            <p>Si tú no creaste esta cuenta, puedes ignorar el mensaje</p>
        `,
    });
};

export const emailOlvidePassword = async (datos) => {
    const { email, nombre, token } = datos;

    await sendEmail({
        to: email,
        subject: 'Nexo - Reestablece tu Password',
        html: `
            <p>Hola ${nombre}, has solicitado reestablecer tu password</p>
            <p>Sigue el siguiente enlace para generar un nuevo password:</p>
            <a href="${frontendUrl()}/olvide-password/${token}">Reestablecer Password</a>
            <p>Si tú no solicitaste este email, puedes ignorar el mensaje</p>
        `,
    });
};
