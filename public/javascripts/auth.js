/*

    Authenticates the player and provides server details from each running server.

*/


// Setup

let socket = io({
	autoConnect: false,
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
    for (let i = 0; i < serverList.length; i++) {
        let server = serverList[i];
        servers.push(io(server, {forceNew: true}));

        servers[i].on('connect', function () {
            setTimeout(function () {
                servers[i].emit('serverInfoRequest', Date.now())
            }, 500);
        });

        servers[i].on('serverInfoResponse', function (data) {
            let latency = Date.now()-data.ping;
            let serverHTML = $(`
                <div class='server'>
                    <p>Region: ${data.region}</p>
                    <p>Players: ${data.numPlayers}</p>
                    <p>Latency: ${latency}ms</p>
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
    
