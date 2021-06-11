const express = require("express"),
    app = express(),
    socketIo = require("socket.io");

PORT = 8080
const server = app.listen(PORT, () => console.log("Server listening on port " + PORT))
const io = socketIo(server);
const clients = {};

app.use(express.static(__dirname + "/public"));


const addClient = socket => {
    console.log("New client connected", socket.id);
    clients[socket.id] = socket;
};
const removeClient = socket => {
    console.log("Client disconnected", socket.id);
    delete clients[socket.id];
};

io.sockets.on("connection", socket => {
    let id = socket.id;

    addClient(socket);

    socket.on("mousemove", data => {
        data.id = id;
        socket.broadcast.emit("moving", data);
    });

    socket.on("disconnect", () => {
        removeClient(socket);
        socket.broadcast.emit("clientdisconnect", id);
    });
});

const players = {};
let unmatched;

const joinGame = socket => {
    players[socket.id] = {
        opponent: unmatched,

        symbol: "X",

        socket: socket
    };

    if (unmatched) {
        players[socket.id].symbol = "O";
        players[unmatched].opponent = socket.id;
        unmatched = null;
    } else {
        unmatched = socket.id;
    }
}

const getOpponent = socket => {
    if (!players[socket.id].opponent) {
        return;
    }
    return players[players[socket.id].opponent].socket;
}

io.on("connection", socket => {
    joinGame(socket);
    if (getOpponent(socket)) {
        socket.emit("game.begin", {
            symbol: players[socket.id].symbol
        });
        getOpponent(socket).emit("game.begin", {
            symbol: players[getOpponent(socket).id].symbol
        });
    }

    socket.on("make.move", data => {
        if (!getOpponent(socket))
            return;
        socket.emit("move.made", data);
        getOpponent(socket).emit("move.made", data);
    });

    socket.on("disconnect", () => {
        if (getOpponent(socket)) {
            getOpponent(socket).emit("opponent.left");
        }
    });
});
