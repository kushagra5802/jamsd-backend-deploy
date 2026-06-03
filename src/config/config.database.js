// const mongoose = require('mongoose');
// const { DATABASE_URL,DATABASE_USER,DATABASE_PASS,DATABASE_NAME } = process.env;
// // const DATABASE_URL = `mongodb://${DATABASE_USER}:${encodeURIComponent(DATABASE_PASS)}@localhost:27017/${DATABASE_NAME}`
// mongoose.connect(DATABASE_URL,{family: 4, useNewUrlParser: true, useUnifiedTopology: true, dbName: "JAMSC"});
// const database = mongoose.connection;

// database.on('error', (error) => {
//     console.log(error)
// })

// database.once('connected', () => {
//     console.log('Database Connected');
// })

const mongoose = require("mongoose");

const { DATABASE_URL } = process.env;

const connectDB = async () => {
  try {
    await mongoose.connect(DATABASE_URL, {
      family: 4,
      dbName: "JAMSC",
    });

    console.log("Database Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;