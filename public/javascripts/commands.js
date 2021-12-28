/*
    MINECRAFT COMMANDS	
*/

function checkCommand(msg) {
    if (msg[0] == "gamemode") {
        let prevGamemode = player.mode;
        if (["survival", "s"].indexOf(msg[1]) > -1) {
            addChat({
                text: "Gamemode changed to survival mode"
            });
            player.mode = "survival";
        } else if (["creative", "c"].indexOf(msg[1]) > -1) {
            addChat({
                text: "Gamemode changed to creative mode"
            });
            player.mode = "creative";
        } else if (["spectator", "sp"].indexOf(msg[1]) > -1) {
            addChat({
                text: "Gamemode changed to spectator mode"
            });
            player.mode = "spectator";
        } else if (["camera", "ca"].indexOf(msg[1]) > -1) {
            addChat({
                text: "Gamemode changed to camera mode"
            });
            player.mode = "camera";
        } else {
            addChat({
                text: "Error: Unrecognized gamemode",
                color: "red"
            });
        }

        if (player.mode != prevGamemode) {
            player.updateGamemode();
        }
    } else if (msg[0] == "tp") {
        msg.shift();

        if (Number.isInteger(parseInt(msg[0])) || msg[0] == "~") {
            let validCoordinates = true;
            for (let i = 0; i < 3; i++) {
                if (!(Number.isInteger(parseInt(msg[i])) || msg[i] == "~")) {
                    validCoordinates = false;
                    break;
                } else if (msg[i] == "~") {
                    if (i == 0) {
                        msg[i] = player.position.x/world.blockSize;
                    } else if (i == 1) {
                        msg[i] = player.position.y/world.blockSize;
                    } else if (i == 2) {
                        msg[i] = player.position.z/world.blockSize;
                    }
                }
            }

            console.log("Attempting to teleport to " + msg[0] + " " + msg[1] + " " + msg[2]);

            if (validCoordinates) {
                let coord = new THREE.Vector3(parseFloat(msg[0])*world.blockSize, parseFloat(msg[1])*world.blockSize, parseFloat(msg[2])*world.blockSize);
                player.setCoord(coord);
            } else {
                addChat({
                    text: 'Error: Invalid coordinate (format: /tp <int> <int> <int>)',
                    color: "red"
                });
            }
        } else {

            let target = msg.join(" ");
            console.log("Attempting to teleport to " + target);

            let exists = false;
            for (let id in players) {
                let p = players[id];
                if (p.name == target) {
                    exists = true; 
                    addChat({
                        text: "Teleported " + player.name + " to " + p.name
                    });
                    player.setCoord(p.pos);

                    break;
                }
            }
            if (!exists) {
                addChat({
                    text: 'Error: No player found with name "' + target + '" to teleport to',
                    color: "red"
                });
            }
        }
    } else if (msg[0] == "time") {
        if (typeof(parseInt(msg[1])) == "number")
            socket.emit('settime', parseInt(msg[1]))
            
    } else if (msg[0] == "god") {
        if (!player.god) {
            player.god = true;
            addChat({
                text: "God mode enabled"
            });
            player.updateGamemode(true);
        } else if (player.god) {
            player.god = false;
            addChat({
                text: "God mode disabled"
            });
            player.updateGamemode(true);
        }
            
    } else if (msg[0] == "help") {
        if (msg.length == 1) {
            addChat({
                text: 'COMMANDS: /help, /tutorial, /tp <player>, /tp <x> <y> <z>, /time <int>, /gamemode <mode>, /god, /time <int>'
            })
            addChat({
                text: 'Type /help <command> for more info on a command'
            })
        } else {
            let command = msg[1];
            if (command == "tp") {
                addChat({
                    text: '/tp <int> <int> <int> - Teleports you to the specified coordinates'
                })
                addChat({
                    text: '/tp <player> - Teleports you to the specified player'
                })
            } else if (command == "time") {
                addChat({
                    text: '/time <int> - Sets the time to the specified number'
                })
            } else if (command == "gamemode") {
                addChat({
                    text: '/gamemode - Displays your current gamemode'
                })
            } else if (command == "help") {
                addChat({
                    text: '/help - Displays this message'
                })
            } else if (command == "god") {
                addChat({
                    text: '/god - Toggles god mode'
                })
            } else if (command == "tutorial") {
                addChat({
                    text: '/tutorial - Displays the tutorial'
                })
            } else {
                addChat({
                    text: 'Error: Command not found'
                })
            }
        }
    } else if (msg[0] == "tutorial") {
        addChat({
            text: "------------------"
        })
        addChat({
            text: "TUTORIAL"
        })
        addChat({
            text: "Use WASD to move around and SPACEBAR to jump"
        })
        addChat({
            text: "Use the mouse to look around, left click to mine and attack, right click to place blocks"
        })
        addChat({
            text: "Press E to open your inventory and crafting menu"
        })
        addChat({
            text: "------------------"
        })
    } else {
        addChat({
            text: 'Error: Unable to recognize command "' + msg[0] + '" (type /help for a list of commands)',
            color: "red"
        });
    }
}