import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'mail.tuterra.online',
    port: 465,
    secure: true,
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

export const sendOTP = async (email: string, code: string) => {
    try {
        console.log(`[Nodemailer] Sending email to ${email}...`);

        const info = await transporter.sendMail({
            from: `"Tuterra" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Ваш код для входа в Tuterra',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #4A6CF7; margin: 0;">Tuterra</h1>
                    </div>
                    <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px; text-align: center;">
                        <p style="color: #333; font-size: 18px; margin-bottom: 20px;">Ваш код подтверждения для входа:</p>
                        <div style="display: inline-block; padding: 15px 30px; background-color: #4A6CF7; color: #ffffff; font-size: 32px; font-weight: bold; border-radius: 12px; letter-spacing: 5px;">
                            ${code}
                        </div>
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">Код действителен в течение 10 минут.</p>
                    </div>
                    <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
                        Если вы не запрашивали этот код, просто проигнорируйте это письмо.
                    </p>
                </div>
            `,
        });

        console.log(`[Nodemailer] Message sent: %s`, info.messageId);
        return { success: true, data: info };
    } catch (error) {
        console.error('[Nodemailer] CRITICAL ERROR:', error);
        return { success: false, error };
    }
};
