import nodemailer from 'nodemailer';

// Попытка использовать альтернативные порты для обхода блокировок хостинга
const transporter = nodemailer.createTransport({
    host: 'mail.tuterra.online',
    // 2525 - часто используется как альтернатива 587 для обхода блокировок провайдеров
    port: 2525,
    secure: false, // STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
        rejectUnauthorized: false
    }
});

// Запасной транспорт для порта 465, если 2525 не сработает
const fallbackTransporter = nodemailer.createTransport({
    host: 'mail.tuterra.online',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: 10000,
    tls: { rejectUnauthorized: false }
});

export const sendOTP = async (email: string, code: string) => {
    try {
        console.log(`[Nodemailer] Trying port 2525...`);
        const info = await transporter.sendMail({
            from: `"Tuterra" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Ваш код для входа в Tuterra',
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; border: 1px solid #eee; border-radius: 16px; text-align: center;">
                    <h1 style="color: #4A6CF7; margin-bottom: 30px;">Tuterra</h1>
                    <p style="color: #333; font-size: 18px;">Ваш код подтверждения:</p>
                    <div style="display: inline-block; padding: 15px 30px; background-color: #f4f7ff; color: #1a1a1a; font-size: 32px; font-weight: bold; border-radius: 12px; letter-spacing: 5px; margin: 20px 0;">
                        ${code}
                    </div>
                </div>
            `,
        });
        return { success: true, data: info };
    } catch (e) {
        console.warn(`[Nodemailer] Port 2525 failed, trying 465...`);
        try {
            const info = await fallbackTransporter.sendMail({
                from: `"Tuterra" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Ваш код для входа в Tuterra',
                html: `<p>Код: ${code}</p>`,
            });
            return { success: true, data: info };
        } catch (error) {
            console.error('[Nodemailer] All ports failed:', (error as any).message);
            return { success: false, error };
        }
    }
};
