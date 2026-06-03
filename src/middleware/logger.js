const { format } = require('date-fns');
const { v4: uuid } = require('uuid');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path')

const logEvents = async (message, logFileName) => {
    const dateTime = format(new Date(), 'dd/MM/yyyy\tHH:mm:ss')
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`

    try {
        //checking if the log folder exists; if not will create one
        if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
            // creating a directory named "logs" 
            await fsPromises.mkdir(path.join(__dirname, '..', 'logs'))
        }
        await fsPromises.appendFile(path.join(__dirname, '..', 'logs', logFileName), logItem)
    } catch (err) {
        console.log(err);
    }
}

const logger = (req, res, next) => {
    const origin = req.headers.origin;
    const host = req.headers.host;
    logEvents(`${req.method}\t${req.url}\t${req.headers.origin ? origin : host}`, 'reqLog.log')
    console.log(`${req.method} ${req.path}`)
    next()
}

module.exports = { logEvents, logger }