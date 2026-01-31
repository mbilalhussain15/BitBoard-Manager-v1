import nodemailer from "nodemailer";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("../../.env") });

const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    service: process.env.SERVICE,
    port: Number(process.env.EMAIL_PORT),
    secure: Boolean(process.env.SECURE),
    auth: {
        user: process.env.USER,
        pass: process.env.PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },

});


export const sendWithNodemailer = async (to, subject, html) => {

  await transporter.sendMail({
    from: `"BitBoard Support" <${process.env.USER}>`,
    to,
    subject,
    html,
  });
};
