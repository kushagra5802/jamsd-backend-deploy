require('dotenv').config();

// connect to MongoDB database
require('../src/config/config.database');

const express = require('express');
const http = require('http');
// const socketHandler = require('./config/socket');
const { logger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const createError = require("http-errors");
const PORT = process.env.PORT || 8200;
const app = express();
const server = http.createServer(app);

// handle cors
app.use(cors());
app.use(express.json()); 
app.use(express.static('uploads')); 
app.use('/uploads', express.static('uploads'));

const authRoutes = require('./routes/auth.routes');
const submissionRoutes = require('./routes/submission.routes');
const adminRoutes = require('./routes/admin.routes');
const articleRoutes = require('./routes/article.routes');
const issueRoutes = require('./routes/issue.routes');
const contactRoutes = require('./routes/contact.routes');

app.get("/", (req, res) => res.status(200).json({
    status: true,
    message: "Welcome to JAMSD API."
}));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(bodyParser.json())

// routers
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/contact", contactRoutes);
// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

//place errorhandler at the end just before when we call our listner
app.use(errorHandler);

server.listen(PORT, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`Server is live at localhost:${PORT}`)
    }
});

module.exports = app;
