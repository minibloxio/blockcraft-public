/*

    Authenticates the player and provides server details from each running server.

*/


// Setup

let socket = io({
	autoConnect: true,
	forceNew: true,
});

$(document).ready(function () {
	socket.on('connect', function () {
        console.log("Connected to Socket.IO!");
        init();
	})

    socket.on('disconnect', function (reason) {
        console.log("Disconnected from server due to:", reason);
    })
})

let serverList = ["https://na-east.victorwei.com", "https://na-west.victorwei.com"] // Request this from the auth server
let servers = [];

for (let server of serverList) {
    servers.push(io(server));

    servers[servers.length-1].emit('serverInfoRequest', Date.now());

    servers[servers.length-1].on('serverInfoResponse', function (data) {
        console.log(data);
    })
}

