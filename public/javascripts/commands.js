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
    "ban": {
        "hint": "<player> [reason] - Bans the specified player (requires operator status)",
        "error": "Invalid player"
    },
    "unban": {
        "hint": "<player> - Unbans the specified player (requires operator status)",
        "error": "Invalid player"
    },
    "spawnpoint": {
        "hint": "- Sets your spawnpoint to your current position",
    },
    "sethome": {
        "hint": "- Sets your home to your current position",
    },
    "home": {
        "hint": "- Teleports you to your home", 
    },
    "msg": {
        "hint": "<player> <message> - Sends a private message to the specified player",
        "error": "Invalid player"
    },
    "whisper": {
        "hint": "<player> <message> - Sends a private message to the specified player",
        "error": "Invalid player"
    },
    "reply": {  
        "hint": "<message> - Replies to the last private message",
    },
    "list": {
        "hint": "- Lists all players on the server",
    },
    "damage": {
        "hint": "<amount> - Damages you by the specified amount",
    },
})
let commands = JSON.parse(commandsInit);
let prevCommands = [
    '/help',
    '/tutorial',
];
let commandIndex = -1;
let canChangeCommand = true;

// Previous command
function prevCommand() {
    canChangeCommand = false;
    if (prevCommands.length > 0) {
        if (commandIndex < prevCommands.length-1) {
            commandIndex += 1;
            let input = $("#chat-input");

            input.val(prevCommands[commandIndex]);
        }
    }
}

// Next command
function nextCommand() {
    canChangeCommand = false;
    if (prevCommands.length > 0) {
        commandIndex -= 1;
        if (commandIndex >= 0) {
            let input = $("#chat-input");

            input.val(prevCommands[commandIndex]);
        } else {
            $("#chat-input").val("");
            commandIndex = -1;
        }
    }
}     

// Update hints
function updateHints() {
    commands.tp.hints = {};
    commands.op.hints = {};
    commands.deop.hints = {};
    commands.ban.hints = {};
    commands.unban.hints = {};
    commands.kick.hints = {};
    commands.kill.hints = {};
    commands.setblock.hints = {};
    commands.give.hints = {};
    commands.msg.hints = {};
    commands.whisper.hints = {};

    for (let id in players) {
        commands.tp.hints[players[id].name] = "Teleport to " + players[id].name; // Update tp hint
        commands.op.hints[players[id].name] = "Make " + players[id].name + " an operator"; // Update op hint
        commands.deop.hints[players[id].name] = "Remove " + players[id].name + "'s operator status"; // Update deop hint
        commands.ban.hints[players[id].name] = "Ban " + players[id].name + " from the server"; // Update kick hint
        commands.unban.hints[players[id].name] = "Unban " + players[id].name + " from the server"; // Update unban hint
        commands.kick.hints[players[id].name] = "Kick " + players[id].name + " from the server"; // Update kick hint
        commands.kill.hints[players[id].name] = "Kill " + players[id].name; // Update kill hint
        commands.msg.hints[players[id].name] = "Send a private message to " + players[id].name; // Update msg hint
        commands.whisper.hints[players[id].name] = "Send a private message to " + players[id].name; // Update whisper hint
    }
    commands.op.hints[player.name] = "Make yourself an operator"; // Update op hint
    commands.deop.hints[player.name] = "Remove your operator status"; // Update deop hint
    commands.ban.hints[player.name] = "Ban yourself" // Update ban hint
    commands.unban.hints[player.name] = "Unban yourself" // Update unban hint
    commands.kill.hints[player.name] = "Kill yourself" // Update kill hint
    commands.kill.hints['@e'] =  "Kill all server entities";
    commands.kill.hints['@a'] =  "Kill all players";

    for (let id in world.blockId) {
        commands.setblock.hints[id] = "Set block to " + id; // Update setblock hint
        commands.give.hints[id] = "Give 1 " + id + " to yourself"; // Update give hint
    }
    for (let id in world.itemId) {
        commands.give.hints[id] = "Give 1 " + id + " to yourself"; // Update give hint
    }
    commands.help.hints = commands; // Update help hint
}

