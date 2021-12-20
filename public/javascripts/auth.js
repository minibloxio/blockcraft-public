/*

    Authenticates the player and provides server details from each running server.
    Handles menu progression logic.

*/


// Setup
let state = 0; // State of where the player is in the authentication process (0: Start Menu, 1: Choose Server, 2: Loading Game, 3: In Game)
let socket = io({
	autoConnect: false,
	forceNew: true,
});

let serverList = ["https://na-east.victorwei.com", "https://na-west.victorwei.com"] // Request this from the auth server
let servers = {};
let currentServer = undefined;

function refreshServers() {
    // Disconnect servers
    for (let link in servers) {
        let server = servers[link];
        server.socket.disconnect();
    }
    
    // Connect to servers
    servers = {};
    currentServer = undefined;

    $("#server-container").empty();
    for (let i = 0; i < serverList.length; i++) {
        let serverLink = serverList[i];
        servers[serverLink] = {
            socket: io(serverLink, {
                forceNew: true,
                reconnection: false,
            }),
            link: serverLink,
            info: {},
        };

        let server = servers[serverLink];

        // Connected to server
        server.socket.on('connect', function () {
            setTimeout(function () {
                server.socket.emit('serverInfoRequest', Date.now())
            }, 500);
        });

        // Error connecting to server
        server.socket.on('connect_error', function (error) {
            //console.error(error);
        });

        // Disconnected from server
        server.socket.on('disconnect', function (reason) {
            if (reason == "transport close") {  
                console.log("Server down!");
                server.socket.disconnect();
            }
        })

        // Received server info
        server.socket.on('serverInfoResponse', function (data) {
            // Check if it's the first server
            if (!currentServer) {
                currentServer = data;

                if (state == 1) {
                    $("#continue-bar").text(`Join server (${currentServer.region})`);
                    $("#continue-bar").css({"background-color": "green"});
                }
                //connect(data.link);
            }

            // Update server info
            servers[data.link].info = data;

            // Update server list
            let latency = Date.now()-data.ping;
            let serverHTML = $(`
                <div class='server'>
                    <p>Region: ${data.region}</p>
                    <p>Players: ${data.numPlayers}</p>
                    <p>Latency: ${latency}ms</p>
                    <p style="margin-bottom: 0;">Uptime: ${msToTime(data.uptime)} </p>
                </div>
            `)
            $("#server-container").append(serverHTML);
        })
    }
}

// Connect to server
function connect(url) {
    if (url in servers) {
        currentServer = servers[url]
    }

    socket.io.uri = url;
    socket.connect();
}

// Menu Progression Logic
$(document).ready(function () {
    // Refresh servers
    $("#refresh-servers").click(function () {
        refreshServers()
    })

    function nextState() {
        
        if (state == 0) {
            refreshServers();
            
            $("#name-input").hide();
            $("#direct-connect-input").show();
            if ($("#direct-connect-input").val()) $("#direct-connect-input").focus();

            $("#continue-bar").text("Finding Server...");
            $("#continue-bar").css({"background-color": "orange"});

            $("#menu").hide();
            $("#server-select").show();
            $("#server-button")[0].click();

            state += 1;
        } else if (state == 1 && currentServer) {
            // Direct connection
            let directConnect = $("#direct-connect-input").val();
            if (directConnect) {  
                connect(directConnect);
            } else {
                connect(currentServer.link);
            }

            $("#loading-bar").show();
            $("#continue-bar").hide();

            $("#name-input").show();
            $("#direct-connect-input").hide();

            $("#server-select").hide();
            $("#settings").show();
            $("#video-button")[0].click();

            state += 1;
        } else if (state == 2 && loaded >= maxLoaded) {
            requestPointerLock();
            state += 1;
        } else if (state == 3) {
            requestPointerLock();
        }
        
    }

    // Menu progression (0: Start Menu, 1: Choose Server, 2: Loading Game, 3: In Game)
    $("#start-button").click(function (event) {
        nextState();
    })

    // Enter username input
    $("#name-input").keyup(function (event) {
        if (event.keyCode == 13) nextState();
        
    })

    // Enter direct connect input
    $("#direct-connect-input").keyup(function (event) {
        if (event.keyCode == 13) nextState();
    })
})