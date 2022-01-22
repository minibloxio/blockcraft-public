import { Howl, Howler } from "howler";
import { sample } from "lodash";
import spriteData from "../../assets/audio/sprite.json";
import soundData from "../../assets/audio/sounds.json";

// TODO: remove this, add volume slider
Howler.volume(0.3);

class AudioManager {
  sprite: Howl;

  constructor() {
    this.loadSounds();
  }

  loadSounds() {
    this.sprite = new Howl({
      src: ["assets/audio/sprite.webm", "assets/audio/sprite.mp3"],
      sprite: spriteData.sprite as any,
    });
  }

  play(name: string) {
    if (!(name in soundData)) {
      console.log(`Unknown sound: ${name}`);
      return;
    }

    // dig and step sounds have same names and need to be differentiated
    const prefix = name.split(".")[0] === "dig" ? "dig_" : "";

    const options = soundData[name]["sounds"];
    const soundName = prefix + sample<string>(options).split("/").pop();
    this.sprite.play(soundName);
  }
}

const audioManager = new AudioManager();
export default audioManager;
