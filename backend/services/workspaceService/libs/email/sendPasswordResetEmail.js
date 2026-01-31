import jwt from "jsonwebtoken";
import Verification from "../../models/Verification.js";
import { sendWithSendGrid } from "./sendWithSendGrid.js";
import { sendWithNodemailer } from "./sendWithNodemailer.js";

import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("../../.env") });

export const sendPasswordResetEmail = async (email, user) => {
  try {
    const resetToken = jwt.sign(
      { id: user._id, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await Verification.create({
      userId: user._id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
    });

    const link = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const subject = `BitBoard Password Reset Request`;

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #333;">Hello ${user.name},</h2>
        <p style="font-size: 16px; color: #555;">
        We received a request to reset your BitBoard account password. Click the button below to reset it.
        </p>
        <p style="font-size: 16px; color: #555;">
        This link will expire in <strong>1 hour</strong>. If you didn't request this, please ignore this email.
        </p>
        <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="
            background-color: #DC3545;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
            display: inline-block;
        ">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #888;">
        For security reasons, don't share this link with anyone. Our support team will never ask for it.
        </p>
        <p style="font-size: 14px; color: #555;">
        Best regards,<br>
        <strong>BitBoard Team</strong>
        </p>
    </div>
    `;

    try {
      await sendWithNodemailer(email, subject, htmlContent);
      console.log("✅ Password reset email sent via Gmail");
      return { success: true };
    } catch (nmErr) {
      console.error("❌ Failed to send password reset email:", nmErr.message);
      return { success: false, error: nmErr };
    }
  } catch (error) {
    console.error("❌ Error in sendPasswordResetEmail():", error);
    return { success: false, error };
  }
};