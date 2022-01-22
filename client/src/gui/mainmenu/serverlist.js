import axios from "axios";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import { prevState } from "../..";
import { connectionDelay, g, isState, sessionServerEndpoint } from "../../globals";
import { drawCircle, drawRectangle, msToTime, round } from "../../lib/helper";
import chunkManager from "../../managers/ChunkManager";
import world from "../../world/WorldManager";
import player from "../../entity/player/Player";

export async function refreshServers() {
  // Disconnect servers
  for (let link in g.servers) {
    let server = g.servers[link];
    server.socket.disconnect();
  }

  // Connect to servers
  g.servers = {};
  g.currentServer = undefined;

  let serverList = (await axios.get(sessionServerEndpoint)).data.servers;
  if (!serverList) serverList = oldServerList;

  console.log(serverList);

  $("#server-container").empty();
  for (let i = 0; i < serverList.length; i++) {
    console.log(serverList[i]);
    let serverLink = serverList[i];
    g.servers[serverLink] = {
      socket: io(serverLink, {
        forceNew: true,
        reconnection: false,
      }),
      link: serverLink,
      info: {},
    };

    let server = g.servers[serverLink];

    // Connected to server
    server.socket.on("connect", function () {
      setTimeout(function () {
        server.socket.emit("serverInfoRequest", Date.now());
      }, 500);
    });

    // Error connecting to server
    server.socket.on("connect_error", function (error) {
      //console.error(error);
    });

    // Disconnected from server
    server.socket.on("disconnect", function (reason) {
      if (reason == "transport close") {
        console.log("Server down!");
        server.socket.disconnect();
      }
    });

    // Received server info
    server.socket.on("serverInfoResponse", function (data) {
      // Update server info
      g.servers[data.link].info = data;

      // Player names
      let playerNames = [];
      for (let id in data.players) playerNames.push(data.players[id]);
      if (playerNames.length > 0) {
        playerNames = "Usernames: " + playerNames.join(", ");
      }

      // Update server list
      let latency = Date.now() - data.ping;
      let name = data.name || "Unnamed";
      let serverHTML = $(`
                <div class='server' data-link='${data.link}' id='server-${data.region}'>
                    <p>Name: ${name}</p>
                    <p>Players: ${Object.keys(data.players).length}/20</p>
                    <div class="animated"><p id="player-names">${playerNames}</p></div>
                    <div>
                        <p class="serverInfo">${latency}ms</p>
                        <canvas id="${data.region}" class="serverBar" width="30" height="24"></canvas>
                    </div>

                    <div>
                        <p class="serverInfo" style="margin-bottom: 0; top: 54px;">${msToTime(data.uptime)} </p>
                        <canvas id="${data.region}-2" class="serverBar" style="top: 54px;" width="30" height="24"></canvas>
                    </div>
                </div>
            `);

      // Check if it's the first server
      if (!g.currentServer && !$("#direct-connect-input").val().length) {
        g.currentServer = data;

        setJoinButton(data);

        serverHTML.css({
          "background-color": "rgba(0,0,0,0.7)",
          outline: "2px solid white",
        });
      }

      $("#server-container").append(serverHTML);

      $(`#server-${data.region}`).on("click", function (event) {
        clickServer(event);
      });

      $(`#server-${data.region}`).on("dblclick", function (event) {
        clickServer(event, true);
      });

      let ctx_ = $("#" + data.region)[0].getContext("2d");
      drawConnectionBars(ctx_, latency);

      ctx_ = $("#" + data.region + "-2")[0].getContext("2d");
      drawCircle(15, 12, 11, "white", { ctx: ctx_, fill: false, outline: true, outlineColor: "white", outlineWidth: 2 });
      drawCircle(15, 12, 2, "white", { ctx: ctx_ });
      drawRectangle(14, 3, 2, 7, "white", { ctx: ctx_ });
      server.socket.disconnect();
    });
  }
}

const barToColour = ["", "red", "orange", "yellow", "green", "lime"];

function drawConnectionBars(ctx, latency) {
  let numOfBars = Math.max(5 - Math.floor(latency / 60), 1);
  let color = barToColour[numOfBars];
  for (let i = 0; i < numOfBars; i++) {
    drawRectangle(i * 6, 16 - i * 4, 5, (i + 1) * 4, color, { ctx: ctx });
  }
  for (let i = numOfBars; i < 5; i++) {
    drawRectangle(i * 6, 16 - i * 4, 5, (i + 1) * 4, "grey", { ctx: ctx });
  }
}

export function showServerSelect() {
  refreshServers();

  $(".input").hide(); // Hide input fields
  $(".menu-button").hide(); // Hide menu buttons
  $(".tab-container").hide(); // Hide tab containers

  let directConnect = Cookies.get("directConnect");
  if (directConnect) {
    $("#direct-connect-input").val(directConnect).focus();
    $("#server-bar").text(`Direct Connect`);
    $("#server-bar").css({ "background-color": "green" });
  } else {
    $("#server-bar").text("Finding Servers...");
    $("#server-bar").css({ "background-color": "orange" });
  }

  $("#direct-connect-input").show();
  $("#server-bar").show();

  $("#server-select").show();
  $("#server-button")[0].click();

  $("#background-image").show();
}

