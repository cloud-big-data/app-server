import nodemailer from 'nodemailer';

const emailService = nodemailer.createTransport({ 
  host: "smtp.mailgun.org",
  port: 587,
  auth: {
    user: process.env.MG_EMAIL,
    pass: process.env.MG_PASSWORD,
  },
});

export default emailService;