// Give command hints
function giveCommandHint(msg, autocomplete) {
    // Initialize variables
    commands = JSON.parse(commandsInit);
    chat.hintText = "/";
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
                chat.hintText += ", " + command;
                firstArgValue = "";
            } else {
                chat.hintText += command;
                firstArgUnique = command;
                firstArgValue = command;
            }
            
            if (autocomplete) { // Autocomplete the command
                let extraSpace = Object.keys(commands[command]).length > 1 ? " " : "";
                let completedCommand = chat.hintText + extraSpace;
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
                    let completedCommand = chat.hintText + command + extraSpace;
                    $("#chat-input").val(completedCommand);
                    giveCommandHint(completedCommand.slice(1).split(" "), false);
                    return;
                }

                chat.hintText += command + " " + commands[command].hint;
            }
        }

        // If the command exists and the command has a second argument
        if (command == msg[0] && msg.length >= 2 && commands[command].hints) { 
            firstArgUnique = command;
            chat.hintText += msg[0] + " ";

            // Special case for /setblock
            if (msg[0] == "setblock") {
                msg.shift();
                if (msg.length < 4) {
                    chat.hintText += msg.join(" ").removeExtraSpaces() + " ";

                    if (autocomplete && msg.length <= 3) {
                        if ((msg[2] == undefined || msg[2].length == 0)) chat.hintText += '~';
                        let completedCommand = (chat.hintText + " ").removeExtraSpaces();
                        $("#chat-input").val(completedCommand);
                        giveCommandHint(completedCommand.slice(1).split(" "), false);
                        return;
                    }

                    if (msg.length <= 3 && (msg[2] == undefined || !msg[2].length)) chat.hintText += "~";

                    chat.hintText += " - Set block at " + getCoord(msg);
                    chat.hintText = chat.hintText.removeExtraSpaces();
                    return;
                } else if (msg.length == 4) {
                    chat.hintText += msg.slice(0, 3).join(" ") + " ";
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
                        chat.hintText += ", " + hint;
                        secondHintValue = "";
                    } else {
                        chat.hintText += hint;
                        secondHint = hint;
                        secondHintValue = hint;
                    }

                    if (autocomplete) {
                        let completedCommand = chat.hintText;
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
                        chat.hintText += " " + msg[2] + " - Give " + num + " " + hint + " to yourself";
                        return;
                    } else if (msg[0] == "op") {
                        chat.hintText += " " + msg[2] + " - Enter the password to make " + hint + " an operator";
                        return;
                    } else if (msg[0] == "deop") {
                        chat.hintText += " " + msg[2] + " - Enter the password to remove " + hint + " as an operator";
                        return;
                    } else if (msg[0] == "kick") {
                        chat.hintText += " " + msg[2] + " - Enter the reason for kicking " + hint;
                        return;
                    } else if (msg[0] == "msg" || msg[0] == "whisper") {
                        chat.hintText += " " + msg.slice(2).join(" ") + " - Enter the message to send to " + hint;
                        return;
                    }
                }
            }

            // Special case for /tp
            if (msg[0] == "tp") {
                if ((Number.isInteger(parseInt(msg[1])) || msg[1].includes("~"))) {
                    msg.shift();
                    let origMsg = msg.join(" ");
                    let coord = getCoord(msg);
                    if (coord) {
                        if (msg.length == 3 && !validCoord(msg)) {
                            chat.hintText += origMsg + " - Invalid coordinates";
                            return;
                        } else {
                            chat.hintText += origMsg + " - Teleport to " + coord;
                            return;
                        }
                    }
                } else if (Object.keys(commands[command].hints) == 0) {
                    msg.shift();
                    chat.hintText += msg.join(" ") + " - No players online to teleport to";
                    return;
                }
            }

            // Check if the second argument is the only one available
            if (secondHintValue) {
                chat.hintText += " " + (commands[command].hints[secondHintValue].hint || ("- " + commands[command].hints[secondHintValue]));
                return;
            } else if (!secondHint) {
                msg.shift();
                chat.hintText += msg.join(" ") + " - " + commands[command].error;
                chat.hintText = "?" + chat.hintText;
            }

            break;
        }
    }

    msg = msg.join(" ").trim().split(" ");
    if ((chat.hintText == "/" && !firstArgUnique) || (msg.length > 1 && msg[0] != firstArgUnique && msg[1].length > 0 && !secondHint)) {
        chat.hintText += msg.join(" ") + " - No command found";
        chat.hintText = "?" + chat.hintText;
    }
    if (firstArgUnique && firstArgValue) {
        chat.hintText += " " + commands[firstArgValue].hint;
    }
}

