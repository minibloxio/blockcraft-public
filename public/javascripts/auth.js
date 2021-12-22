/*

    Authenticates the player and provides server details from each running server.
    Handles menu progression logic.

*/


// Setup
let state = 0; // State of where the player is in the authentication process (0: Start Menu, 1: Server Select, 2: Loading Game, 3: Loading Chunks, 4: In Game)
let socket = io({
	autoConnect: false,
	forceNew: true,
    reconnectionAttempts: 2
});

let serverList = ["https://na-east.victorwei.com", "https://na-west.victorwei.com"] // Request this from the auth server
let servers = {};
let currentServer = undefined;
let joined = false;

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
            // Update server info
            servers[data.link].info = data;

            // Update server list
            let latency = Date.now()-data.ping;
            let serverHTML = $(`
                <div class='server' data-link='${data.link}' onClick='clickServer(event)'  ondblclick='clickServer(event, true)'>
                    <p>Region: ${data.region}</p>
                    <p>Players: ${data.numPlayers}/20</p>
                    <p>Latency: ${latency}ms</p>
                    <p style="margin-bottom: 0;">Uptime: ${msToTime(data.uptime)} </p>
                </div>
            `)

            // Check if it's the first server
            if (!currentServer) {
                currentServer = data;

                setJoinButton(data);

                serverHTML.css({
                    "background-color": "rgba(0,0,0,0.7)",
                    "outline": "2px solid white",
                });
            }
            
            $("#server-container").append(serverHTML);
        })
    }
}

// Set join button
function setJoinButton(server) {
    if (state == 1 && !$("#direct-connect-input").val().length) {
        $("#continue-bar").text(`Join server (${server.region})`);
        $("#continue-bar").css({"background-color": "green"});
    }
}

// Clicked on a server
function clickServer(event, doubleClick) {
    let server = $(event.target).closest(".server");
    let url = server.data("link");
    if (url in servers) {
        currentServer = servers[url];
    }
    setJoinButton(currentServer.info);

    $("#server-container").children().css({
        "background-color": "rgba(0,0,0,0.5)",
        "outline": "none",
    });

    server.css({
        "background-color": "rgba(0,0,0,0.7)",
        "outline": "2px solid white",
    });

    if (doubleClick) {
        $("#start-button").click();
    }
}

// Initialize server connection
function connect(url) {
    console.log("Connecting to server with url: " + url);
    if (url in servers) {
        currentServer = servers[url];
    }

    socket.io.uri = url;
    socket.connect();
}

// Error connecting to server
function connectError() {
	console.error("Error connecting to server!");
    prevState();
}

// Join server
function joinServer() {
	if (!initialized) {
		let name = $("#name-input").val() || "";

		let joinInfo = {
			name: name,
		}
		socket.emit('join', joinInfo)
		loaded += 1;
		console.log("Joining server...")
	}
}

// Disconnect server
function disconnectServer() {
    if (state != 4) return;
    joined = false;

    console.log("Disconnecting from server...");
    currentServer = undefined;
    prevState();
    socket.disconnect();
    
    // Unload all chunks
    chunkManager.unloadChunks(true);

    // Remove all players
    for (let id in players) {
        scene.remove(players[id].entity);
	    delete players[id];
    }

    // Remove all entities
    for (let id in world.entities) {
        world.entities[id].mesh.geometry.dispose();
		world.entities[id].mesh.material.dispose();
		scene.remove(world.entities[id].mesh);
		delete world.entities[id];
    }
}


// Menu Progression Logic
$(document).ready(function () {
    // Initialize game
    init();

    // Refresh servers
    $("#refresh-servers").click(function () {
        refreshServers()
    })

    // Menu progression (0: Start Menu, 1: Server Select, 2: Loading Game, 3: In Game)
    $("#start-button").click(function (event) {
        nextState(event);
    })

    // Enter username input
    $("#name-input").keyup(function (event) {
        if (event.keyCode == 13) nextState();
    })

    // Enter direct connect input
    $("#direct-connect-input").keyup(function (event) {
        if (event.keyCode == 13) {
            nextState();
            return;
        }

        let val = $("#direct-connect-input").val();
        setCookie("directConnect", val, 365);
        if (val) {
            $("#continue-bar").text(`Direct Connect`);
            $("#continue-bar").css({"background-color": "green"});
        } else if (currentServer) {
            $("#continue-bar").text(`Join server (${currentServer.region})`)
        }
        
    })
})

