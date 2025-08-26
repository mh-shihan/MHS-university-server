import nodemailer from 'nodemailer';
import config from '../config';

export const sendEmail = async (to: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: config.node_env === 'production', // true for 465, false for other ports
    auth: {
      user: 'mahmodul.no.1@gmail.com',
      pass: 'ydik yvks hsgd adjl',
    },
  });

  const info = await transporter.sendMail({
    from: 'mahmodul.no.1@gmail.com',
    to: to,
    subject: 'Forget Password',
    text: 'Reset Your password within 10 min!', // plain‑text body
    html: ``, // HTML body
  });

  console.log('Message sent:', info.messageId);
};
