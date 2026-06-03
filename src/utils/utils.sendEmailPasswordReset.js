// const nodemailer = require("nodemailer");
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendEmailPasswordReset = async (email, subject, payload) => {
  try {

    // create reusable transporter object using the default SMTP transport
    //add user email and password before sending any mail

    /* const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.FROM_EMAIL,
          pass: process.env.PASSWORD
        },
        forceSMTP: true,
      }); */

    const mailOptions = {
      to: email,
      from: process.env.FROM_EMAIL,
      subject: subject,
      html: payload.data
    };
    return await sgMail.send(mailOptions)
   //console.log("let info", info);
   // console.log("Message sent: %s", info.messageId);
  } catch (error) {
   console.log(error);
    return error;
  }
};


module.exports = sendEmailPasswordReset;