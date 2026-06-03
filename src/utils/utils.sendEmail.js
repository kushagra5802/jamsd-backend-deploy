const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, payload,imagePath) => {
  try {


    let { EMAIL_USERNAME, PASSWORD, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = process.env;
    // create reusable transporter object using the default SMTP transport
    //add user email and password before sending any mail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: EMAIL_USERNAME,
        pass: PASSWORD,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN
      }
    });

    let info = await transporter.sendMail({
      from: EMAIL_USERNAME, // sender address
      to: email, // list of receivers
      subject: subject, // Subject line
      // text: payload.data, // plain text body
      html:payload.data,
      attachments: [
        {
          filename: imagePath.substring(imagePath.lastIndexOf('/')+1),
          path: imagePath,
          cid: "image"
        }
      ]
    });

    console.log("let info", info);
    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    return error;
  }
};


module.exports = sendEmail;