import { GlobalManager } from "./globalmanager";

import fireSoundUrl from "../assets/sounds/Arkanoid SFX (3).wav";

let SoundsFX = Object.freeze({
    FIRE: 7,
  })
  

  

export const Musics = Object.freeze({
    START_MUSIC: 0,
    MENU_MUSIC: 10,
    LEVEL1_MUSIC: 20,
});

class SoundManager {
  static name = "SoundManager";
    
  #soundsFX = [];
  #musics = [];

  static get instance() {
    return (globalThis[Symbol.for(`PF_${SoundManager.name}`)] ||= new this());
}

  constructor() {

  }

  init() {
    await this.loadAssets();
  }

  update() {
    //Gestion des actions (keydown / keyup -> Action)
  }


  
  playSound(soundIndex) {
    if (soundIndex > 0 && soundIndex < this.#soundsFX.length)
        this.#soundsFX[soundIndex].play();
  }

  playMusic(musicIndex) {

  }
  loadAssets() {
    return new Promise((resolve) => {



        // Asset manager for loading texture and particle system
        let assetsManager = new AssetsManager(GlobalManager.scene);
        const fireSoundData = assetsManager.addBinaryFileTask("fireSound", fireSoundUrl);

        // load all tasks
        assetsManager.load();

        // after all tasks done, set up particle system
        assetsManager.onFinish = (tasks) => {
            console.log("tasks successful", tasks);

            // prepare to parse particle system files

            this.#soundsFX[SoundsFX.FIRE] = new Sound("fireSound", fireSoundData.data, GlobalManager.scene);



            resolve(true);
        }

    });


}
}

const {instance} = SoundManager;
export { instance as SoundManager };
