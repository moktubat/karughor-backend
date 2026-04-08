import nodemailer from 'nodemailer';

// ─────────────────────────────────────────────────────────────────────────────
// Karughor Email Service — Gmail SMTP (Free)
//
// Setup:
//  1. Go to https://myaccount.google.com/apppasswords
//  2. Select "Mail" + "Other (Custom name)" → Generate
//  3. Copy the 16-char App Password into .env
//
// .env variables needed:
//   EMAIL_HOST=smtp.gmail.com
//   EMAIL_PORT=587
//   EMAIL_USER=your@gmail.com
//   EMAIL_PASS=xxxx xxxx xxxx xxxx   ← Gmail App Password
//   EMAIL_FROM=Karughor <your@gmail.com>
// ─────────────────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // true for port 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verify connection on startup (logs only — won't crash the server)
transporter.verify((error) => {
    if (error) {
        console.warn('⚠️ [Email] SMTP connection failed:', error.message);
        console.warn('⚠️ [Email] Emails will NOT be sent until this is fixed.');
    } else {
        console.log('✅ [Email] SMTP connected — ready to send emails');
    }
});

export interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendMail = async ({ to, subject, html }: SendMailOptions): Promise<boolean> => {
    // Silently skip if credentials not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ [Email] EMAIL_USER / EMAIL_PASS not set — skipping email to:', to);
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || `Karughor <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`✅ [Email] Sent to ${to} — Message ID: ${info.messageId}`);
        return true;
    } catch (err: any) {
        console.error(`❌ [Email] Failed to send to ${to}:`, err.message);
        return false; // Never throw — email failure should not break API responses
    }
};

export default transporter;