// Next menu state
function nextState(e) {
    if (state == 0) { // Start Menu -> Server Select
        showServerSelect();

        state += 1;
    } else if (state == 1 && currentServer) { // Server Select -> Loading Game
        // Direct connection
        let directConnect = $("#direct-connect-input").val();
        if (directConnect) {  
            connect(directConnect);
        } else {
            connect(currentServer.link);
        }

        showSettings();

        state += 1;
    } else if (state == 2 && loaded > maxLoaded) { // Loading Game -> Loading Chunks
        console.log("Loading chunks...")
        loadedAnimate = new Ola(Object.keys(chunkManager.currCells).length);
        state += 1;
    } else if (state == 3 && Object.keys(chunkManager.currCells).length >= maxChunks) { // Loading Chunks -> In Game
        console.log("Requesting pointer lock");
        requestPointerLock();

        $(".menu-button").hide()
        $("#ingame-bar").show();
        state += 1;
    } else if (state == 4) { // In Game
        
        if (e) {
            let x = e.pageX;
            let y = e.pageY;
            let disconnectButton = x > $("#disconnect-bar").offset().left && x < $("#disconnect-bar").offset().left + $("#disconnect-bar").width() && y > $("#disconnect-bar").offset().top && y < $("#disconnect-bar").offset().top + $("#disconnect-bar").height();

            if (disconnectButton) { // Disconnect from server
                disconnectServer();
            } else { // Return to game
                requestPointerLock();
            }
        }
    }
    
}

function prevState() {
    if (state == 2) { // Go back to server select menu
        showServerSelect();

        state -= 1; 
    } else if (state == 4) { // Go back to server select menu
        showServerSelect();
        
        loaded -= 1;
        state -= 3; 
        initialized = false;
    }
}

// Show server select page
function showServerSelect() {
    refreshServers();
        
    $(".input").hide(); // Hide input fields
    $(".menu-button").hide(); // Hide menu buttons
    $(".tab-container").hide(); // Hide tab containers
    
    let directConnect = getCookie("directConnect");
    if (directConnect) {
        $("#direct-connect-input").val(directConnect).focus();
        $("#continue-bar").text(`Direct Connect`);
        $("#continue-bar").css({"background-color": "green"});
    } else {
        $("#continue-bar").text("Finding Servers...");
        $("#continue-bar").css({"background-color": "orange"});
    }

    $("#direct-connect-input").show();
    $("#continue-bar").show();

    $("#server-select").show();
    $("#server-button")[0].click();

    $("#background-image").show();
}

// Show settings page
function showSettings() {
    $(".menu-button").hide();
    $("#loading-bar").show();

    $(".input").hide();
    $("#name-input").show();

    $(".tab-container").hide();
    $("#settings").show();
    $("#video-button")[0].click();
}


// Update menu state
function updateMenu() {
    
    // Animate menu
	if (initialized && state == 4) { // In game
		$("#loading-bar").text("Return to game");
		$("#loading-bar").width(100+"%");
	} else if (state == 3) { // Loading chunks
		let chunksLoaded = Object.keys(chunkManager.currCells).length;
		loadedAnimate.value = chunksLoaded;
		$("#loading-bar").width(100*(Math.min(loadedAnimate.value, maxChunks)/maxChunks)+"%");
		$("#loading-bar").text("Chunks Loaded (" + chunksLoaded + "/" + maxChunks + ")");

		if (chunksLoaded >= maxChunks) {
			nextState();
		}
	} else if (state == 2) { // Loading game
        // Update loading progress
        if (loadedAnimate.value >= maxLoaded) {
            $("#loading-bar").text("Spawn")

            if (!joined) {
                joined = true;
                joinServer();
            }
        } else if (loadedAnimate.value < maxLoaded && !$("#loading-bar").text().includes("Spawn")) {
            let text = Math.min(100, round(loadedAnimate.value/maxLoaded*100, 0));
            $("#loading-bar").text("Loading " + text + "%")
        }

        // Set loading progress
		loadedAnimate.value = loaded;
		$("#loading-bar").width(100*(Math.min(loadedAnimate.value, maxLoaded)/maxLoaded)+"%")
    } else if (state == 1) {

    }
}