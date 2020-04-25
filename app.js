var createError = require('http-errors')
var express = require('express')
var logger = require('morgan')
var MongoClient = require('mongodb').MongoClient

var areaRouter = require('./routes/areas')
var routeRouter = require('./routes/routes')

var app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*') // update to match the domain you will make the request from
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
})

app.use('/areas', areaRouter)
app.use('/routes', routeRouter)

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
    console.log('Connected')
    if (err) {
        console.error(`Failed to connect to the database. ${err}`)
    }
    app.locals.db = db

    let port = process.env.port
    if (port == null || port == '') {
        port = 8000
    }
    app.listen(port, () => console.log(`Listening on port: ${port}`))
})
