const express = require('express');
const socket = require('socket.io');
const app = express();
const port = 3000;

var server = app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
}
);

app.use(express.static('public'));

var io = socket(server);

io.on('connection', (socket) => {
    console.log('a user connected: ' + socket.id);

    socket.on('join', (roomName) => {
        var rooms = io.sockets.adapter.rooms;
        console.log(rooms);

        var room = rooms.get(roomName);

        if (room == undefined) {
            socket.join(roomName);
            console.log('Room created: ' + roomName);
            socket.emit('created');
        } else if (room.size == 1) {
            socket.join(roomName);
            console.log('Room joined: ' + roomName);
            socket.emit('joined');
        } else {
            console.log('Room full: ' + roomName);
            socket.emit('full');
        }
    });

    socket.on('ready', (roomName) => {
        socket.broadcast.to(roomName).emit('ready');
        console.log('Ready');
    });
    
    socket.on('candidate', (candidate, roomName) => {
        console.log("Candidate");
        socket.broadcast.to(roomName).emit('candidate', candidate);
    });
    
    socket.on('offer', (offer, roomName) => {
        console.log('Offer');
        socket.broadcast.to(roomName).emit('offer', offer);
    });
    
    socket.on('answer', (answer, roomName) => {
        console.log('Answer');
        socket.broadcast.to(roomName).emit('answer', answer);
    });

    socket.on('leave', (roomName) => {
        console.log('leave');
        socket.leave(roomName);
        socket.broadcast.to(roomName).emit('leave');
    });
});

