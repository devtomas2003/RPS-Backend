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

io.on('connection', function(socket){
    socket.once("create", (props) => {
        const partyInfo = {
            "code": genRanHex(5).toUpperCase()
        }
        socket.emit("partyInfo", JSON.stringify(partyInfo));
    });
    socket.once("join", (props) => {
        console.log(props);
    });
})