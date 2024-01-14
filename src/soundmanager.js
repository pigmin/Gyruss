import { GlobalManager } from "./globalmanager";

import music0Url from "../assets/musics/Sky - Toccata (Video).mp3";

import fireSoundUrl from "../assets/sounds/Arkanoid SFX (3).wav";
import { AssetsManager, Sound } from "@babylonjs/core";


class SoundManager {
  static name = "SoundManager";

  
    SoundsFX = Object.freeze({
        FIRE: 7,
    })
    

    

    Musics = Object.freeze({
        START_MUSIC: 0,
        MENU_MUSIC: 10,
        LEVEL1_MUSIC: 20,
    });

  #soundsFX = [];
  #musics = [];

  static get instance() {
    return (globalThis[Symbol.for(`PF_${SoundManager.name}`)] ||= new this());
}

  constructor() {

  }

  async init() {
    await this.loadAssets();
  }

  update() {
    //Gestion des actions (keydown / keyup -> Action)
  }


  
  playSound(soundIndex) {
    if (soundIndex >= 0 && soundIndex < this.#soundsFX.length)
        this.#soundsFX[soundIndex].play();
  }

  playMusic(musicIndex) {
    if (musicIndex >= 0 && musicIndex < this.#musics.length)
        this.#musics[musicIndex].play();
  }

  loadAssets() {
    return new Promise((resolve) => {

        // Asset manager for loading texture and particle system
        let assetsManager = new AssetsManager(GlobalManager.scene);

        const music0Data = assetsManager.addBinaryFileTask("music0", music0Url);
        const fireSoundData = assetsManager.addBinaryFileTask("fireSound", fireSoundUrl);

        // load all tasks
        assetsManager.load();

        // after all tasks done, set up particle system
        assetsManager.onFinish = (tasks) => {
            console.log("tasks successful", tasks);

            this.#musics[this.Musics.START_MUSIC] = new Sound("music0", music0Data.data, GlobalManager.scene, undefined, { loop: true, autoplay: false, volume: 0.4 });

            this.#soundsFX[this.SoundsFX.FIRE] = new Sound("fireSound", fireSoundData.data, GlobalManager.scene);

            resolve(true);
        }

    });


}
}

const {instance} = SoundManager;
export { instance as SoundManager };
