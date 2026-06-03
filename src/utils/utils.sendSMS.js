const client = require('twilio')(`${process.env.TWILIO_ACCOUNT_SID}`, `${process.env.TWILIO_AUTH_TOKEN}`);
const sendSMS = async (body, phone) => {
  try {
    // console.log("message sending through twilio >>>>>>>>>>>>>>",message);
    const message = await client.messages.create({
        body: body,
        to: `+91${phone}`,
        from: `${process.env.TWILIO_PHONE_NUMBER}`,
      });
    console.log("message sending through twilio >>>>>>>>>>>>>>",message);
      return message
  } catch (error) {
   console.log(error);
    return error;
  }
};

module.exports = sendSMS;


// const axios = require('axios');

// const sendSMS = async (body, phone) => {
//   try {
//     const username = process.env.CERF_USERNAME;
//     const apikey = process.env.CERF_APIKEY;
//     const signature = process.env.CERF_SIGNATURE; // sender ID
//     const custref = `ref${Date.now()}`;
//     const campaign = 'OTP';
//     const msgtype = 'PM'; // assuming plain text

//     const url = `https://msg.cerfgs.com/pushapi/sendmsg`;
//     const params = {
//       username,
//       dest: `91${phone}`,
//       // dest: `91${phone}`,
//       apikey,
//       signature,
//       msgtype,
//       msgtxt: body,
//       custref,
//       campaign
//     };
//     console.log("params",params)
//     const { data } = await axios.get(url, { params });
//     // const { data } = await axios.get(`https://msg.cerfgs.com/pushapi/sendmsg?username=${username}&dest=91${phone}&apikey=${apikey}&signature=${signature}&msgtype=${msgtype}&msgtxt=${body}&custref=${custref}`);
//     console.log("data",data)
//     console.log('Message sending through CERF >>>>>>>>>>>>>>', data);
//     return data;
//   } catch (error) {
//     console.error('Error sending SMS via CERF:', error.response ? error.response.data : error.message);
//     return error;
//   }
// };

// module.exports = sendSMS;
