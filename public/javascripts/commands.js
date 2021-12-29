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
        "hint": "- Displays available commands",
    },
    "tutorial": {
        "hint": "- Displays the tutorial"
    },
    "seed": {
        "hint": "- Displays the world seed",
    },
    "setblock": {
        "hint": "<x> <y> <z> <block> - Sets the block at the specified coordinates to the specified block",
        "hints": {},
        "error": "Invalid coordinates/block"
    },
    "give": {
        "hint": "<item> [amount] - Gives you the specified item with the specified amount",
        "hints": {},
        "error": "Invalid item"
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
    commands.setblock.hints = world.blockId; // Update setblock hint
    commands.give.hints = world.blockId; // Update give hint
    commands.help.hints = commands; // Update help hint

    // Check if the command exists
    let commandIds = Object.keys(commands);
    for (let i = 0; i < commandIds.length; i++) {
        let command = commandIds[i];

        // If the string is a substring of a command
        if (command.startsWith(msg[0]) && command != msg[0] && msg.length == 1) {

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
        if (command == msg[0]) {
            firstArgUnique = command;

            if (msg.length == 1) {
                if (autocomplete) {
                    let extraSpace = Object.keys(commands[command]).length > 1 ? " " : "";
                    let completedCommand = hintText + command + extraSpace;
                    $("#chat-input").val(completedCommand);
                    giveCommandHint(completedCommand.slice(1).split(" "), false);
                    return;
                }

                hintText += command + " " + commands[command].hint;
            }
        }

        // If the command exists and the command has a second argument
        if (command == msg[0] && msg.length >= 2 && commands[command].hints) { 
            firstArgUnique = command;
            hintText += msg[0] + " ";

            // Special case for /setblock
            if (msg[0] == "setblock") {
                msg.shift();
                if (msg.length < 4) {
                    hintText += msg.join(" ").removeExtraSpaces() + " ";

                    if (autocomplete && msg.length <= 3) {
                        if ((msg[2] == undefined || msg[2].length == 0)) hintText += '~';
                        let completedCommand = (hintText + " ").removeExtraSpaces();
                        $("#chat-input").val(completedCommand);
                        giveCommandHint(completedCommand.slice(1).split(" "), false);
                        return;
                    }

                    if (msg.length <= 3 && (msg[2] == undefined || !msg[2].length)) hintText += "~";

                    hintText += " - Set block at " + getCoord(msg);
                    hintText = hintText.removeExtraSpaces();
                    return;
                } else if (msg.length == 4) {
                    hintText += msg.slice(0, 3).join(" ") + " ";
                    msg.splice(0, 2);
                }
            }

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
                
                // Check for third argument
                if (msg[0] == "give" && hint == msg[1]) {
                    if (msg[2] == undefined || msg[2].length == 0) {
                        hintText += " [int] Give 1 " + hint;
                        return;
                    } else if (msg.length == 3) {
                        hintText += " " + msg[2] + " - Give " + clamp(parseInt(msg[2]), 0, 64) + " " + hint;
                        return;
                    }
                }
            }

            // Special case for /tp
            if (msg[0] == "tp") {
                msg.shift();
                if ((Number.isInteger(parseInt(msg[0])) || msg[0] == "~")) {
                    let coord = getCoord(msg);
                    if (coord) {
                        if (msg.length == 3 && !validCoord(msg)) {
                            hintText += msg.join(" ") + " - Invalid coordinates";
                            return;
                        } else {
                            hintText += msg.join(" ") + " - Teleport to " + coord;
                            return;
                        }
                    }
                } else if (Object.keys(commands[command].hints) == 0) {
                    hintText += msg.join(" ") + " - No players online to teleport to";
                    return;
                }
            }

            // Check if the second argument is the only one available
            if (secondHintValue) {
                hintText += " " + (commands[command].hints[secondHintValue].hint || ("- " + commands[command].hints[secondHintValue]));
                return;
            } else if (!secondHint) {
                msg.shift();
                hintText += msg.join(" ") + " - " + commands[command].error;
                hintText = "?" + hintText;
            }

            break;
        }
    }

    msg = msg.join(" ").trim().split(" ");
    if ((hintText == "/" && !firstArgUnique) || (msg.length > 1 && msg[0] != firstArgUnique && msg[1].length > 0 && !secondHint)) {
        hintText += msg.join(" ") + " - No command found";
        hintText = "?" + hintText;
    }
    if (firstArgUnique && firstArgValue) {
        hintText += " " + commands[firstArgValue].hint;
    }
}

function getCoord(msg, pos, decimalPlace) {
    let x = msg[0] == "~" ? round(player.position.x/world.blockSize, decimalPlace) : parseInt(msg[0]);
    let y = msg[1] == "~" ? round(player.position.y/world.blockSize, decimalPlace) : parseInt(msg[1]);
    let z = msg[2] == "~" ? round(player.position.z/world.blockSize, decimalPlace) : parseInt(msg[2]);
    if (pos) {
        return {x: x, y: y, z: z};
    } else {
        return "x: " + (x || "<int>") + " y: " + (y || "<int>") + " z: " + (z || "<int>");
    }
}

function validCoord(msg) {
    console.log(msg);
    if (msg.length != 3) return false;
    if (msg[0].length == 0 || msg[1].length == 0 || msg[2].length == 0) return true;
    let pos = getCoord(msg, true);
    return pos.x && pos.y && pos.z;
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
    } else if (msg[0] == "setblock") {
        setBlock(msg);
    } else if (msg[0] == "give") {
        giveItem(msg);
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
        if (commands[command]) {
            addChat({
                text: 'Usage: /' + command + ' ' + commands[command].hint
            })
        } else {
            addChat({
                text: 'Error: Unable to recognize command "' + command + '"'
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
        let validCoordinates = validCoord(msg);
        let pos = getCoord(msg, true, 3);
        console.log("Attempting to teleport to " + pos.x + " " + pos.y + " " + pos.z);

        if (validCoordinates) {
            let coord = new THREE.Vector3(pos.x*world.blockSize, pos.y*world.blockSize, pos.z*world.blockSize);
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

// Set a block
function setBlock(msg) {
    msg.shift();
    console.log(msg);
    let validCoordinates = validCoord(msg.slice(0, 3));
    let pos = getCoord(msg, true);
    console.log("Attempting to set block at " + pos.x + " " + pos.y + " " + pos.z);

    if (validCoordinates) {
        let coord = new THREE.Vector3(pos.x, pos.y, pos.z);
        socket.emit('setBlock', {
            x: coord.x,
            y: coord.y,
            z: coord.z,
            t: world.blockId[msg[3]],
            cmd: true,
        });
        addChat({
            text: "Set block at " + coord.x + " " + coord.y + " " + coord.z + " to " + msg[3] + " (" + world.blockId[msg[3]] + ")"
        })
    } else {
        addChat({
            text: 'Error: Invalid coordinate (format: /setblock <int> <int> <int>)',
            color: "red"
        });
    }
}

// Give a player a specified amount of a specified item
function giveItem(msg) {
    msg.shift();
    let item = msg.shift();
    let amount = msg.shift();
    if (amount == undefined || amount.length == 0) amount = 1;

    if (Number.isInteger(parseInt(amount)) && world.blockId[item]) {
        amount = clamp(amount, 1, 64);
        socket.emit('giveItem', {
            item: item,
            amount: amount,
        })
        addChat({
            text: "Gave " + amount + " " + item + " to " + player.name
        })
    } else {
        addChat({
            text: 'Error: Invalid item or amount',
            color: "red"
        });
    }
}