function getCoord(msg, pos, decimalPlace) {
    let x, y, z;
    if (msg[0] && msg[0].includes('~')) {
        x = round(player.position.x/world.blockSize, decimalPlace)
        let dx = parseInt(msg[0].replace('~', ''));
        if (!isNaN(dx)) x += dx;
    } else if (msg[0]) {
        x = parseInt(msg[0]);
        x = x == 0 ? '0' : x;
    }
    if (msg[1] && msg[1].includes('~')) {
        y = round(player.position.y/world.blockSize, decimalPlace)
        let dy = parseInt(msg[1].replace('~', ''));
        if (!isNaN(dy)) y += dy;
    } else if (msg[1]) {
        y = parseInt(msg[1]);
        y = y == 0 ? '0' : y;   
    }
    if (msg[2] && msg[2].includes('~')) {
        z = round(player.position.z/world.blockSize, decimalPlace)
        let dz = parseInt(msg[2].replace('~', ''));
        if (!isNaN(dz)) z += dz;
    } else if (msg[2]) {
        z = parseInt(msg[2]);
        z = z == 0 ? '0' : z;
    }
    if (pos) {
        return {x: x, y: y, z: z};
    } else {
        return "x: " + (x || "<int>") + " y: " + (y || "<int>") + " z: " + (z || "<int>");
    }
}

function validCoord(msg, verify) {
    if (msg.length != 3) return false;
    if (!verify && (msg[0].length == 0 || msg[1].length == 0 || msg[2].length == 0)) return true;
    let pos = getCoord(msg, true);
    return (pos.x || pos.x == 0) && (pos.y || pos.y == 0) && (pos.z || pos.z == 0);
}

