const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let players = {};
let teams = ["blue", "green", "yellow", "purple"];
let gameState = {
    units: [],
    boss: { x: 500, y: 300, hp: 1000 }
};

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

wss.on('connection', (ws) => {

    if (Object.keys(players).length >= 4) {
        ws.send(JSON.stringify({ type: "full" }));
        ws.close();
        return;
    }

    const team = teams[Object.keys(players).length];
    players[ws._socket.remoteAddress] = { team };

    ws.send(JSON.stringify({ type: "init", team, gameState }));

    ws.on('message', (msg) => {
        const data = JSON.parse(msg);

        if (data.type === "move") {
            gameState.units.push({
                team: data.team,
                x: data.x,
                y: data.y
            });
        }
    });

    ws.on('close', () => {
        delete players[ws._socket.remoteAddress];
    });
});

// Boss AI loop
setInterval(() => {
    gameState.boss.x += Math.random()*4 - 2;
    gameState.boss.y += Math.random()*4 - 2;

    broadcast({ type: "update", gameState });

}, 50);
