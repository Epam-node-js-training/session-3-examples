var express = require('express')
var path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var path = require('path')
var fs = require('fs')

var routes = require('./routes/index')

var app = express()

var server = require('http').createServer(app)
var io = require('socket.io')(server)

currentlyUploadingFiles = {}

io.on('connection', function(socket) {
    var chunkSize = 512 * 1024

    socket.on('start', function(data) {
        var file = currentlyUploadingFiles[data.name] = {
            size: data.size,
            uploaded: 0
        }

        var offset = 0
        var filename = path.join('tmp', data.name)

        fs.stat(filename, function(err, stat) {
            if (!err && stat.isFile()) {
                file.uploaded = stat.size
                offset = stat.size / chunkSize
            }

            file.stream = fs.createWriteStream(filename, { flags: 'a+', encoding: 'Binary' })
            socket.emit('more-data', { offset: offset, percent: 0 })
        })
    })

    socket.on('upload', function(data) {
        var file = currentlyUploadingFiles[data.name]

        file.uploaded += data.data.length
        file.stream.write(data.data)

        if (file.size === file.uploaded) {
            delete currentlyUploadingFiles[data.name]
            socket.emit('done')
            return file.stream.end()
        }

        var percent = file.uploaded / file.size * 100;
        socket.emit('more-data', { offset: file.uploaded / chunkSize, percent: percent })
    })
})

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', routes)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500)
        res.render('error', {
            message: err.message,
            error: err
        })
    })
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
        message: err.message,
        error: {}
    })
})

module.exports = [app, server]
