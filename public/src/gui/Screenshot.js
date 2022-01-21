import masterRenderer from "../graphics/MasterRenderer";
import html2canvas from "html2canvas";

class Screenshot {
  constructor() {}

  saveFile(strData, filename) {
    let link = document.createElement("a");
    if (typeof link.download === "string") {
      document.body.appendChild(link); //Firefox requires the link to be in the body
      link.download = filename;
      link.href = strData;
      link.click();
      document.body.removeChild(link); //remove the link when done
    } else {
      location.replace(uri);
    }
  }

  takeScreenshot(onlyRenderer) {
    let self = this;
    setTimeout(function () {
      let strDownloadMime = "image/octet-stream";
      let strMime = "image/jpeg";

      // Screenshot the entire screen
      if (!onlyRenderer) {
        html2canvas(document.body).then(function (canvas) {
          let ssData = canvas.toDataURL(strMime);
          ssData = ssData.replace(strMime, strDownloadMime);

          self.saveFile(ssData, "screenshot.png");

          $("#video-settings").append(canvas);
        });

        return;
      }

      // Screenshot the renderer
      const renderer = masterRenderer.renderer;
      try {
        let rendererData = renderer.domElement.toDataURL(strMime);
        rendererData = rendererData.replace(strMime, strDownloadMime);
        if (onlyRenderer) {
          self.saveFile(rendererData, "screenshot.jpg");
          return;
        }
      } catch (e) {
        console.log(e);
        return;
      }
    }, 100);
  }
}

const screenshotter = new Screenshot();
globalThis.screenshotter = screenshotter;
export default screenshotter;
