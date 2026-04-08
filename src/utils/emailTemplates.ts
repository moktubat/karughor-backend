// ─────────────────────────────────────────────────────────────────────────────
// Karughor Email Templates
// Responsive, inline-styled HTML emails (works in all mail clients)
// ─────────────────────────────────────────────────────────────────────────────

const BRAND_COLOR = '#C85A3A';
const BRAND_DARK = '#A84830';
const BG_COLOR = '#F7F7F7';
const TEXT_DARK = '#0B0F0E';
const TEXT_MUTED = '#818B9C';
const BORDER_COLOR = '#E4E9EE';

// Shared wrapper layout
const wrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Karughor</title>
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG_COLOR};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER_COLOR};">

          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Karughor</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Handcrafted Treasures of Bangladesh</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${BG_COLOR};padding:24px 40px;text-align:center;border-top:1px solid ${BORDER_COLOR};">
              <p style="margin:0;color:${TEXT_MUTED};font-size:13px;">
                © ${new Date().getFullYear()} Karughor · Handcrafted in Bangladesh
              </p>
              <p style="margin:8px 0 0;color:${TEXT_MUTED};font-size:12px;">
                If you didn't request this email, please ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ── Helper: section divider ───────────────────────────────────────────────────
const divider = () =>
    `<hr style="border:none;border-top:1px solid ${BORDER_COLOR};margin:24px 0;" />`;

// ── Helper: info row ──────────────────────────────────────────────────────────
const infoRow = (label: string, value: string) => `
<tr>
  <td style="padding:8px 0;color:${TEXT_MUTED};font-size:14px;width:45%;">${label}</td>
  <td style="padding:8px 0;color:${TEXT_DARK};font-size:14px;font-weight:600;">${value}</td>
</tr>
`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. REGISTRATION WELCOME EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export interface WelcomeEmailData {
    fullName: string;
    phone: string;
    email: string;
}

export const welcomeEmailTemplate = ({ fullName, phone }: WelcomeEmailData): string => {
    const content = `
    <h2 style="margin:0 0 8px;color:${TEXT_DARK};font-size:22px;font-weight:700;">
      Welcome to Karughor! 🎉
    </h2>
    <p style="margin:0 0 24px;color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Hi <strong style="color:${TEXT_DARK};">${fullName}</strong>, your account has been created successfully.
      Discover Bangladesh's finest handcrafted products — jute rugs, nakshi kantha, traditional bags, and much more.
    </p>

    <div style="background:${BG_COLOR};border-radius:8px;padding:20px 24px;margin-bottom:24px;border:1px solid ${BORDER_COLOR};">
      <p style="margin:0 0 4px;font-size:13px;color:${TEXT_MUTED};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your Account</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Registered Phone', phone)}
      </table>
    </div>

    <div style="margin-bottom:24px;">
      <h3 style="margin:0 0 12px;color:${TEXT_DARK};font-size:16px;">What you can do:</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:${TEXT_MUTED};font-size:14px;">
            ✅&nbsp; Browse handcrafted products
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:${TEXT_MUTED};font-size:14px;">
            ✅&nbsp; Place orders with Cash on Delivery
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:${TEXT_MUTED};font-size:14px;">
            ✅&nbsp; Track your orders from your profile
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:${TEXT_MUTED};font-size:14px;">
            ✅&nbsp; Save favourites to your wishlist
          </td>
        </tr>
      </table>
    </div>

    <a href="${process.env.FRONTEND_URL || 'https://karughor.vercel.app'}/products"
       style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;">
      Start Shopping →
    </a>
  `;

    return wrapper(content);
};


// ─────────────────────────────────────────────────────────────────────────────
// 2. ORDER CONFIRMATION EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export interface OrderEmailData {
    customerName: string;
    orderNumber: string;
    items: {
        productName: string;
        quantity: number;
        price: number;
        subtotal: number;
    }[];
    subtotal: number;
    deliveryCharge: number;
    total: number;
    deliveryLocation: 'inside_dhaka' | 'outside_dhaka';
    address: {
        street?: string;
        area?: string;
        city?: string;
    };
    customerNotes?: string;
}

