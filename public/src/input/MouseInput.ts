import Ola from "ola";
import * as $ from "jquery";
import { keyPressed } from "kontra";
import player from "../entity/player/Player";
import game from "../Game";
import inventory from "../items/Inventory";
import { clamp } from "../lib/helper";
import { camera, g } from "../globals";

// Scrolling
let scrollProgress = 0;
let lastDirection = 0;
$(document).bind("wheel", function (e) {
  if (!g.initialized) return;

  let scrollDelta = e.originalEvent.wheelDelta / 120;
  if (Math.sign(scrollDelta) != lastDirection) {
    scrollProgress = 0;
  }
  scrollProgress += scrollDelta;
  lastDirection = Math.sign(scrollDelta);

  let scroll = 0;
  let scrollSensitivity = 8 / parseInt(game.scrollSens);
  if (scrollProgress > scrollSensitivity) {
    scroll = 1;
    scrollProgress = 0;
  } else if (scrollProgress < -scrollSensitivity) {
    scroll = -1;
    scrollProgress = 0;
  }

  if (inventory.showInventory && player.mode == "creative") {
    if (scroll > 0) {
      inventory.scroll(1);
    } else if (scroll < 0) {
      inventory.scroll(-1);
    }

    return;
  }

  if (!player.controls.enabled || player.mode == "spectator" || player.mode == "camera") return;

  let scrollDirection = game.invertMouse ? 1 : -1;
  let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari && keyPressed("shift")) {
    scrollDirection *= -1;
  }

  // Zoom with X
  if (g.enableZoom) {
    if (scroll * scrollDirection < 0) {
      g.zoomLevel = clamp(g.zoomLevel + 0.2, 0.1, 10);
    } else if (scroll * scrollDirection > 0) {
      g.zoomLevel = clamp(g.zoomLevel - 0.2, 0.1, 10);
    }
    camera.zoom = g.zoomLevel;

    return;
  }

  // Scroll in toolbar
  if (scroll * scrollDirection > 0) {
    player.currSlot += 1;
    if (player.currSlot > 8) player.currSlot = 0;
  } else if (scroll * scrollDirection < 0) {
    player.currSlot -= 1;
    if (player.currSlot < 0) player.currSlot = 8;
  }
});

const mouse = Ola({ x: 0, y: 0 }, 10); // Mouse
$("body").on("mousemove", function (e) {
  mouse.x = e.pageX;
  mouse.y = e.pageY;
});

export { mouse };

// Key event handling
$("html").on("mousedown", function (event) {
  if (!g.initialized) return;
  if (!player.controls.enabled || inventory.showInventory) return;
  switch (event.which) {
    case 1: // Left click
      player.punch();
      break;
    case 2: // Middle click
      event.preventDefault();
      player.getBlock();
      break;
    case 3: // Right click
      player.place = true;
      player.key.rightClick = Date.now();
      if (!player.key.lastRightClick) player.key.lastRightClick = Date.now();
      break;
    default:
    //alert('You have a strange Mouse!');
  }
});
$("html").on("mouseup", function (event) {
  if (!g.initialized) return;
  switch (event.which) {
    case 1:
      player.click = false;
      player.key.leftClick = 0;
      break;
    case 2:
      break;
    case 3:
      player.place = false;
      player.key.rightClick = 0;
      player.key.lastRightClick = 0;
      break;
    default:
    //alert('You have a strange Mouse!');
  }
});

$("body")
  .on("mousedown", function (e) {
    if (!g.initialized || !inventory.showInventory) return;
    switch (e.which) {
      case 1:
        inventory.selectInventory("left", true);
        g.mouseLeft = true;
        break;
      case 2:
        inventory.selectInventory("middle", true);
        g.mouseMiddle = true;
        break;
      case 3:
        inventory.selectInventory("right", true);
        g.mouseRight = true;
        break;
      default:
      //alert('You have a strange Mouse!');
    }
  })
  .on("mouseup", function (e) {
    if (!g.initialized || !inventory.showInventory) return;
    switch (e.which) {
      case 1:
        g.mouseLeft = false;
        inventory.unselect();
        break;
      case 2:
        g.mouseMiddle = false;
        break;
      case 3:
        g.mouseRight = false;
        inventory.unselect();
        break;
      default:
      //alert('You have a strange Mouse!');
    }
  });

$("body").on("dblclick", function () {
  if (!g.initialized) return;
  inventory.selectInventory("double");
});
