import sgMail from "@sendgrid/mail";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("../../.env") });


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendWithSendGrid = async (to, subject, html) => {
  try {
    const msg = {
      to,
      from: `BitBoard <${process.env.FROM_EMAIL}>`,
      subject,
      html,
    };
    console.log("Attempting to send with SendGrid...");
    await sgMail.send(msg);
    console.log("SendGrid success");
  } catch (error) {
    console.error("Full SendGrid Error:", {
      message: error.message,
      code: error.code,
      response: error.response?.body?.errors,
    });
    throw error;
  }
};