export const orderConfirmationTemplate = (data: OrderEmailData): string => {
    const {
        customerName, orderNumber, items, subtotal,
        deliveryCharge, total, deliveryLocation, address, customerNotes
    } = data;

    const itemRows = items.map(item => `
    <tr style="border-bottom:1px solid ${BORDER_COLOR};">
      <td style="padding:12px 0;color:${TEXT_DARK};font-size:14px;">${item.productName}</td>
      <td style="padding:12px 0;color:${TEXT_MUTED};font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 0;color:${TEXT_DARK};font-size:14px;text-align:right;font-weight:600;">৳${item.subtotal}</td>
    </tr>
  `).join('');

    const deliveryLabel = deliveryLocation === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka';
    const addressStr = [address.street, address.area, address.city].filter(Boolean).join(', ');

    const content = `
    <!-- Status badge -->
    <div style="background:#FFF5F2;border:1px solid rgba(200,90,58,0.3);border-radius:8px;padding:16px 20px;margin-bottom:28px;text-align:center;">
      <p style="margin:0;font-size:13px;color:${BRAND_COLOR};font-weight:700;text-transform:uppercase;letter-spacing:1px;">Order Received</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:${TEXT_DARK};font-family:monospace;">${orderNumber}</p>
    </div>

    <h2 style="margin:0 0 8px;color:${TEXT_DARK};font-size:20px;font-weight:700;">
      Thank you, ${customerName}! 🎉
    </h2>
    <p style="margin:0 0 24px;color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Your order has been placed successfully. We will call you to confirm before dispatching.
    </p>

    <!-- What happens next -->
    <div style="background:${BG_COLOR};border-radius:8px;padding:20px 24px;margin-bottom:24px;border:1px solid ${BORDER_COLOR};">
      <p style="margin:0 0 12px;font-size:13px;color:${TEXT_MUTED};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">What happens next?</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:5px 0;font-size:14px;color:${TEXT_MUTED};">📞&nbsp; We'll call to confirm your order</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:${TEXT_MUTED};">📦&nbsp; Your order will be packed and dispatched</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:${TEXT_MUTED};">🚚&nbsp; Delivery within 3–5 business days</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:${TEXT_MUTED};">💵&nbsp; Pay cash on delivery — no advance payment</td></tr>
      </table>
    </div>

    ${divider()}

    <!-- Items table -->
    <h3 style="margin:0 0 16px;color:${TEXT_DARK};font-size:16px;">Order Items</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:2px solid ${BORDER_COLOR};">
          <th style="padding:8px 0;text-align:left;color:${TEXT_MUTED};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Product</th>
          <th style="padding:8px 0;text-align:center;color:${TEXT_MUTED};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
          <th style="padding:8px 0;text-align:right;color:${TEXT_MUTED};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Totals -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
      <tr>
        <td style="padding:6px 0;color:${TEXT_MUTED};font-size:14px;">Subtotal</td>
        <td style="padding:6px 0;color:${TEXT_DARK};font-size:14px;font-weight:600;text-align:right;">৳${subtotal}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:${TEXT_MUTED};font-size:14px;">Delivery (${deliveryLabel})</td>
        <td style="padding:6px 0;color:${TEXT_DARK};font-size:14px;font-weight:600;text-align:right;">৳${deliveryCharge}</td>
      </tr>
      <tr style="border-top:2px solid ${BORDER_COLOR};">
        <td style="padding:12px 0 0;color:${TEXT_DARK};font-size:16px;font-weight:700;">Total (COD)</td>
        <td style="padding:12px 0 0;color:${BRAND_COLOR};font-size:20px;font-weight:700;text-align:right;">৳${total}</td>
      </tr>
    </table>

    ${divider()}

    <!-- Delivery address -->
    <h3 style="margin:0 0 12px;color:${TEXT_DARK};font-size:16px;">Delivery Address</h3>
    <div style="background:${BG_COLOR};border-radius:8px;padding:16px 20px;border:1px solid ${BORDER_COLOR};">
      <p style="margin:0;color:${TEXT_DARK};font-size:14px;line-height:1.7;">
        📍 ${addressStr || 'Address not provided'}
      </p>
    </div>

    ${customerNotes ? `
    ${divider()}
    <h3 style="margin:0 0 8px;color:${TEXT_DARK};font-size:16px;">Your Note</h3>
    <p style="margin:0;color:${TEXT_MUTED};font-size:14px;font-style:italic;">"${customerNotes}"</p>
    ` : ''}
  `;

    return wrapper(content);
};


// ─────────────────────────────────────────────────────────────────────────────
// 3. FORGOT PASSWORD OTP EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export interface OtpEmailData {
    fullName?: string;
    phone: string;
    otp: string;
    expiresInMinutes?: number;
}

export const forgotPasswordEmailTemplate = ({
    fullName,
    otp,
    expiresInMinutes = 15,
}: OtpEmailData): string => {
    const otpDigits = otp.split('').map(d =>
        `<span style="display:inline-block;width:42px;height:52px;line-height:52px;text-align:center;background:${BG_COLOR};border:2px solid ${BORDER_COLOR};border-radius:8px;font-size:24px;font-weight:700;color:${TEXT_DARK};margin:0 4px;">${d}</span>`
    ).join('');

    const content = `
    <h2 style="margin:0 0 8px;color:${TEXT_DARK};font-size:22px;font-weight:700;">
      Reset Your Password 🔐
    </h2>
    <p style="margin:0 0 24px;color:${TEXT_MUTED};font-size:15px;line-height:1.6;">
      Hi${fullName ? ` <strong style="color:${TEXT_DARK};">${fullName}</strong>` : ''},
      we received a request to reset your Karughor password.
      Use the OTP below on the reset page.
    </p>

    <!-- OTP Display -->
    <div style="text-align:center;margin:32px 0;">
      <p style="margin:0 0 16px;font-size:13px;color:${TEXT_MUTED};font-weight:700;text-transform:uppercase;letter-spacing:1px;">Your One-Time Password</p>
      <div>${otpDigits}</div>
      <p style="margin:16px 0 0;font-size:13px;color:${TEXT_MUTED};">
        ⏱ Expires in <strong>${expiresInMinutes} minutes</strong>
      </p>
    </div>

    ${divider()}

    <div style="background:#FFF5F2;border-left:4px solid ${BRAND_COLOR};padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:${TEXT_DARK};">
        <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone.
        Karughor will never ask for your OTP over call or chat.
      </p>
    </div>

    <p style="margin:0;color:${TEXT_MUTED};font-size:14px;line-height:1.6;">
      Didn't request a password reset? You can safely ignore this email.
      Your password will remain unchanged.
    </p>
  `;

    return wrapper(content);
};