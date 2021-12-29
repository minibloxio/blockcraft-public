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
        "error": "Invalid coordinates/block"
    },
    "give": {
        "hint": "<item> [amount] - Gives you the specified item with the specified amount",
        "error": "Invalid item"
    },
    "clear": {
        "hint": "- Clears the specified type",
        "hints": {
            "hand": "Clears the item in your hand",
            "inventory": "Clears all items in your inventory",
            "chat": "Clears all messages in the chat"
        },
        "error": "Invalid type to clear"
    },
    "reload": {
        "hint": "- Reloads the chunks",
    },
    "op": {
        "hint": "<player> <password> - Makes the specified player an operator",
        "error": "Invalid player"
    },
    "deop": {
        "hint": "<player> <password> - Removes the specified player's operator status",
        "error": "Invalid player"
    },
    "leave": {
        "hint": "- Disconnect from this server (alias: quit, exit, disconnect)",
    },
    "kill": {
        "hint": "<player> - Kills the specified player (requires operator status)",
        "error": "Invalid player"
    },
    "kick": {
        "hint": "<player> [reason] - Kicks the specified player (requires operator status)",
        "error": "Invalid player"
    },
})
let commands = JSON.parse(commandsInit);

// Update hints
function updateHints() {
    commands.tp.hints = {};
    commands.op.hints = {};
    commands.deop.hints = {};
    commands.kick.hints = {};
    commands.kill.hints = {};
    commands.setblock.hints = {};
    commands.give.hints = {};

    for (let id in players) {
        commands.tp.hints[players[id].name] = "Teleport to " + players[id].name; // Update tp hint
        commands.op.hints[players[id].name] = "Make " + players[id].name + " an operator"; // Update op hint
        commands.deop.hints[players[id].name] = "Remove " + players[id].name + "'s operator status"; // Update deop hint
        commands.kick.hints[players[id].name] = "Kick " + players[id].name + " from the server"; // Update kick hint
        commands.kill.hints[players[id].name] = "Kill " + players[id].name; // Update kill hint
    }
    commands.op.hints[player.name] = "Make yourself an operator"; // Update op hint
    commands.deop.hints[player.name] = "Remove your operator status"; // Update deop hint
    commands.kill.hints[player.name] = "Kill yourself" // Update kill hint

    for (let id in world.blockId) {
        commands.setblock.hints[id] = "Set block to " + id; // Update setblock hint
        commands.give.hints[id] = "Give 1 " + id + " to yourself"; // Update give hint
    }
    commands.help.hints = commands; // Update help hint
}

