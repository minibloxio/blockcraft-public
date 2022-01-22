import * as $ from "jquery";
import { initKeys } from "kontra";
import player from "../Player";

import "./KeyboardInput";
import "./MouseInput";

initKeys();
$(window).on("keydown", function (event) {
  if (!g.initialized) return;
  if (!player.controls.enabled) return;
  if (event.keyCode == 18) {
    // alt
    event.preventDefault();
  }
  if (event.altKey && event.keyCode == 68) {
    // alt + d
    event.preventDefault();
  }
  if (event.altKey && event.keyCode == 32) {
    // alt + space
    event.preventDefault();
  }
});

// Creative menu search
$(document).ready(function () {
  $("#search-input").on("input", function () {
    let search = $(this).val();
    inventory.updateItemSearch(search);
  });
});