// Check command validity
function checkCommand(msg) {
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
    } else if (msg[0] == "ban") {
        banPlayer(msg);
    } else if (msg[0] == "unban" || msg[0] == "pardon") {
        unbanPlayer(msg);
    } else if (msg[0] == "kick") {
        kickPlayer(msg);
    } else if (msg[0] == "kill") {
        killPlayer(msg);
    } else if (msg[0] == "spawnpoint") {
        setSpawn();
    } else if (msg[0] == "sethome") {
        setHome();
    } else if (msg[0] == "home") {
        goHome();
    } else if (msg[0] == "msg" || msg[0] == "whisper") {
        messagePlayer(msg);
    } else if (msg[0] == "reply" || msg[0] == "r") {
        replyPlayer(msg);
    } else if (msg[0] == "list") {
        listPlayers();
    } else if (msg[0] == "damage") {
        damagePlayer(msg);
    } else if (msg[0] == "list") {
        listPlayers();
    } else {
        chat.addChat({
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
        chat.addChat({
            text: 'COMMANDS: ' + helpText.slice(0, -2),
        })
        chat.addChat({
            text: 'Type /help <command> for more info on a command'
        })
    } else {
        let command = msg[1];
        if (commands[command]) {
            chat.addChat({
                text: 'Usage: /' + command + ' ' + commands[command].hint
            })
        } else {
            chat.addChat({
                text: 'Error: Unable to recognize command "' + command + '"'
            })
        }
    }
}

// Display tutorial
function displayTutorial() {
    chat.addChat({
        text: "------------------"
    })
    chat.addChat({
        text: "TUTORIAL"
    })
    chat.addChat({
        text: "Use WASD to move around, SPACEBAR to jump, SHIFT to sprint, and ALT to crouch"
    })
    chat.addChat({
        text: "Use the mouse to look around, LEFT CLICK to mine and attack, RIGHT CLICK to place blocks"
    })
    chat.addChat({
        text: "Press E to open your inventory and crafting menu"
    })
    chat.addChat({
        text: "Press R to reset your position to your spawn point"
    })
    chat.addChat({
        text: "Press F to fly in creative mode"
    })
    chat.addChat({
        text: "------------------"
    })
}

// Update the gamemode of the player
function updateGamemode(mode) {
    let prevGamemode = player.mode;
    if (["survival", "s"].indexOf(mode) > -1) {
        chat.addChat({
            text: "Gamemode changed to survival mode"
        });
        player.mode = "survival";
    } else if (["creative", "c"].indexOf(mode) > -1) {
        chat.addChat({
            text: "Gamemode changed to creative mode"
        });
        player.mode = "creative";
    } else if (["spectator", "sp"].indexOf(mode) > -1) {
        chat.addChat({
            text: "Gamemode changed to spectator mode"
        });
        player.mode = "spectator";
    } else if (["camera", "ca"].indexOf(mode) > -1) {
        chat.addChat({
            text: "Gamemode changed to camera mode"
        });
        player.mode = "camera";
    } else {
        chat.addChat({
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
    let timeInt = parseInt(time);
    if (typeof(timeInt) == "number" && (timeInt || timeInt == 0)) {
        socket.emit('settime', timeInt)
        chat.addChat({
            text: "Time set to " + timeInt
        })
    } else {
        chat.addChat({
            text: "Error: Invalid time",
            color: "red"
        })
    }
}

// Teleport the player to the specified coordinates or player
function teleport(msg) {
    msg.shift();
    if (Number.isInteger(parseInt(msg[0])) || msg[0] == "~") {
        let validCoordinates = validCoord(msg, true);
        let pos = getCoord(msg, true, 3);

        if (validCoordinates) {
            let coord = new THREE.Vector3(pos.x*world.blockSize, pos.y*world.blockSize, pos.z*world.blockSize);
            player.setCoords(coord);
            chat.addChat({
                text: "Teleported to x: " + round(pos.x, 1) + ", y: " + round(pos.y, 1) + ", z: " + round(pos.z, 1)
            })
        } else {
            chat.addChat({
                text: 'Error: Invalid coordinate (format: /tp <int> <int> <int>)',
                color: "red"
            });
        }
    } else {
        let target = msg.join(" ");

        let exists = false;
        for (let id in players) {
            let p = players[id];
            if (p.name == target) {
                exists = true; 
                chat.addChat({
                    text: "Teleported " + player.name + " to " + p.name
                });
                player.setCoords(p.pos);

                break;
            }
        }
        if (!exists) {
            chat.addChat({
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
        chat.addChat({
            text: "God mode enabled"
        });
        player.updateGamemode(true);
    } else if (player.god) {
        player.god = false;
        chat.addChat({
            text: "God mode disabled"
        });
        player.updateGamemode(true);
    }
}

// Display world seed
function displaySeed() {
    chat.addChat({
        text: "World seed: " + world.seed
    });
}

// Set a block
function setBlock(msg) {
    msg.shift();
    let validCoordinates = validCoord(msg.slice(0, 3), true);
    let pos = getCoord(msg, true, 2);
    // Floor the coordinates towards 0
    pos.x = Math.floor(pos.x);
    pos.y = Math.floor(pos.y);
    pos.z = Math.floor(pos.z);
    console.log("Attempting to set block at " + pos.x + " " + pos.y + " " + pos.z);

    if (validCoordinates) {
        if (!msg[3]) {
            chat.addChat({
                text: 'Error: No block specified',
                color: "red"
            });
            return;
        }

        let coord = new THREE.Vector3(pos.x, pos.y, pos.z);
        socket.emit('setBlock', {
            x: coord.x,
            y: coord.y,
            z: coord.z,
            t: world.blockId[msg[3]],
            cmd: true,
        });
        chat.addChat({
            text: "Set block at " + coord.x + " " + coord.y + " " + coord.z + " to " + msg[3]
        })
    } else {
        chat.addChat({
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

    let entity = world.blockId[item] || world.itemId[item];
    if (Number.isInteger(parseInt(amount)) && entity) {
        amount = clamp(parseInt(amount), 1, 64);
        socket.emit('giveItem', {
            v: entity,
            amount: amount,
            class: world.blockId[item] ? "block" : "item",
        })
        chat.addChat({
            text: "Gave " + amount + " " + item + " to " + player.name
        })
    } else {
        chat.addChat({
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
            chat.addChat({
                text: "Cleared " + item.c + " " + thing + " from hand"
            });
        } else {
            chat.addChat({
                text: "No item in hand to clear",
                color: "red"
            });
        }
    } else if (type == "inventory") { // Clear the inventory
        socket.emit('clearInventory');
        chat.addChat({
            text: "Cleared inventory"
        });
    } else if (type == "chat") { // Clear the chat
        chat.length = 0;
        chat.addChat({
            text: "Cleared chat"
        });
    } else { // Invalid type
        chat.addChat({
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
        chat.addChat({
            text: 'Error: No player found with name "' + target + '" to set operator status for',
            color: "red"
        });
    } else if (password == undefined || password.length == 0) {
        chat.addChat({
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

// Ban a player
function banPlayer(msg) {
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
        chat.addChat({
            text: 'Error: This command can only be used by operators',
            color: "red"
        });
    } else if (!exists) {
        chat.addChat({
            text: 'Error: No player found with name "' + target + '" to ban',
            color: "red"
        });
    } else {
        socket.emit('banPlayer', {
            id: playerId,
            name: target,
            reason: reason,
            isBanned: true
        });
    }
}

// Unban a player
function unbanPlayer(msg) {
    msg.shift();
    let target = msg[0];

    if (!player.operator) {
        chat.addChat({
            text: 'Error: This command can only be used by operators',
            color: "red"
        });
    } else {
        socket.emit('banPlayer', {
            name: target,
            isBanned: false,
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
        chat.addChat({
            text: 'Error: This command can only be used by operators',
            color: "red"
        });
    } else if (!exists) {
        chat.addChat({
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

    if (!player.operator) {
        chat.addChat({
            text: 'Error: This command can only be used by operators',
            color: "red"
        });
        return;
    }

    if (target == "@e") {
        socket.emit('killEntities');
        return;
    } else if (target == "@a") {
        socket.emit('killPlayers');
        return;
    }

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
        chat.addChat({
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

// Set spawnpoint
function setSpawn() {
    player.spawnpoint = player.position.clone();
    chat.addChat({
        text: "Set spawnpoint to x: " + round(player.spawnpoint.x) + " y: " + round(player.spawnpoint.y) + " z: " + round(player.spawnpoint.z)
    })
}

// Set home
function setHome() {
    player.home = player.position.clone();
    chat.addChat({
        text: "Set home to x: " + round(player.home.x) + " y: " + round(player.home.y) + " z: " + round(player.home.z)
    })
}

// Go to home
function goHome() {
    if (player.home) {
        player.setCoords(player.home);
    } else {
        chat.addChat({
            text: "Error: No home set",
            color: "red"
        });
    }
}

// Message a player
function messagePlayer(msg) {   
    msg.shift();
    let target = msg[0];
    msg.shift();

    let message = msg.join(" ");
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
        chat.addChat({
            text: 'Error: No player found with name "' + target + '" to message',
            color: "red"
        });
    } else if (message.length == 0) {
        chat.addChat({
            text: 'Error: No message specified',
            color: "red"
        });
    } else {
        chat.addChat({
            name: 'You whisper to ' + target,
            text: message,
            color: "grey",
        })
        socket.emit('messagePlayer', {
            id: playerId,
            text: message
        });
    }
}

// Reply to a player
function replyPlayer(msg) {
    msg.shift();

    let message = msg.join(" ");
    let target = players[player.lastWhisper].name;

    if (!player.lastWhisper) {
        chat.addChat({
            text: 'Error: No player found with name "' + target + '" to reply to',
            color: "red"
        });
    } else if (message.length == 0) {
        chat.addChat({
            text: 'Error: No message specified',
            color: "red"
        });
    } else {
        chat.addChat({
            name: 'You reply to ' + target,
            text: message,
            color: "grey",
        })
        socket.emit('replyPlayer', {
            id: player.lastWhisper,
            text: message
        });
    }
}

// List players
function listPlayers() {
    let playersOnline = Object.keys(players).length + 1;
    chat.addChat({
        text: "Players online (" + playersOnline + "):",
    })
    for (let id in players) {
        let p = players[id];
        let ping = round(p.ping.reduce((a, b) => a + b, 0)/p.ping.length, 0) || "disc";
        chat.addChat({
            text: p.name + " (" + ping + "ms ping, " + p.fps + " fps)",
        })
    }
    let ping = round(player.ping.reduce((a, b) => a + b, 0)/player.ping.length, 0) || "disc";
    chat.addChat({
        text: player.name + " (" + ping + "ms ping, " + player.fps + " fps)",
    })
}

function damagePlayer(msg) {
    msg.shift();
    let damage = parseFloat(msg[0]);
    if (isNaN(damage)) {
        chat.addChat({
            text: 'Error: Invalid damage value',
            color: "red"
        });
        return;
    }
    socket.emit('takeDamage', {
        dmg: damage,
        type: "command",
    });
}