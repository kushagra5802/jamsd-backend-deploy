const { logEvents } = require('./logger')

const errorHandler = (err, req, res, next) => {
    //logEvents(`${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`, 'errLog.log')
    //stack will specifically tell us where the error is
    console.log(err.stack)

    const isMulterLimit = err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE'
    const status = isMulterLimit ? 400 : err.status || err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500)
    const message = isMulterLimit ? 'Each uploaded file must be 5 MB or less.' : err.message || "Operation failed"

    res.status(status)

    res.json({ success: false, error: message, message });
}

module.exports = errorHandler 
