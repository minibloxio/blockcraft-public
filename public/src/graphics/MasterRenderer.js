import gameRenderer from "./GameRenderer"
// import armItemRenderer from "./ArmItemRenderer"

class MasterRenderer {

    init() {
        this.canvas = document.createElement("canvas")
        gameRenderer.init(this.canvas)
    }

    render(scene, camera) {
        gameRenderer.render(scene, camera)
    }

    resize() {
        gameRenderer.resize()
    }
}

const masterRenderer = new MasterRenderer();
export default masterRenderer;
