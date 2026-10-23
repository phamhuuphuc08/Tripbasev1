import nodemailer from "nodemailer";

import { env } from "@/config/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: env.EMAIL_USER,
    clientId: env.EMAIL_CLIENT_ID,
    clientSecret: env.EMAIL_CLIENT_SECRET,
    refreshToken: env.EMAIL_REFRESH_TOKEN,
  },
});

export async function sendPasswordResetEmail(input: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  const { email, name, resetUrl } = input;

  await transporter.sendMail({
    from: {
      name: "TripBase",
      address: env.EMAIL_USER,
    },
    to: email,
    subject: "Đặt lại mật khẩu TripBase",
    text: [
      `Xin chào ${name},`,
      "",
      "TripBase nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.",
      "",
      `Đặt lại mật khẩu tại: ${resetUrl}`,
      "",
      "Liên kết này có hiệu lực trong 30 phút.",
      "",
      "Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này.",
      "",
      "TripBase",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; line-height: 1.6; color: #18181b;">
        <h2 style="margin-bottom: 16px;">Đặt lại mật khẩu TripBase</h2>

        <p>Xin chào ${escapeHtml(name)},</p>

        <p>
          TripBase nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
        </p>

        <p style="margin: 28px 0;">
          <a
            href="${escapeHtml(resetUrl)}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #18181b;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
            "
          >
            Đặt lại mật khẩu
          </a>
        </p>

        <p>
          Liên kết này có hiệu lực trong <strong>30 phút</strong>.
        </p>

        <p style="color: #71717a; font-size: 14px;">
          Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này.
          Mật khẩu hiện tại của bạn sẽ không bị thay đổi.
        </p>

        <p style="color: #71717a; font-size: 14px;">
          Nếu nút phía trên không hoạt động, hãy sao chép đường dẫn sau vào trình duyệt:
        </p>

        <p
          style="
            word-break: break-all;
            font-size: 13px;
            color: #52525b;
          "
        >
          ${escapeHtml(resetUrl)}
        </p>
      </div>
    `,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}