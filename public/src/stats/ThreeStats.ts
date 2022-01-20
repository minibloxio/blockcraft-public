/**
 * @author mrdoob / http://mrdoob.com/
 * @author qhyun2
 *
 */

class ThreeStats {
  dom = document.createElement("div");
  frames = 0;
  fps = 0;
  beginTime = (performance || Date).now();
  prevTime = this.beginTime;
  fpsPanel = makePanel("FPS", "#0ff", "#002");
  memPanel?: Panel;
  msPanel = makePanel("MS", "#0f0", "#020");
  _shown = false;

  public set showStats(v: boolean) {
    this._shown = v;
    this.dom.style.display = v ? "block" : "none";
  }

  public get showStats() {
    return this._shown;
  }

  constructor() {
    this.dom.style.cssText = "position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000;display:flex";

    this.dom.appendChild(this.fpsPanel.dom);
    // @ts-ignore
    if (performance && performance.memory) {
      this.memPanel = makePanel("MB", "#f08", "#201");
      this.dom.appendChild(this.memPanel.dom);
    }
    this.dom.appendChild(this.msPanel.dom);
    document.body.appendChild(this.dom);
    this.showStats = false;
  }

  begin() {
    this.beginTime = (performance || Date).now();
  }

  end() {
    const time = (performance || Date).now();
    this.frames++;
    if (this.showStats) this.msPanel.update(time - this.beginTime, 4000 / g.refreshRate);
    if (time >= this.prevTime + 250) {
      if (this.showStats) this.fpsPanel.update((this.frames * 1000) / (time - this.prevTime), g.refreshRate * 1.2);
      this.fps = (this.frames * 1000) / (time - this.prevTime);
      this.prevTime = time;
      this.frames = 0;
      if (this.memPanel) {
        // @ts-ignore
        let memory = performance.memory;
        if (this.showStats) this.memPanel.update(memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576);
      }
    }
    return time;
  }

  update() {
    this.beginTime = this.end();
  }
}

interface Panel {
  dom: HTMLElement;
  update: (value: number, maxValue: number) => void;
}

function makePanel(name: string, fg: string, bg: string): Panel {
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
    update: (value: number, maxValue: number) => {
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
}

const stats = new ThreeStats();
export default stats;
