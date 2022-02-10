const express = require('express');
const routes = require('./routes');
const app = express();
const socket = require('socket.io');
const cors = require('cors');

app.use(express.json());
app.use(cors());
app.use(routes);

const server = app.listen(8080);
const io = socket(server, {
    cors: {
        origin: "http://localhost:3000",
    }
});

const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

var rooms = [];

io.on('connection', function (socket) {
    socket.once("create", (props) => {
        const gamerInfo = JSON.parse(props);
        const partyInfo = {
            "code": genRanHex(5).toUpperCase()
        }
        rooms = [...rooms, {
            code: partyInfo.code,
            player: [{
                nome: gamerInfo.playerName,
                socket: socket
            }
            ]
        }]
        socket.emit("partyInfo", JSON.stringify(partyInfo));
    });
    socket.once("join", (props) => {
        const partyInfo = JSON.parse(props);
        if (rooms.findIndex(x => x.code === partyInfo.code) === -1) {
            socket.emit("partyError", 0);
        } else {
            const posicao = rooms.findIndex(x => x.code === partyInfo.code);
            const partyData = {
                enemy: rooms[posicao].player[0].nome
            }
            rooms[posicao].player = [...rooms[posicao].player, {
                nome: partyInfo.playerName,
                socket: socket
            }];
            const enemyData = {
                enemy: partyInfo.playerName
            }
            socket.emit("partyData", JSON.stringify(partyData));
            rooms[posicao].player[0].socket.emit("enemyJoin", JSON.stringify(enemyData));
        }
    });
})