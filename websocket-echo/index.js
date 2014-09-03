var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({ port: 8080 })

wss.on('connection', function(socket) {
    socket.on('message', function(message) {
        socket.send(message)
    })
})
