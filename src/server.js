const express = require('express');
const app = express();
const socket = require('socket.io');
const cors = require('cors');

app.use(express.json());
app.use(cors());

const server = app.listen(process.env.PORT || 80);
const io = socket(server, {
    cors: {
        origin: "*",
    }
});

const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

var rooms = [];

io.on('connection', function (socket) {
    socket.on("create", (props) => {
        const gamerInfo = JSON.parse(props);
        const partyInfo = {
            "code": genRanHex(5).toUpperCase()
        }
        rooms = [...rooms, {
            code: partyInfo.code,
            gamerSelected: "",
            players: [{
                nome: gamerInfo.playerName,
                socket: socket,
                pontos: 0,
            }
            ]
        }]
        socket.emit("partyInfo", JSON.stringify(partyInfo));
    });
    socket.on("join", (props) => {
        const partyInfo = JSON.parse(props);
        const posicao = rooms.findIndex(x => x.code === partyInfo.code);
        if (rooms.findIndex(x => x.code === partyInfo.code) === -1) {
            socket.emit("partyError", 0);
        }else if(rooms[posicao].players.length === 2){
            socket.emit("partyError", 1);
        }else if(rooms[posicao].players[0].nome === partyInfo.playerName){
            socket.emit("partyError", 2);
        }else{
            const partyData = {
                enemy: rooms[posicao].players[0].nome
            }
            rooms[posicao].players = [...rooms[posicao].players, {
                nome: partyInfo.playerName,
                socket: socket,
                pontos: 0
            }];
            const enemyData = {
                enemy: partyInfo.playerName
            }
            socket.emit("partyData", JSON.stringify(partyData));
            rooms[posicao].players[0].socket.emit("enemyJoin", JSON.stringify(enemyData));
        }
    });
    socket.on("gamerSelect", (props) => {
        const move = JSON.parse(props);
        var resultRecevied = "";
        const posicao = rooms.findIndex(x => x.code === move.code);
        const room = rooms[posicao].players;
        var posicaoPlayer = room.findIndex(x => x.socket.id === socket.id);
        var enemyPosition = 1;
        if(posicaoPlayer === 1){
            enemyPosition = 0;
        }
        rooms[posicao].players[enemyPosition].socket.emit("enemyPlayed", 0);
        if(rooms[posicao].gamerSelected === ""){
            rooms[posicao].gamerSelected = move.jogada;
        }else{
            // 2 Perde, 1 Ganha, 0 Empate
            // 0 Pedra, 1 Papel, 2 Tesoura
            if(move.jogada === 0 && rooms[posicao].gamerSelected === 0){
                resultRecevied = 0;
            }else if(move.jogada === 1 && rooms[posicao].gamerSelected === 1){
                resultRecevied = 0;
            }else if(move.jogada === 2 && rooms[posicao].gamerSelected === 2){
                resultRecevied = 0;
            }else if(move.jogada === 0 && rooms[posicao].gamerSelected === 1){
                resultRecevied = 2;
            }else if(move.jogada === 0 && rooms[posicao].gamerSelected === 2){
                resultRecevied = 1;
            }else if(move.jogada === 1 && rooms[posicao].gamerSelected === 0){
                resultRecevied = 1;
            }else if(move.jogada === 1 && rooms[posicao].gamerSelected === 2){
                resultRecevied = 2;
            }else if(move.jogada === 2 && rooms[posicao].gamerSelected === 0){
                resultRecevied = 2;
            }else{
                resultRecevied = 1;
            }
            if(resultRecevied === 1){
                rooms[posicao].players[posicaoPlayer].pontos++;
                const resultInfoEnemy = {
                    result: "perdeu",
                    enemy: move.jogada,
                    enemyPoints: rooms[posicao].players[posicaoPlayer].pontos
                };
                const resultInfoPlayer = {
                    result: "ganhou",
                    enemy: rooms[posicao].gamerSelected,
                    pontos: rooms[posicao].players[posicaoPlayer].pontos
                };
                rooms[posicao].players[enemyPosition].socket.emit("moveResult", JSON.stringify(resultInfoEnemy));
                rooms[posicao].players[posicaoPlayer].socket.emit("moveResult", JSON.stringify(resultInfoPlayer));
            }else if(resultRecevied === 2){
                rooms[posicao].players[enemyPosition].pontos++;
                const resultInfoEnemy = {
                    result: "ganhou",
                    enemy: move.jogada,
                    pontos: rooms[posicao].players[enemyPosition].pontos
                };
                const resultInfoPlayer = {
                    result: "perdeu",
                    enemy: rooms[posicao].gamerSelected,
                    enemyPoints: rooms[posicao].players[enemyPosition].pontos
                };
                rooms[posicao].players[enemyPosition].socket.emit("moveResult", JSON.stringify(resultInfoEnemy));
                rooms[posicao].players[posicaoPlayer].socket.emit("moveResult", JSON.stringify(resultInfoPlayer));
            }else{
                const resultTieEnemy = {
                    result: "empatou",
                    enemy: move.jogada,
                };
                const resultTiePlayer = {
                    result: "empatou",
                    enemy: rooms[posicao].gamerSelected,
                };
                rooms[posicao].players[enemyPosition].socket.emit("moveResult", JSON.stringify(resultTieEnemy));
                rooms[posicao].players[posicaoPlayer].socket.emit("moveResult", JSON.stringify(resultTiePlayer)); 
            }
            rooms[posicao].gamerSelected = "";
        }
    });
})