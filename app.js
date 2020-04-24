var createError = require('http-errors')
var express = require('express')
var logger = require('morgan')

var areaRouter = require('./routes/areas')
var routeRouter = require('./routes/routes')

var app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

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

const port = 4000
app.listen(port, () => console.log(`Listening at localhost: ${port}`))