// Error connecting to server
export function connectError(type, reason) {
  reason = reason ? " (" + reason + ")" : "";
  let bar = $("#server-bar");
  if (type == "banned") {
    bar.text("Banned from server" + reason);
    bar.css({ "background-color": "red" });
  } else if (type == "kicked") {
    bar.text("Kicked from server" + reason);
    bar.css({ "background-color": "red" });
  } else {
    console.error("Error connecting to server!");
    bar.text("Connection failed");
    bar.css({ "background-color": "red" });
  }

  setTimeout(function () {
    if ($("#direct-connect-input").val()) {
      bar.text(`Direct Connect`);
    } else if (currentServer) {
      bar.text(`Join server (${currentServer.region})`);
    } else {
      bar.text(`Join server`);
    }
    bar.css({ "background-color": "green" });

    if (!type) state -= 1;
  }, connectionDelay);
}

// Set join button
function setJoinButton(server) {
  if (isState("serverSelect") && !$("#direct-connect-input").val().length) {
    $("#server-bar").text(`Join server (${server.region})`);
    $("#server-bar").css({ "background-color": "green" });
  }
}

// Clicked on a server
function clickServer(event, doubleClick) {
  let server = $(event.target).closest(".server");
  let url = server.data("link");
  if (url in g.servers) {
    g.currentServer = g.servers[url];
  }

  // Outline selected server
  $("#server-container").children().css({
    "background-color": "rgba(0,0,0,0.5)",
    outline: "none",
  });
  server.css({
    "background-color": "rgba(0,0,0,0.7)",
    outline: "2px solid white",
  });

  // Remove direct connect cookie
  $("#direct-connect-input").val("");
  Cookies.remove("directConnect");

  // Set join button
  setJoinButton(g.currentServer.info);

  // Auto join server
  if (doubleClick) {
    $("#start-button").click();
  }
}

// Update menu state
export function updateMenu(nextStateCB) {
  // Animate menu
  if (isState("serverSelect")) {
    // Server select
  } else if (isState("loading")) {
    // Loading game

    // Update loading progress
    if (g.loadedAnimate.value >= g.maxLoaded) {
      $("#loading-bar").text("Spawn");

      if (!g.joined) {
        g.joined = true;
        joinServer();
      }
    } else if (g.loadedAnimate.value < g.maxLoaded && !$("#loading-bar").text().includes("Spawn")) {
      let text = Math.min(100, round((g.loadedAnimate.value / g.maxLoaded) * 100, 0));
      $("#loading-bar").text("Loading " + text + "%");
    }

    // Set loading progress
    g.loadedAnimate.value = g.loaded;
    $("#loading-bar").width(100 * (Math.min(g.loadedAnimate.value, g.maxLoaded) / g.maxLoaded) + "%");
  } else if (isState("loadingChunks")) {
    // Loading chunks

    let chunksLoaded = Object.keys(chunkManager.currChunks).length;
    g.loadedAnimate.value = chunksLoaded;
    $("#loading-bar").width(100 * (Math.min(g.loadedAnimate.value, g.maxChunks) / g.maxChunks) + "%");
    $("#loading-bar").text("Chunks Loaded (" + chunksLoaded + "/" + g.maxChunks + ")");

    if (chunksLoaded >= g.maxChunks) {
      nextStateCB();
    }
  } else if (g.initialized && isState("inGame") && !player.controls.enabled) {
    // In game

    $("#loading-bar").text("Return to game");
    $("#loading-bar").width(100 + "%");
  } else if (isState("disconnecting")) {
    // Disconnecting
    g.disconnectedAnimate.value = g.maxDisconnected - chunkManager.chunksToUnload.length;
    let text = Math.min(100, round((g.disconnectedAnimate.value / g.maxDisconnected) * 100, 0));
    $("#disconnecting-bar").text("Disconnecting " + text + "%");
    $("#disconnecting-bar").width(100 * (Math.min(g.disconnectedAnimate.value, g.maxDisconnected) / g.maxDisconnected) + "%");

    if (g.disconnectedAnimate.value >= g.maxDisconnected) {
      for (let id in g.cellIdToMesh) {
        // Dispose of all remaining meshes
        world.deleteCell(id, true);
      }
      chunkManager.removeAllDebugLines();
      prevState();
    }
  }
}

// Join server
function joinServer() {
  if (!g.initialized) {
    let name = $("#name-input").val() || "";

    let joinInfo = {
      name: name,
      token: Cookies.get("token"),
      skin: player.skin,
    };
    g.socket.emit("join", joinInfo);
    g.loaded += 1;
    console.log("Joining server...");
  }
}
