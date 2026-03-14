const mail=require("nodemailer");

async function sendEmail(to, subject, html){

    const transporter = mail.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"We Order " <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  }
  module.exports={sendEmail}