// Give command hints
function giveCommandHint(msg, autocomplete) {
    // Initialize variables
    commands = JSON.parse(commandsInit);
    hintText = "/";
    let firstArgUnique = false;
    let firstArgValue = "";
    let firstArgCounter = 0;
    let secondHint = false;
    let secondHintValue = "";
    let secondHintCounter = 0;
    let commandHintLimit = 5;

    updateHints(); // Update hints

    // Check if the command exists
    let commandIds = Object.keys(commands).sort();
    for (let i = 0; i < commandIds.length; i++) {
        let command = commandIds[i];

        // If the string is a substring of a command
        if (command.startsWith(msg[0]) && command != msg[0] && msg.length == 1) {
            firstArgCounter += 1;
            if (firstArgCounter > commandHintLimit) return;

            if (firstArgUnique) { // If the first argument is unique
                hintText += ", " + command;
                firstArgValue = "";
            } else {
                hintText += command;
                firstArgUnique = command;
                firstArgValue = command;
            }
            
            if (autocomplete) { // Autocomplete the command
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
                    secondHintCounter += 1;
                    if (secondHintCounter > commandHintLimit) return;

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
                if (hint == msg[1] && msg.length >= 3) {
                    if (msg[0] == "give") {
                        let num = clamp(parseInt(msg[2]), 0, 64);
                        if (msg[2] == '') num = 1;
                        hintText += " " + msg[2] + " - Give " + num + " " + hint + " to yourself";
                        return;
                    } else if (msg[0] == "op") {
                        hintText += " " + msg[2] + " - Enter the password to make " + hint + " an operator";
                        return;
                    } else if (msg[0] == "deop") {
                        hintText += " " + msg[2] + " - Enter the password to remove " + hint + " as an operator";
                        return;
                    } else if (msg[0] == "kick") {
                        hintText += " " + msg[2] + " - Enter the reason for kicking " + hint;
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
    } else if (msg[0] == "clear") {
        clear(msg[1]);
    } else if (msg[0] == "reload") {
        chunkManager.reload();
    } else if (msg[0] == "op") {
        setOperator(msg, true);
    } else if (msg[0] == "deop") {
        setOperator(msg, false);
    } else if (msg[0] == "leave" || msg[0] == "quit" || msg[0] == "exit" || msg[0] == "disconnect" || msg[0] == "disc") {
        disconnectServer();
    } else if (msg[0] == "kick") {
        kickPlayer(msg);
    } else if (msg[0] == "kill") {
        killPlayer(msg);
    } else if (msg[0] == "deop") {
        setOperator(msg, false);
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
        let helpText = "";
        for (let command of Object.keys(commands).sort()) {
            helpText += "/" + command + ", ";
        }

        // Display all commands
        addChat({
            text: 'COMMANDS: ' + helpText.slice(0, -2),
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
            text: "Set block at " + coord.x + " " + coord.y + " " + coord.z + " to " + msg[3]
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
        amount = clamp(parseInt(amount), 1, 64);
        socket.emit('giveItem', {
            item: world.blockId[item],
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

// Clears the specified type
function clear(type) {
    if (type == "hand") { // Clear the hand
        let item = player.toolbar[player.currentSlot];
        if (item) {
            socket.emit('clearHand', player.currentSlot);
            let thing = item.class == "block" ? world.blockOrder[item.v] : world.itemOrder[item.v];
            addChat({
                text: "Cleared " + item.c + " " + thing + " from hand"
            });
        } else {
            addChat({
                text: "No item in hand to clear",
                color: "red"
            });
        }
    } else if (type == "inventory") { // Clear the inventory
        socket.emit('clearInventory');
        addChat({
            text: "Cleared inventory"
        });
    } else if (type == "chat") { // Clear the chat
        chat.length = 0;
        addChat({
            text: "Cleared chat"
        });
    } else { // Invalid type
        addChat({
            text: 'Error: Invalid clear type',
            color: "red"
        });
    }
}

// Set operator status
function setOperator(msg, isOp) {
    msg.shift();
    let target = msg[0];
    let password = msg[1];
    let playerId = null;

    let exists = false;
    if (target == player.name) {
        exists = true;
        playerId = socket.id;
    }
    for (let id in players) {
        let p = players[id];
        if (p.name == target) {
            exists = true; 
            playerId = id;
            break;
        }
    }

    if (!exists) {
        addChat({
            text: 'Error: No player found with name "' + target + '" to set operator status for',
            color: "red"
        });
    } else if (password == undefined || password.length == 0) {
        addChat({
            text: 'Error: No password specified',
            color: "red"
        });
    } else {
        socket.emit('setOperator', {
            id: playerId,
            name: target,
            password: password,
            isOp: isOp
        });
    }
}

// Kick a player
function kickPlayer(msg) {
    msg.shift();
    let target = msg[0];
    let reason = msg[1] ? msg[1] : "No reason specified";
    let playerId = null;

    let exists = false;
    if (target == player.name) {
        exists = true;
        playerId = socket.id;
    }
    for (let id in players) {
        let p = players[id];
        if (p.name == target) {
            exists = true; 
            playerId = id;
            break;
        }
    }

    if (!player.operator) {
        addChat({
            text: 'Error: This command can only be used by operators',
            color: "red"
        });
    } else if (!exists) {
        addChat({
            text: 'Error: No player found with name "' + target + '" to kick',
            color: "red"
        });
    } else {
        socket.emit('kickPlayer', {
            id: playerId,
            name: target,
            reason: reason,
        });
    }
}

// Kill a player
function killPlayer(msg) {
    msg.shift();
    let target = msg[0];
    let playerId = null;

    let exists = false;
    if (target == player.name) {
        exists = true;
        playerId = socket.id;
    }
    for (let id in players) {
        let p = players[id];
        if (p.name == target) {
            exists = true; 
            playerId = id;
            break;
        }
    }

    if (!player.operator) {
        addChat({
            text: 'Error: This command can only be used by operators',
            color: "red"
        });
    } else if (!exists) {
        addChat({
            text: 'Error: No player found with name "' + target + '" to kill',
            color: "red"
        });
    } else {
        socket.emit('killPlayer', {
            id: playerId,
            name: target
        });
    }
}