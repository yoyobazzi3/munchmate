import nodemailer from 'nodemailer';

export const sendResetCode = async (toEmail, code) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error('Email service is not configured.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"MunchMate" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your MunchMate Password Reset Code',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 12px;">
        <h2 style="color: #c8411b; margin-bottom: 8px;">Password Reset</h2>
        <p style="color: #555; font-size: 15px;">Use the code below to reset your MunchMate password. It expires in <strong>15 minutes</strong>.</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px 28px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
        </div>
        <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};
