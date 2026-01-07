import nodemailer from 'nodemailer';

const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpHost = process.env.SMTP_HOST || 'smtp.timeweb.ru';

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    },
    // For non-465 ports, ensure we upgrade to TLS
    requireTLS: smtpPort !== 465,
    pool: true,
    maxConnections: 3,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000
});

console.log(`📡 Mailer initialized: ${smtpHost}:${smtpPort} (Secure: ${smtpPort === 465})`);

export const sendOTP = async (email: string, code: string) => {
    try {
        await transporter.sendMail({
            from: `"Tuterra" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Ваш код входа — Tuterra',
            html: `
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta name="color-scheme" content="light dark">
                    <meta name="supported-color-schemes" content="light dark">
                    <style>
                        :root { color-scheme: light dark; supported-color-schemes: light dark; }
                        @media screen and (max-width: 480px) {
                            .container { border-radius: 16px !important; }
                            .header { padding: 32px 20px !important; }
                            .content { padding: 32px 20px !important; }
                            .code { font-size: 36px !important; letter-spacing: 8px !important; }
                            .title { font-size: 24px !important; }
                        }
                        @media (prefers-color-scheme: dark) {
                            .body { background-color: #0f172a !important; }
                            .container { background-color: #1e293b !important; border-color: #334155 !important; box-shadow: 0 10px 40px rgba(0,0,0,0.3) !important; }
                            .title { color: #f8fafc !important; }
                            .description { color: #94a3b8 !important; }
                            .code-box { background-color: #0f172a !important; border-color: #334155 !important; }
                            .code { color: #60a5fa !important; }
                            .footer { background-color: #1e293b !important; border-color: #334155 !important; }
                            .footer-text { color: #64748b !important; }
                            .badge { background-color: rgba(96, 165, 250, 0.15) !important; color: #60a5fa !important; }
                        }
                    </style>
                </head>
                <body class="body" style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px 0;">
                    <div class="container" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(74, 108, 247, 0.08); border: 1px solid #f1f5f9;">
                        <!-- Header -->
                        <div class="header" style="background: linear-gradient(135deg, #4A6CF7 0%, #1738c9 100%); padding: 48px 40px; text-align: center; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">Tuterra</h1>
                            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; font-weight: 400;">Профессиональное управление занятиями</p>
                        </div>
                        
                        <!-- Content -->
                        <div class="content" style="padding: 48px 40px; text-align: center;">
                            <div class="badge" style="display: inline-block; padding: 6px 16px; background-color: rgba(74, 108, 247, 0.08); color: #4A6CF7; border-radius: 100px; font-size: 12px; font-weight: 700; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px;">
                                Подтверждение входа
                            </div>
                            
                            <h2 class="title" style="font-size: 26px; color: #0f172a; margin: 0 0 16px 0; font-weight: 800; letter-spacing: -0.5px;">Ваш одноразовый код</h2>
                            
                            <p class="description" style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 auto 32px auto;">
                                Введите этот код, чтобы войти в свой кабинет.
                            </p>
                            
                            <!-- OTP Box -->
                            <div class="code-box" style="background: #f8fafc; padding: 32px 10px; border-radius: 20px; border: 2px dashed #e2e8f0; margin: 32px 0;">
                                <div class="code" style="font-size: 48px; color: #4A6CF7; font-weight: 800; letter-spacing: 12px; font-family: 'Monaco', 'Courier New', monospace; line-height: 1; margin-left: 12px;">
                                    ${code}
                                </div>
                            </div>
                            
                            <p class="description" style="color: #94a3b8; font-size: 14px; font-weight: 500;">
                                Код действителен <span style="font-weight: 700;">10 минут</span>
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div class="footer" style="padding: 32px 20px; background: #fdfdfe; text-align: center; border-top: 1px solid #f1f5f9;">
                            <p class="footer-text" style="margin: 0; color: #64748b; font-size: 14px; font-weight: 600;">© ${new Date().getFullYear()} Tuterra.online</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error('SMTP Error:', error);
        return { success: false, error };
    }
};

export const sendReferralBonusEmail = async (email: string, userName: string, friendName: string) => {
    try {
        await transporter.sendMail({
            from: `"Tuterra" <${process.env.SMTP_USER}>`,
            to: email,
            subject: '🎁 Поздравляем! Вам начислен бонус — Tuterra',
            html: `
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @media screen and (max-width: 480px) {
                            .container { border-radius: 16px !important; }
                            .header { padding: 32px 20px !important; }
                            .content { padding: 32px 20px !important; }
                        }
                    </style>
                </head>
                <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px 0;">
                    <div class="container" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(74, 108, 247, 0.08); border: 1px solid #f1f5f9;">
                        <!-- Header -->
                        <div class="header" style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 48px 40px; text-align: center; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">Tuterra</h1>
                            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; font-weight: 400;">Подарок для вас!</p>
                        </div>
                        
                        <!-- Content -->
                        <div class="content" style="padding: 48px 40px; text-align: center;">
                            <div style="font-size: 64px; margin-bottom: 24px;">🎁</div>
                            
                            <h2 style="font-size: 26px; color: #0f172a; margin: 0 0 16px 0; font-weight: 800; letter-spacing: -0.5px;">Здравствуйте, ${userName}!</h2>
                            
                            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 auto 32px auto;">
                                Ваш коллега <strong>${friendName}</strong> активно начал пользоваться Tuterra! 
                                По условиям реферальной программы, мы начислили вам <strong>30 дней PRO-подписки</strong> за это приглашение.
                            </p>
                            
                            <div style="background: #fffbeb; padding: 24px; border-radius: 20px; border: 1px solid #fef3c7; margin: 32px 0;">
                                <div style="font-size: 20px; color: #f59e0b; font-weight: 800; line-height: 1.4;">
                                    Ваш статус обновлен: +30 дней PRO
                                </div>
                            </div>
                            
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=referral" 
                               style="display: inline-block; padding: 16px 32px; background-color: #4A6CF7; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px;">
                                Проверить в кабинете
                            </a>
                        </div>
                        
                        <!-- Footer -->
                        <div class="footer" style="padding: 32px 20px; background: #fdfdfe; text-align: center; border-top: 1px solid #f1f5f9;">
                            <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 600;">© ${new Date().getFullYear()} Tuterra.online</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error('SMTP Referral Error:', error);
        return { success: false, error };
    }
};
