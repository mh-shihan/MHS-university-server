import nodemailer from 'nodemailer';
import config from '../config';

export const sendEmail = async (to: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: config.node_mailer_host,
    port: Number(config.node_mailer_port),
    secure: config.node_env === 'production', // true for 465, false for other ports
    auth: {
      user: config.node_mailer_user,
      pass: config.node_mailer_pass,
    },
  });

  await transporter.sendMail({
    from: config.node_mailer_user,
    to: to,
    subject: 'Reset Your password within 10 min!',
    text: '', // plain‑text body
    html: html, // HTML body
  });
};
