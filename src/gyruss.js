//Gyruss

import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder, Scalar, StandardMaterial, Color3, Color4, TransformNode, KeyboardEventTypes, DefaultRenderingPipeline, ArcRotateCamera, AssetsManager, ParticleSystem, ShadowGenerator, DirectionalLight, Sound, Animation, Engine, GamepadManager, VideoTexture, BoundingInfo, CubeTexture, SceneLoader, NodeMaterial, UniversalCamera, EasingFunction, SineEase, GlowLayer, AnimationGroup } from "@babylonjs/core";



import { Inspector } from '@babylonjs/inspector';
import { TrailMesh } from '@babylonjs/core/Meshes/trailMesh';

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version
import "@babylonjs/loaders/glTF";




import musicUrl1 from "../assets/musics/Sky - Toccata (Video).mp3";

import envfileUrl from "../assets/env/environment.env";
import starFieldGlb from "../assets/gltf/starsGeo.glb";
import starFieldPanoramaTextureUrl from "../assets/textures/starfield_panorama_texture.jpg";

import starFieldShaderUrl from "../assets/shaders/starfieldShader.json";
import { AdvancedDynamicTexture, Button, Control, TextBlock } from "@babylonjs/gui";


import * as constants from "./constants";
import { GlobalManager } from "./globalmanager";
import { InputController } from "./inputcontroller";
import {Valkyrie} from "./valkyrie";

//const StartButtonMeshTarget = "panel_plate.001_140";


let nbLives = constants.START_LIVES;
let currentScore = 0;
let currentHighScore = 0;
let currentLevel = 1;


let gameState;
function changeGameState(newState) {
  gameState = newState;
}

function getRandomInt(max) {
  return Math.round(Math.random() * max);
}



const States = Object.freeze({
  STATE_NONE: 0,
  STATE_INIT: 10,
  STATE_LOADING: 20,
  STATE_PRE_INTRO: 22,
  STATE_MENU: 25,
  STATE_START_INTRO: 28,
  STATE_INTRO: 30,
  STATE_START_GAME: 35,
  STATE_LAUNCH: 40,
  STATE_NEW_LEVEL: 45,
  STATE_LEVEL_WELDING: 50,
  STATE_LEVEL_READY: 55,
  STATE_RUNNING: 60,
  STATE_PAUSE: 70,
  STATE_LOOSE: 80,
  STATE_GAME_OVER: 90,
  STATE_END: 100,
});


class Gyruss {
  static name = "Gyruss";
  #canvas;
  #engine;

  #gameScene;
  #assetsManager;
  #glowLayer;

  #camera;
  #light;
  #musics = [];
  #bPause;

  #ground;

  inputController;
  #bInspector = false;

  #meshes = {};
  #meshesMats = {};
  #lights = {};
  #cameras = {};

  #glow = {};

  #keys = {};
  #anim = {};
  #clipLength = 60;


  #menuUiTexture;
  #gameUI;
  #creditsUI;

  #timeToLaunch = 0;
  #cameraStartPosition = new Vector3(-257, 566, -620);
  #cameraMenuPosition = new Vector3(-199, 88, -360);

  #cameraGamePosition = new Vector3(36.01, 127.25, -41.91);
  #cameraGameTarget = new Vector3(35, 15.71, -5.89);

  constructor(canvas, engine) {

    GlobalManager.setup(canvas, engine);

    this.#meshes.starField = null;

  }

  async start() {
    
    await this.init();
    //this.loadMenuGUI();
    this.loadGameUI();
//    this.starField();
    this.loop();
    this.end();
  }

