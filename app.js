var createError = require('http-errors')
var express = require('express')
var logger = require('morgan')
var MongoClient = require('mongodb').MongoClient

var router = require('./routes')

var app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(function(_req, res, next) {
    res.header('Access-Control-Allow-Origin', '*') // update to match the domain you will make the request from
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
})

app.use('/', router)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404))
})

// error handler
app.use(function(err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
})

MongoClient.connect(process.env.MONGO_URI, { useUnifiedTopology: true }, (err, db) => {
    if (err) {
        console.error(`Failed to connect to the database. ${err}`)
    } else {
        console.log('Connected to Mongo')
        app.locals.db = db.db(process.env.MONGO_DB_NAME)

        let port = process.env.PORT
        if (port == null || port == '') {
            port = 8000
        }
        app.listen(port, () => console.log(`Listening on port: ${port}`))
    }
})
