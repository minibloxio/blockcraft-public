/*
    MINECRAFT COMMANDS	
*/


let commandsInit = JSON.stringify({
    "gamemode": {
        "hint": "<mode> - Changes your gamemode",
        "hints": {
            "survival": "Survival mode (default)",
            "creative": "Creative mode (no damage taken)",
            "spectator": "Spectator mode (free movement)",
            "camera": "Camera mode (no hud)"
        },
        "error": "Invalid gamemode"
    },
    "tp": {
        "hint": "<player>|<x> <y> <z> - Teleports you to the specified player or coordinates",
        "hints": {},
        "error": "Invalid player"
    },
    "time": {
        "hint": "<int> - Sets the time to the specified number",
    },
    "god": {
        "hint": "- Toggles god mode",
    },
    "help": {
        "hint": "- Displays this message",
    },
    "tutorial": {
        "hint": "- Displays the tutorial"
    },
    "seed": {
        "hint": "- Displays the world seed",
    },
})
let commands = JSON.parse(commandsInit);

// Give command hints
function giveCommandHint(msg, autocomplete) {
    // Initialize variables
    commands = JSON.parse(commandsInit);
    hintText = "/";
    let firstArgUnique = false;
    let firstArgValue = "";
    let secondHint = false;
    let secondHintValue = "";

    // Update tp hint
    for (let id in players) {
        commands.tp.hints[players[id].name] = "Teleport to " + players[id].name;
    }
    
    // Check if the command exists
    let commandIds = Object.keys(commands);
    for (let i = 0; i < commandIds.length; i++) {
        let command = commandIds[i];

        // If the string is a substring of a command
        if (command.startsWith(msg[0]) && command != msg[0]) {

            if (firstArgUnique) {
                hintText += ", " + command;
                firstArgValue = "";
            } else {
                hintText += command;
                firstArgUnique = command;
                firstArgValue = command;
            }

            if (autocomplete) {
                let extraSpace = Object.keys(commands[command]).length > 1 ? " " : "";
                let completedCommand = hintText + extraSpace;
                $("#chat-input").val(completedCommand);
                giveCommandHint(completedCommand.slice(1).split(" "), false);
                return;
            }
        }

        // If the command exists and the command has no second argument
        if (command == msg[0] && msg.length == 1) { 
            if (autocomplete) {
                let extraSpace = Object.keys(commands[command]).length > 1 ? " " : "";
                let completedCommand = hintText + command + extraSpace;
                $("#chat-input").val(completedCommand);
                giveCommandHint(completedCommand.slice(1).split(" "), false);
                return;
            }

            hintText += command + " " + commands[command].hint;
        }

        // If the command exists and the command has a second argument
        if (command == msg[0] && msg.length >= 2 && commands[command].hints) { 
            hintText += msg[0] + " ";

            // Check if the second argument is a valid
            let hints = Object.keys(commands[command].hints);
            for (let hint of hints) {
                if (hint == "hint") continue;

                if (hint.startsWith(msg[1])) {
                    if (secondHint) {
                        hintText += ", " + hint;
                        secondHintValue = "";
                    } else {
                        hintText += hint;
                        secondHint = hint;
                        secondHintValue = hint;
                    }

                    if (autocomplete) {
                        let completedCommand = hintText;
                        $("#chat-input").val(completedCommand);
                        giveCommandHint(completedCommand.slice(1).split(" "), false);
                        return;
                    }
                }
            }

            if (msg[0] == "tp" && Number.isInteger(parseInt(msg[1])) && !msg[4]) {
                msg.shift();
                hintText += msg.join(" ");
                hintText += " - Teleport to " + msg[0] + " " + (msg[1] || "<int>") + " " + (msg[2] || "<int>");
                return;
            }

            // Check if the second argument is the only one available
            if (secondHintValue) {
                hintText += " - " + commands[command].hints[secondHintValue];
            } else if (!secondHint) {
                hintText += msg[1] + " - " + commands[command].error;
                hintText = "?" + hintText;
            }
        }
    }

    if (hintText == "/") {
        hintText += msg.join(" ") + " - No command found";
        hintText = "?" + hintText;
    }
    if (firstArgUnique && firstArgValue) {
        hintText += " " + commands[firstArgValue].hint;
    }
}

// Check command validity
function checkCommand(msg) {
    let commandIds = Object.keys(commands);
    if (msg[0] == "gamemode") {
        updateGamemode(msg[1]);
    } else if (msg[0] == "tp") {
        teleport(msg)
    } else if (msg[0] == "time") {
        setTime(msg[1]);
    } else if (msg[0] == "god") {
        changeGodmode();
    } else if (msg[0] == "help") {
        displayHelp(msg);
    } else if (msg[0] == "tutorial") {
        displayTutorial();
    } else if (msg[0] == "seed") {
        displaySeed();
    } else if (msg[0] == "tutorial") {
        displayTutorial();
    } else if (msg[0] == "tutorial") {
        displayTutorial();
    } else if (msg[0] == "tutorial") {
        displayTutorial();
    } else {
        addChat({
            text: 'Error: Unable to recognize command "' + msg[0] + '" (type /help for a list of commands)',
            color: "red"
        });
    }
}

// Display help
function displayHelp(msg) {
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
}

// Display tutorial
function displayTutorial() {
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
}

// Update the gamemode of the player
function updateGamemode(mode) {
    let prevGamemode = player.mode;
    if (["survival", "s"].indexOf(mode) > -1) {
        addChat({
            text: "Gamemode changed to survival mode"
        });
        player.mode = "survival";
    } else if (["creative", "c"].indexOf(mode) > -1) {
        addChat({
            text: "Gamemode changed to creative mode"
        });
        player.mode = "creative";
    } else if (["spectator", "sp"].indexOf(mode) > -1) {
        addChat({
            text: "Gamemode changed to spectator mode"
        });
        player.mode = "spectator";
    } else if (["camera", "ca"].indexOf(mode) > -1) {
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
}

// Set the time of day
function setTime(time) {
    if (typeof(parseInt(time)) == "number")
        socket.emit('settime', parseInt(time))
}

// Teleport the player to the specified coordinates or player
function teleport(msg) {
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
}

// Change godmode
function changeGodmode() {
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
}

// Display world seed
function displaySeed() {
    addChat({
        text: "World seed: " + world.seed
    });
}