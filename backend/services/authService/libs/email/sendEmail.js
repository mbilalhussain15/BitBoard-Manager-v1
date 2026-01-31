import jwt from "jsonwebtoken";
import Verification from "../../models/Verification.js";
import { sendWithSendGrid } from "./sendWithSendGrid.js";
import { sendWithNodemailer } from "./sendWithNodemailer.js";

import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("../../.env") });


export const sendEmail = async (email, user) => {
  try {
    const verificationToken = jwt.sign(
      { id: user._id, purpose: "email-verification" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await Verification.create({
      userId: user._id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
    });

    const link = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const subject = `Verify Your BitBoard Account`;

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #333;">Hello ${user.name},</h2>
        <p style="font-size: 16px; color: #555;">
        Thank you for signing up with <strong>BitBoard</strong>! Please verify your email address to activate your account.
        </p>
        <p style="font-size: 16px; color: #555;">
        This link will expire in <strong>1 hour</strong>.
        </p>
        <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="
            background-color: #007BFF;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
            display: inline-block;
        ">Verify Email</a>
        </div>
        <p style="font-size: 14px; color: #888;">
        If you didn’t request this, you can safely ignore this email.
        </p>
        <p style="font-size: 14px; color: #555;">
        Best regards,<br>
        <strong>BitBoard Team</strong>
        </p>
    </div>
    `;


    // try {
    //   await sendWithSendGrid(email, subject, htmlContent);
    //   console.log("✅ Email sent via SendGrid");
    //   return { success: true };
    // } catch (sgErr) {
    //   console.warn("⚠️ SendGrid failed, falling back to Gmail...", sgErr.message);
    //   try {
    //     await sendWithNodemailer(email, subject, htmlContent);
    //     console.log("✅ Email sent via Gmail");
    //     return { success: true };
    //   } catch (nmErr) {
    //     console.error("❌ Both SendGrid and Gmail failed:", nmErr.message);
    //     return { success: false, error: nmErr };
    //   }
    // }
    try {
        await sendWithNodemailer(email, subject, htmlContent);
        console.log("✅ Email sent via Gmail");
        return { success: true };
      } catch (nmErr) {
        console.error("❌ Gmail failed:", nmErr.message);
        return { success: false, error: nmErr };
      }
  } catch (error) {
    console.error("❌ Error in sendEmail():", error);
    return { success: false, error };
  }
};
