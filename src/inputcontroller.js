import { GamepadManager, KeyboardEventTypes } from "@babylonjs/core";
import { GlobalManager } from "./globalmanager";

class InputController {
  static name = "InputController";
    
  #gamepadManager;

  inputMap = {};
  actions = {};

  static get instance() {
    return (globalThis[Symbol.for(`PF_${InputController.name}`)] ||= new this());
}

  constructor() {

  }

  init() {
    this.#gamepadManager = new GamepadManager();

    GlobalManager.scene.onKeyboardObservable.add((kbInfo) => {
      switch (kbInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
          this.inputMap[kbInfo.event.code] = true;
          //console.log(`KEY DOWN: ${kbInfo.event.code} / ${kbInfo.event.key}`);
          break;
        case KeyboardEventTypes.KEYUP:
          this.inputMap[kbInfo.event.code] = false;
          this.actions[kbInfo.event.code] = true;
          //console.log(`KEY UP: ${kbInfo.event.code} / ${kbInfo.event.key}`);
          break;
      }
    });

    this.#gamepadManager.onGamepadConnectedObservable.add((gamepad, state) => {
      console.log("Connected: " + gamepad.id);

      gamepad.onButtonDownObservable.add((button, state) => {
        //Button has been pressed
        console.log(button + " pressed");
      });
      gamepad.onButtonUpObservable.add((button, state) => {
        console.log(button + " released");
      });
      gamepad.onleftstickchanged((values) => {
        //Left stick has been moved
        console.log("x:" + values.x.toFixed(3) + " y:" + values.y.toFixed(3));
      });

      gamepad.onrightstickchanged((values) => {
        console.log("x:" + values.x.toFixed(3) + " y:" + values.y.toFixed(3));
      });
    });

    this.#gamepadManager.onGamepadDisconnectedObservable.add((gamepad, state) => {
      console.log("Disconnected: " + gamepad.id);
    });

  }

  update() {
    //Gestion des actions (keydown / keyup -> Action)
  }



  endupdate() {
    this.actions = {};

  }
}

const {instance} = InputController;
export { instance as InputController };
