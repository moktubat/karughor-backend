import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

transporter.verify((error) => {
    if (error) {
        console.warn('⚠️ [Email] SMTP connection failed:', error.message);
    } else {
        console.log('✅ [Email] SMTP ready');
    }
});

export interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendMail = async ({ to, subject, html }: SendMailOptions): Promise<boolean> => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return false;
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || `Karughor <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        return true;
    } catch (err: any) {
        console.error(`❌ [Email] Failed to send to ${to}:`, err.message);
        return false;
    }
};

export default transporter;