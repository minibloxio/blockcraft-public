// Initiate canvas
let canvas = document.getElementById("canvas-hud");
let ctx = canvas.getContext("2d");

// Chat
let chat = new ChatManager();

// HUD
let hud = new HUD();

// Inventory
let inventory = new Inventory();

// Stats
function displayStats() {
    if (hud.showStats) {
        for (let i = 0; i < statistics.length; i++) {
            let stat = statistics[i];
            stat.display(i);
        }
    }
}

// Get player color
function getPlayerColor(player) {
    let mode = player.mode;
    if (mode == "creative") {
        return "aqua";
    } else if (mode == "survival") {
        return "white";
    } else if (mode == "spectator") {
        return "grey";
    } else if (mode == "camera") {
        return "grey";
    }
}

function updateHUD() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!initialized) return;
    ctx.imageSmoothingEnabled = false;
    hud.display();
    inventory.displayToolbar();
    chat.displayChat();
    displayStats();
    inventory.displayInventory();
}