  async init() {
    // Create our first scene.
    this.#gameScene = new Scene(GlobalManager.engine);
    GlobalManager.scene = this.#gameScene;
    GlobalManager.scene.clearColor = Color3.Black();

    this.#glowLayer = new GlowLayer("glowLayer", GlobalManager.scene,);
    GlobalManager.glowLayer = this.#glowLayer;
    GlobalManager.glowLayer.intensity = 1.2;


    let env = {};

    // standard ArcRotate camera
    this.#cameras.main = new UniversalCamera("camera", new Vector3(0.0, 0.5, -2), GlobalManager.scene);
    this.#cameras.main.minZ = 0.001;
    this.#cameras.main.maxZ = 20000;
    this.#cameras.main.wheelDeltaPercentage = 0.1;
    this.#cameras.main.setTarget(new Vector3(0, 0, 0));
    //this.#cameras.main.attachControl(GlobalManager.canvas, false);

    // This targets the camera to scene origin
    //this.gotoMenuCamera();
    // This attaches the camera to the canvas
    //this.#cameras.main.attachControl(GlobalManager.canvas, true);

    env.lighting = CubeTexture.CreateFromPrefilteredData(envfileUrl, GlobalManager.scene);
    env.lighting.gammaSpace = false;
    env.lighting.rotationY = 1.977;
    GlobalManager.scene.environmentTexture = env.lighting;
    GlobalManager.scene.environmentIntensity = 1;


    // directional light needed for shadows
    this.#lights.dirLight = new DirectionalLight("dirLight", new Vector3(0.47, -0.19, -0.86), GlobalManager.scene);
    this.#lights.dirLight.position = new Vector3(0, 0.05, 0);
    this.#lights.dirLight.diffuse = Color3.FromInts(255, 251, 199);
    this.#lights.dirLight.intensity = 3;
    this.#lights.dirLight.shadowMinZ = 3.5;
    this.#lights.dirLight.shadowMaxZ = 12;


    GlobalManager.shadowGenerator = new ShadowGenerator(512, this.#lights.dirLight);
    //GlobalManager.shadowGenerator.useExponentialShadowMap = true;
    //GlobalManager.shadowGenerator.usePercentageCloserFiltering = true;
    GlobalManager.shadowGenerator.setDarkness(0.4);

    
    await this.createMaterials();
    await this.loadMeshes();
    await this.loadAssets();

    GlobalManager.valkyrie = new Valkyrie(0, -0.25, 0.25);
    await GlobalManager.valkyrie.init();

    this.#musics[0] = new Sound("music0", musicUrl1, GlobalManager.scene, null, { loop: true, autoplay: true, volume: 0.4 });
    /*  this.#musics[1] = new Sound("music1", musicUrl2, GlobalManager.scene, null, { loop: true, autoplay: false });
      this.#musics[2] = new Sound("music2", musicUrl3, GlobalManager.scene, null, { loop: true, autoplay: false });
      this.#musics[3] = new Sound("music3", musicUrl4, GlobalManager.scene, null, { loop: true, autoplay: false });
      this.#musics[4] = new Sound("music4", musicUrl5, GlobalManager.scene, null, { loop: true, autoplay: false });
      this.#musics[5] = new Sound("music5", musicUrl6, GlobalManager.scene, null, { loop: true, autoplay: false });
      this.#musics[6] = new Sound("music6", musicUrl7, GlobalManager.scene, null, { loop: true, autoplay: false });
      this.#musics[7] = new Sound("music7", musicUrl8, GlobalManager.scene, null, { loop: true, autoplay: false });
      */



    //this.#meshes.valkyrie.position = new Vector3(0, -0.5, 0.0);

    changeGameState(States.STATE_PRE_INTRO);
    this.launchCreditsAnimation(() => {
      this.#creditsUI.rootContainer.isVisible = false;
    });
    //this.launchPreIntroAnimation(() => {
    changeGameState(States.STATE_MENU);
    //});


  }

  launchGameOverAnimation(callback) {

    const startFrame = 0;
    const endFrame = 300;
    const frameRate = 60;

    var animationcamera = new Animation(
      "GameOverAnimation",
      "position",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keys = [];
    keys.push({
      frame: startFrame,
      value: this.#cameras.main.position.clone(),
      outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame / 2,
      value: new Vector3(39, 177, -550),
    });
    keys.push({
      frame: endFrame,
      inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraMenuPosition,
    });
    animationcamera.setKeys(keys);

    //------------------TARGET
    var animationcameraTarget = new Animation(
      "GameOverAnimationTarget",
      "target",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keysTarget = [];
    keysTarget.push({
      frame: startFrame,
      value: this.#cameras.main.target.clone(),
      outTangent: new Vector3(1, 0, 0)
    });
    keysTarget.push({
      frame: endFrame,
      inTangent: new Vector3(-1, 0, 0),
      value: this.getTargetMenuPosition().clone(),
    });
    animationcameraTarget.setKeys(keysTarget);

    this.#cameras.main.animations = [];
    this.#cameras.main.animations.push(animationcamera);
    this.#cameras.main.animations.push(animationcameraTarget);

    GlobalManager.scene.beginAnimation(this.#cameras.main, startFrame, endFrame, false, 1, callback);
  }

  launchGameStartAnimation(callback) {

    const startFrame = 0;
    const endFrame = 300;
    const frameRate = 60;

    var animationcamera = new Animation(
      "GameStartAnimation",
      "position",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keys = [];
    keys.push({
      frame: startFrame,
      value: this.#cameras.main.position.clone(),
      outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame / 2,
      value: new Vector3(39, 177, -550),
    });
    keys.push({
      frame: endFrame,
      inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraGamePosition,
    });
    animationcamera.setKeys(keys);

    //------------------TARGET
    var animationcameraTarget = new Animation(
      "GameStartAnimationTarget",
      "target",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keysTarget = [];
    keysTarget.push({
      frame: startFrame,
      value: this.#cameras.main.target.clone(),
      outTangent: new Vector3(1, 0, 0)
    });
    keysTarget.push({
      frame: endFrame,
      inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraGameTarget,
    });

    animationcameraTarget.setKeys(keysTarget);



    this.#cameras.main.animations = [];
    this.#cameras.main.animations.push(animationcamera);
    this.#cameras.main.animations.push(animationcameraTarget);

    GlobalManager.scene.beginAnimation(this.#cameras.main, startFrame, endFrame, false, 1, callback);
  }

  launchPreIntroAnimation(callback) {

    const frameRate = 60;
    const startFrame = 0;
    const endFrame = 500;

    var animationcamera = new Animation(
      "PreIntroAnimation",
      "position",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    // console.log(animationcamera);
    var keys = [];
    keys.push({
      frame: startFrame,
      value: this.#cameraStartPosition,
      outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame / 3,
      value: new Vector3(39, 177, -550),
    });
    keys.push({
      frame: 2 * endFrame / 3,
      inTangent: new Vector3(-1, 0, 0),
      value: new Vector3(240, 107, -353),
    });
    keys.push({
      frame: endFrame,
      inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraMenuPosition,
    });
    animationcamera.setKeys(keys);

    //------------------TARGET
    var animationcameraTarget = new Animation(
      "PreIntroAnimationTarget",
      "target",
      frameRate,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    var keysTarget = [];
    keysTarget.push({
      frame: startFrame,
      value: this.#cameras.main.target.clone(),
      outTangent: new Vector3(1, 0, 0)
    });
    keysTarget.push({
      frame: endFrame,
      inTangent: new Vector3(-1, 0, 0),
      value: this.getTargetMenuPosition().clone(),
    });

    animationcameraTarget.setKeys(keysTarget);


    this.#cameras.main.animations = [];
    this.#cameras.main.animations.push(animationcamera);

    GlobalManager.scene.beginAnimation(this.#cameras.main, startFrame, endFrame, false, 1, callback);
  }


  launchCreditsAnimation(callback) {

    const frameRate = 60;
    const startFrame = 0;
    const endFrame = 500;

    this.#creditsUI = AdvancedDynamicTexture.CreateFullscreenUI("creditsUI");
    // Text label
    let modelCredits = new TextBlock("modelCredits");
    modelCredits.text = "...";
    modelCredits.fontSize = "16px";
    modelCredits.fontFamily = "Courier New";
    modelCredits.color = "#aaaaaa";
    modelCredits.height = "52px";
    modelCredits.top = "-200px";
    modelCredits.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    modelCredits.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.#creditsUI.addControl(modelCredits);

    // Text label
    let musicCredits = new TextBlock("musicCredits");
    musicCredits.text = 'Toccata · Sky ℗ 2014 Cherry Red Records';
    musicCredits.fontSize = "16px";
    musicCredits.fontFamily = "Courier New";
    musicCredits.color = "#bbbbbb";
    musicCredits.height = "52px";
    musicCredits.top = "-300px";
    musicCredits.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    musicCredits.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.#creditsUI.addControl(musicCredits);


    // Text label
    let codingCredits = new TextBlock("codingCredits");
    codingCredits.text = "Code by Olivier Arguimbau alias Pigmin 👽";
    codingCredits.fontSize = "20px";
    codingCredits.fontFamily = "Courier New";
    codingCredits.color = "#ffffff";
    codingCredits.height = "52px";
    codingCredits.top = "-400px";
    codingCredits.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    codingCredits.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.#creditsUI.addControl(codingCredits);



    var modelCreditsMotion = new Animation("modelCreditsMotion", "top", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    var modelCreditsMotionKeys = [];
    //modelCredits.text = "Happy Holidays"; 
    modelCreditsMotionKeys.push({ frame: startFrame, value: -200 });
    modelCreditsMotionKeys.push({ frame: endFrame * 0.3, value: 50 });
    modelCreditsMotionKeys.push({ frame: endFrame * 0.9, value: 50 });
    modelCreditsMotionKeys.push({ frame: endFrame, value: -200 });
    modelCreditsMotion.setKeys(modelCreditsMotionKeys);

    GlobalManager.scene.beginDirectAnimation(modelCredits, [modelCreditsMotion], startFrame, endFrame, false, 1, callback);

    var musicCreditsMotion = new Animation("musicCreditsMotion", "top", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    var musicCreditsMotionKeys = [];
    //musicCredits.text = "Happy Holidays"; 
    musicCreditsMotionKeys.push({ frame: startFrame, value: -300 });
    musicCreditsMotionKeys.push({ frame: endFrame * 0.3, value: 200 });
    musicCreditsMotionKeys.push({ frame: endFrame * 0.9, value: 200 });
    musicCreditsMotionKeys.push({ frame: endFrame, value: -300 });
    musicCreditsMotion.setKeys(musicCreditsMotionKeys);

    GlobalManager.scene.beginDirectAnimation(musicCredits, [musicCreditsMotion], startFrame, endFrame, false, 1, callback);

    var codingCreditsMotion = new Animation("codingCreditsMotion", "top", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    var codingCreditsMotionKeys = [];
    //codingCredits.text = "Happy Holidays"; 
    codingCreditsMotionKeys.push({ frame: startFrame, value: -400 });
    codingCreditsMotionKeys.push({ frame: endFrame * 0.3, value: 350 });
    codingCreditsMotionKeys.push({ frame: endFrame * 0.9, value: 350 });
    codingCreditsMotionKeys.push({ frame: endFrame, value: -400 });
    codingCreditsMotion.setKeys(codingCreditsMotionKeys);

    GlobalManager.scene.beginDirectAnimation(codingCredits, [codingCreditsMotion], startFrame, endFrame, false, 1, callback);



  }

  async loadMeshes() {
    //starfield
    SceneLoader.ImportMesh("", "", starFieldGlb, GlobalManager.scene, (newMeshes) => {
      this.#meshes.starfield = newMeshes[1];
      this.#meshes.starfield.scaling = new Vector3(4500, 4500, 4500);
      this.#meshes.starfield.material = this.#meshesMats.starfield;
    });


  }

  loadAssets() {
    return new Promise((resolve) => {

/*

      // Asset manager for loading texture and particle system
      this.#assetsManager = new AssetsManager(GlobalManager.scene);
      const particleTexture = this.#assetsManager.addTextureTask("explosion texture", particleExplosionTextureUrl)
      const particleExplosion = this.#assetsManager.addTextFileTask("explosion", particleExplosionUrl);
      const fireSoundData = this.#assetsManager.addBinaryFileTask("fireSound", fireSoundUrl);




      // load all tasks
      this.#assetsManager.load();

      // after all tasks done, set up particle system
      this.#assetsManager.onFinish = (tasks) => {
        console.log("tasks successful", tasks);

        // prepare to parse particle system files
        const particleJSON = JSON.parse(particleExplosion.text);
        explosionParticleSystem = ParticleSystem.Parse(particleJSON, GlobalManager.scene, "", true);

        // set particle texture
        explosionParticleSystem.particleTexture = particleTexture.texture;
        explosionParticleSystem.emitter = new Vector3(0, 0, 0);


        soundsRepo[SoundsFX.FIRE] = new Sound("fireSound", fireSoundData.data, GlobalManager.scene);



        resolve(true);
      }
*/
    resolve(true);
    });


  }

  async createMaterials() {
    this.#meshesMats.starfieldTex = new Texture(starFieldPanoramaTextureUrl, GlobalManager.scene, false, false);
    this.#meshesMats.starfield = new NodeMaterial("starfieldMat", GlobalManager.scene, { emitComments: false });
    await this.#meshesMats.starfield.loadAsync(starFieldShaderUrl);
    this.#meshesMats.starfield.build(false);
    this.#meshesMats.starfield.getBlockByName("emissiveTex").texture = this.#meshesMats.starfieldTex;
  }

  loop() {
    // Render every frame
    const divFps = document.getElementById("fps");
    GlobalManager.engine.runRenderLoop(() => {

      const now = performance.now();

      InputController.update();
      this.updateAllText();

      if (gameState == States.STATE_PRE_INTRO) {
        //RAS
      }
      else if (gameState == States.STATE_MENU) {

        if (InputController.actions["Space"]) {
          if (gameState == States.STATE_MENU)
            changeGameState(States.STATE_START_INTRO);
        }
      }
      else if (gameState == States.STATE_START_INTRO) {
        //this.#cameras.main.setTarget(this.#cameraGameTarget);
        changeGameState(States.STATE_INTRO);
        this.launchGameStartAnimation(() => {
          Engine.audioEngine.unlock();
          this.showGameUI(true);
          changeGameState(States.STATE_START_GAME);
        });
      }
      else if (gameState == States.STATE_INTRO) {
        //RAS
      }
      else if (gameState == States.STATE_START_GAME) {
        changeGameState(States.STATE_NEW_LEVEL);
      }
      else if (gameState == States.STATE_LAUNCH) {

      }
      else if (gameState == States.STATE_NEW_LEVEL) {

      }
      else if (gameState == States.STATE_LEVEL_WELDING) {
        //RAS
      }
      else if (gameState == States.STATE_LEVEL_READY) {

      }
      else if (gameState == States.STATE_LOOSE) {

      }
      else if (gameState == States.STATE_GAME_OVER) {

        this.launchGameOverAnimation(() => {
          changeGameState(States.STATE_MENU);
        });
      }
      else if (gameState == States.STATE_RUNNING) {


        //SPECIAL CONTROLS 
        if (InputController.actions["KeyP"]) {
          this.#bPause = true;
          changeGameState(States.STATE_PAUSE);
        }


      }
      else if (gameState == States.STATE_PAUSE) {
        if (InputController.actions["KeyP"]) {
          this.#bPause = false;
          changeGameState(States.STATE_RUNNING);
        }

      }

      //Render : (auto)

      //Debug
      if (InputController.actions["KeyD"]) {
        this.#bInspector = !this.#bInspector;
        if (this.#bInspector) {
          Inspector.Show(GlobalManager.scene, { embedMode: true });
          console.log(this.#cameras.main);
          this.#cameras.main.attachControl(GlobalManager.canvas, true);

        }
        else {
          this.#cameras.main.detachControl();
          Inspector.Hide();
        }
      }

      //Fin update 
      InputController.endupdate();

      //Affichage FPS
      divFps.innerHTML = GlobalManager.engine.getFps().toFixed() + " fps";
      GlobalManager.scene.render();


    });
  }

  resetGame() {
    currentLevel = 1;

    nbLives = constants.START_LIVES;
    if (currentScore > currentHighScore)
      currentHighScore = currentScore;
    currentScore = 0;
  }

  end() { }


  LoadEntity(
    name,
    meshNameToLoad,
    url,
    file,
    manager,
    meshArray,
    entity_number,
    props,
    scene,
    shadowGenerator,
    callback
  ) {
    const meshTask = manager.addMeshTask(name, meshNameToLoad, url, file);

    meshTask.onSuccess = function (task) {
      const parent = task.loadedMeshes[0];
      parent.name = name;

      /*      const obj = parent.getChildMeshes()[0];
            obj.setParent(null);
            parent.dispose();*/

      meshArray[entity_number] = parent;

      if (props) {
        if (props.scaling) {
          meshArray[entity_number].scaling.copyFrom(props.scaling);
        }
        if (props.position) {
          meshArray[entity_number].position.copyFrom(props.position);
        }
        else
          meshArray[entity_number].position = Vector3.Zero();

        if (props.rotation) {
          meshArray[entity_number].rotationQuaternion = null;
          meshArray[entity_number].rotation.copyFrom(props.rotation);
        }
        else
          meshArray[entity_number].rotation = Vector3.Zero();

      }
      else {
        meshArray[entity_number].position = Vector3.Zero();
        meshArray[entity_number].rotation = Vector3.Zero();
      }

      if (shadowGenerator)
        shadowGenerator.addShadowCaster(parent);
      parent.receiveShadows = true;
      for (let mesh of parent.getChildMeshes()) {
        mesh.receiveShadows = true;
        mesh.computeWorldMatrix(true);
      }
      if (callback)
        callback(meshArray[entity_number]);
    };
    meshTask.onError = function (e) {
      console.log(e);
    };
  }

  showGUI() {
    // GUI

    this.#menuUiTexture.rootContainer.isVisible = true;
  }
  hideGUI() {
    this.#menuUiTexture.rootContainer.isVisible = false;
  }
  gotoMenuCamera() {
    this.#cameras.main.position = this.#cameraMenuPosition.clone();
    let target = this.getTargetMenuPosition();
    if (target)
      this.#cameras.main.setTarget();
  }
  getTargetMenuPosition() {
    let guiParent = GlobalManager.scene.getNodeByName(constants.START_BUTTON_MESH_TARGET);
    if (guiParent)
      return guiParent.getAbsolutePosition();
    else
      return null;
  }

  gotoGameCamera() {
    this.#cameras.main.position = this.#cameraGamePosition.clone();
    this.#cameras.main.setTarget(this.#cameraGameTarget);
  }

  loadMenuGUI() {
    // GUI
    let guiParent = GlobalManager.scene.getNodeByName(constants.START_BUTTON_MESH_TARGET);
    this.#cameras.main.setTarget(guiParent.getAbsolutePosition());

    var startGameButton = MeshBuilder.CreatePlane("startGameButton", { width: 10, depth: 10 });
    startGameButton.scaling = new Vector3(3.8, 16, 1);
    startGameButton.position = new Vector3(-259, 86, -361.3);
    startGameButton.rotation.x = Math.PI / 8;
    startGameButton.rotation.y = -Math.PI / 2;

    this.#menuUiTexture = AdvancedDynamicTexture.CreateForMesh(startGameButton);

    var button1 = Button.CreateSimpleButton("but1", "START");
    button1.width = 0.2;
    button1.height = 0.9;
    button1.color = "white";
    button1.fontSize = 64;
    button1.fontFamily = "Courier New";
    button1.background = "";
    button1.onPointerUpObservable.add(() => {
      if (gameState == States.STATE_MENU)
        //this.hideGUI();
        changeGameState(States.STATE_START_INTRO);
    });
    this.#menuUiTexture.addControl(button1);
    this.gotoMenuCamera();
    this.showGUI();

  }

  loadGameUI() {
    this.textScale = 1;
    let fontSize = 22 * this.textScale;
    let spacing = 150 * this.textScale;

    this.#gameUI = AdvancedDynamicTexture.CreateFullscreenUI("gameUI");

    //Score
    this.textScore = new TextBlock();
    this.textScore.color = "white";
    this.textScore.fontSize = fontSize;
    this.textScore.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textScore.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.textScore.left = -spacing * 3;
    this.textScore.top = 20;
    this.#gameUI.addControl(this.textScore);

    // Level
    this.textLevel = new TextBlock();
    this.textLevel.color = "white";
    this.textLevel.fontSize = fontSize;
    this.textLevel.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textLevel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
    this.textLevel.left = -spacing;
    this.textLevel.top = 20;
    this.#gameUI.addControl(this.textLevel);

    // High score
    this.textHigh = new TextBlock();
    this.textHigh.color = "white";
    this.textHigh.fontSize = fontSize;
    this.textHigh.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textHigh.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
    this.textHigh.left = spacing * 3;
    this.textHigh.top = 20;
    this.#gameUI.addControl(this.textHigh);

    // Lives
    this.textLives = new TextBlock("Score");
    this.textLives.color = "white";
    this.textLives.fontSize = fontSize;

    this.textLives.fontFamily = 'Courier New';
    this.textLives.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.textLives.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.textLives.left = spacing;
    this.textLives.top = 20;
    this.#gameUI.addControl(this.textLives);
    this.showGameUI(false);

    this.updateAllText();
    window.onresize = () => {
      this.getCanvasSize();
      this.fixTextScale();
    }
  }
  showGameUI(bActive) {
    this.#gameUI.rootContainer.isVisible = bActive;
  }
  updateAllText() {
    this.updateTextLives();
    this.updateTextScore();
    this.updateTextHighScore();
    this.updateTextLevel();
  }
  updateTextLives() {
    this.textLives.text = `Lifes : ${nbLives}`;
  }
  updateTextScore() {
    this.textScore.text = `Score : ${currentScore}`;
  }
  updateTextHighScore() {
    this.textHigh.text = `HighScore : ${currentHighScore}`;
  }

  updateTextLevel() {
    this.textLevel.text = `Level : ${currentLevel}`;
  }


  getCanvasSize() {
    GlobalManager.canvasWidth = document.querySelector("canvas").width;
    GlobalManager.canvasHeight = document.querySelector("canvas").height;
  }

  fixTextScale() {
    this.textScale = Math.min(1, GlobalManager.canvasWidth / 1280);
    let fontSize = 22 * this.textScale;
    let spacing = 150 * this.textScale;
    this.textLives.fontSize = fontSize;
    this.textLives.left = spacing;
    this.textScore.fontSize = fontSize;
    this.textLevel.fontSize = fontSize;
    this.textHigh.fontSize = fontSize;
    this.textScore.left = -spacing * 3;
    this.textLevel.left = -spacing;
    this.textHigh.left = spacing * 3;
  }



}

export default Gyruss;