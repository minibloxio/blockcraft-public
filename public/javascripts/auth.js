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

function refreshServers() {
    // Disconnect servers
    for (let server of servers) {
        server.disconnect();
    }
    
    // Connect to servers
    servers = [];
    $("#server-container").empty();
    for (let server of serverList) {
        servers.push(io(server));

        servers[servers.length-1].on('connect', function () {
            servers[servers.length-1].emit('serverInfoRequest', Date.now())
        });

        servers[servers.length-1].on('serverInfoResponse', function (data) {
            let ping = Date.now()-data.ping;
            let serverHTML = $(`
                <div class='server'>
                    <p>Region: ${data.region}</p>
                    <p>Players: ${data.numPlayers}</p>
                    <p>Ping: ${ping}ms</p>
                    <p style="margin-bottom: 0;">Uptime: ${msToTime(data.uptime)} </p>

                    <button id="joinServer">Join</button>
                </div>
            `)
            $("#server-container").append(serverHTML);

        })
    }

}


// Refresh server
refreshServers();
$(document).ready(function () {
    $("#refresh-servers").click(function () {
        refreshServers()
    })
})
    
