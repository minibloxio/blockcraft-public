/**
 * @author mrdoob / http://mrdoob.com/
 */

let Stats = function () {
  let container = document.createElement("div");
  container.style.cssText = "position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000;display:flex";

  function addPanel(panel) {
    container.appendChild(panel.dom);
    return panel;
  }

  let beginTime = (performance || Date).now(),
    prevTime = beginTime,
    frames = 0;
  let fpsPanel = addPanel(new Stats.Panel("FPS", "#0ff", "#002"));
  if (performance && performance.memory) var memPanel = addPanel(new Stats.Panel("MB", "#f08", "#201"));
  let msPanel = addPanel(new Stats.Panel("MS", "#0f0", "#020"));

  return {
    dom: container,
    addPanel: addPanel,
    begin: function () {
      beginTime = (performance || Date).now();
    },
    end: function () {
      frames++;
      let time = (performance || Date).now();
      msPanel.update(time - beginTime, 4000 / g.refreshRate);
      if (time >= prevTime + 250) {
        fpsPanel.update((frames * 1000) / (time - prevTime), g.refreshRate * 1.2);
        stats.fps = (frames * 1000) / (time - prevTime);
        prevTime = time;
        frames = 0;
        if (memPanel) {
          let memory = performance.memory;
          memPanel.update(memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576);
        }
      }
      return time;
    },
    update: function () {
      beginTime = this.end();
    },
  };
};

Stats.Panel = function (name, fg, bg) {
  let min = Infinity;
  let max = 0;
  let round = Math.round;

  const WIDTH = 162;
  const HEIGHT = 100;
  const TEXT_X = 3;
  const TEXT_Y = 2;
  const GRAPH_X = 3;
  const GRAPH_Y = 15;
  const GRAPH_WIDTH = 158;
  const GRAPH_HEIGHT = 94;

  let canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.style.cssText = `width:${WIDTH}px;height:${HEIGHT}px`;

  let context = canvas.getContext("2d");
  context.font = "bold 13px Helvetica,Arial,sans-serif";
  context.textBaseline = "top";

  context.fillStyle = bg;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = fg;
  context.fillText(name, TEXT_X, TEXT_Y);
  context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

  context.fillStyle = bg;
  context.globalAlpha = 0.9;
  context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

  return {
    dom: canvas,
    update: function (value, maxValue) {
      min = Math.min(min, value);
      max = Math.max(max, value);

      context.fillStyle = bg;
      context.globalAlpha = 1;
      context.fillRect(0, 0, WIDTH, GRAPH_Y);
      context.fillStyle = fg;
      context.fillText(`${round(value)} ${name} (${round(min)}-${round(max)})`, TEXT_X, TEXT_Y);
      context.drawImage(canvas, GRAPH_X + 1, GRAPH_Y, GRAPH_WIDTH - 1, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - 1, GRAPH_HEIGHT);
      context.fillRect(GRAPH_X + GRAPH_WIDTH - 1, GRAPH_Y, 1, GRAPH_HEIGHT);

      context.fillStyle = bg;
      context.globalAlpha = 0.9;
      context.fillRect(GRAPH_X + GRAPH_WIDTH - 1, GRAPH_Y, 1, round((1 - value / maxValue) * GRAPH_HEIGHT));
    },
  };
};

const stats = new Stats();
document.body.appendChild(stats.dom);
export default stats;
