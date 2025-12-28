import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'mail.tuterra.online',
    port: 465,
    secure: true, // SSL/TLS для порта 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    tls: {
        // Это необходимо для корректной работы SSL на многих хостингах
        rejectUnauthorized: false
    }
});

export const sendOTP = async (email: string, code: string) => {
    try {
        await transporter.sendMail({
            from: `"Tuterra" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Код подтверждения Tuterra',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333 text-align: center;">Вход в Tuterra</h2>
                    <p style="color: #666; font-size: 16px; text-align: center;">Ваш код подтверждения:</p>
                    <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4A6CF7;">${code}</span>
                    </div>
                </div>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error('SMTP Error:', error);
        return { success: false, error };
    }
};
