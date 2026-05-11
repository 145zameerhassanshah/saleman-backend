// const mail=require("nodemailer");

// async function sendEmail(to, subject, html){

//     const transporter = mail.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     await transporter.sendMail({
//       from: `"We Order "<${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       html,
//     });
//   }
//   module.exports={sendEmail}


const nodemailer = require("nodemailer");

const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("Email credentials missing. Check EMAIL_USER and EMAIL_PASS in .env");
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: emailUser,
      pass: emailPass.replace(/\s/g, ""),
    },
  });
};

async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter();

  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "WeOrder"}" <${
      process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER
    }>`,
    to,
    subject,
    html,
    text,
    replyTo: process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER,
  });
}

module.exports = { sendEmail };