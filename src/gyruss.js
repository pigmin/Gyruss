//Gyruss

import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder, Scalar, StandardMaterial, Color3, Color4, TransformNode, KeyboardEventTypes, DefaultRenderingPipeline, ArcRotateCamera, AssetsManager, ParticleSystem, ShadowGenerator, DirectionalLight, Sound, Animation, Engine, GamepadManager, VideoTexture, BoundingInfo, CubeTexture, SceneLoader, NodeMaterial } from "@babylonjs/core";



import { Inspector } from '@babylonjs/inspector';
import { TrailMesh } from '@babylonjs/core/Meshes/trailMesh';

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version
import "@babylonjs/loaders/glTF";


import groundBaseColorUrl from "../assets/textures/Metal_Plate_Sci-Fi_001_SD/Metal_Plate_Sci-Fi_001_basecolor.jpg";
import groundNormalUrl from "../assets/textures/Metal_Plate_Sci-Fi_001_SD/Metal_Plate_Sci-Fi_001_normal.jpg";

import particleExplosionUrl from "../assets/particles/systems/explosionParticleSystem.json"
import particleExplosionTextureUrl from "../assets/particles/textures/dotParticle.png"


import musicUrl1 from "../assets/musics/Sky - Toccata (Video).mp3";
import fireSoundUrl from "../assets/sounds/Arkanoid SFX (3).wav";

import envfileUrl from "../assets/env/environment.env";
import starFieldGlb from "../assets/gltf/starsGeo.glb";
import starFieldPanoramaTextureUrl from "../assets/textures/starfield_panorama_texture.jpg";
import starFieldSharedUrl from "../assets/shaders/starfieldShader.json";

import { AdvancedDynamicTexture, Button, Control, TextBlock } from "@babylonjs/gui";




import * as constants from "./constants";

//const StartButtonMeshTarget = "panel_plate.001_140";

let explosionParticleSystem;
let shadowGenerator;


let nbLives = constants.START_LIVES;
let currentScore = 0;
let currentHighScore = 0;
let currentLevel = 1;


let gameState;
function changeGameState(newState) {
  gameState = newState;
}

let SoundsFX = Object.freeze({
  FIRE: 7,
})

let soundsRepo = [];
function playSound(soundIndex) {
  soundsRepo[soundIndex].play();
}

function getRandomInt(max) {
  return Math.round(Math.random() * max);
}

class Entity {

  x = 0;
  y = 0;
  z = 0;
  prevX = 0;
  prevY = 0;
  prevZ = 0;

  vx = 0;
  vy = 0;
  vz = 0;

  ax = 0;
  ay = 0;
  az = 0;

  gameObject;

  constructor(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.gameObject = null;
  }

  setPosition(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.updatePosition();
  }

  updatePosition() {
    this.gameObject.position = new Vector3(this.x, this.y, this.z);
  }

  applyVelocities(factor) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.prevZ = this.z;

    factor = factor || 1;

    this.x = this.x + (this.vx * factor);
    this.y = this.y + (this.vy * factor);
    this.z = this.z + (this.vz * factor);

  }

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
  #scene;
  #assetsManager;
  #camera;
  #light;
  #shadowGenerator;
  #musics = [];
  #bPause;

  #ground;

  #inputController;
  #bInspector = false;

  #meshes = {};
  #meshesMats = {};
  #lights = {};
  #cameras = {};

  #menuUiTexture;
  #gameUI;
  #creditsUI;

  #timeToLaunch = 0;
  #cameraStartPosition = new Vector3(-257, 566, -620);
  #cameraMenuPosition = new Vector3(-199, 88, -360);

  #cameraGamePosition = new Vector3(36.01, 127.25, -41.91);
  #cameraGameTarget = new Vector3(35, 15.71, -5.89);

  constructor(canvas, engine) {
    this.#canvas = canvas;
    this.#engine = engine;

    this.#meshes.thrusters = [];
    this.#meshes.thrusterFlames = [];
    this.#meshes.vortex = [];
    this.#meshes.cannons = [];
    this.#meshes.projectiles = [];
    this.#meshes.starField = null;
  }

  async start() {
    await this.init();
    //this.loadMenuGUI();
    this.loadGameUI();
    this.starField();
    this.loop();
    this.end();
  }

  starField() {

    const Star = function (x, y, z) {

      this.x = x; this.y = y; this.z = z;

      this.size = 25;

    };

    this.stars = new Array();
    this.max_depth = 7500;

    let height = document.documentElement.clientHeight;
    let width = document.documentElement.clientWidth;

    for (let index = 0; index < 200; index++)
      this.stars[index] = new Star(Math.random() * width, Math.random() * height, index * (this.max_depth / 200));




  }

  async init() {
    // Create our first scene.
    this.#scene = new Scene(this.#engine);
    this.#scene.clearColor = Color3.Black();
    let env = {};

    await this.loadAssets();

    // Add the highlight layer.
    //this.#hightLightLayer = new HighlightLayer("hightLightLayer", this.#scene);
    //this.#hightLightLayer.innerGlow = false;

    // standard ArcRotate camera
    this.#cameras.main = new ArcRotateCamera("camera", 4.15, 1.3, 0.25, new Vector3(0.0, 0, 0), this.#scene);
    this.#cameras.main.minZ = 0.001;
    this.#cameras.main.maxZ = 20000;
    this.#cameras.main.wheelDeltaPercentage = 0.1;
    this.#cameras.main.attachControl(this.#canvas, false);



    // This targets the camera to scene origin
    //this.gotoMenuCamera();
    // This attaches the camera to the canvas
    //this.#cameras.main.attachControl(this.#canvas, true);



  /*  // Set up new rendering pipeline
    var pipeline = new DefaultRenderingPipeline("default", true, this.#scene, [this.#cameras.main]);

    pipeline.glowLayerEnabled = true;
    pipeline.glowLayer.intensity = 0.35;
    pipeline.glowLayer.blurKernelSize = 16;
    pipeline.glowLayer.ldrMerge = true;
*/
    env.lighting = CubeTexture.CreateFromPrefilteredData(envfileUrl, this.#scene);
    env.lighting.gammaSpace = false;
    env.lighting.rotationY = 1.977;
    this.#scene.environmentTexture = env.lighting;
    this.#scene.environmentIntensity = 1;


		// directional light needed for shadows
		this.#lights.dirLight = new DirectionalLight("dirLight", new Vector3(0.47, -0.19, -0.86), this.#scene);
		this.#lights.dirLight.position = new Vector3(0, 0.05, 0);
		this.#lights.dirLight.diffuse = Color3.FromInts(255, 251, 199);
		this.#lights.dirLight.intensity = 3;
		this.#lights.dirLight.shadowMinZ = 3.5;
		this.#lights.dirLight.shadowMaxZ = 12;
    

    this.#shadowGenerator = shadowGenerator = new ShadowGenerator(512, this.#lights.dirLight);
    //this.#shadowGenerator.useExponentialShadowMap = true;
    //this.#shadowGenerator.usePercentageCloserFiltering = true;
    this.#shadowGenerator.setDarkness(0.4);


    this.#meshesMats.valkyrieShieldColor = new Color3(3.01, 1.72, 0.30);
    this.#meshesMats.raiderShieldColor = new Color3(0.42, 3.27, 3.72);

    this.#musics[0] = new Sound("music0", musicUrl1, this.#scene, null, { loop: true, autoplay: true, volume: 0.4 });
    /*  this.#musics[1] = new Sound("music1", musicUrl2, this.#scene, null, { loop: true, autoplay: false });
      this.#musics[2] = new Sound("music2", musicUrl3, this.#scene, null, { loop: true, autoplay: false });
      this.#musics[3] = new Sound("music3", musicUrl4, this.#scene, null, { loop: true, autoplay: false });
      this.#musics[4] = new Sound("music4", musicUrl5, this.#scene, null, { loop: true, autoplay: false });
      this.#musics[5] = new Sound("music5", musicUrl6, this.#scene, null, { loop: true, autoplay: false });
      this.#musics[6] = new Sound("music6", musicUrl7, this.#scene, null, { loop: true, autoplay: false });
      this.#musics[7] = new Sound("music7", musicUrl8, this.#scene, null, { loop: true, autoplay: false });
      */




    this.#inputController = new InputController(this.#engine, this.#scene, this.#canvas);


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

    this.#scene.beginAnimation(this.#cameras.main, startFrame, endFrame, false, 1, callback);
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

    this.#scene.beginAnimation(this.#cameras.main, startFrame, endFrame, false, 1, callback);
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

    this.#scene.beginAnimation(this.#cameras.main, startFrame, endFrame, false, 1, callback);
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

    this.#scene.beginDirectAnimation(modelCredits, [modelCreditsMotion], startFrame, endFrame, false, 1, callback);

    var musicCreditsMotion = new Animation("musicCreditsMotion", "top", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    var musicCreditsMotionKeys = [];
    //musicCredits.text = "Happy Holidays"; 
    musicCreditsMotionKeys.push({ frame: startFrame, value: -300 });
    musicCreditsMotionKeys.push({ frame: endFrame * 0.3, value: 200 });
    musicCreditsMotionKeys.push({ frame: endFrame * 0.9, value: 200 });
    musicCreditsMotionKeys.push({ frame: endFrame, value: -300 });
    musicCreditsMotion.setKeys(musicCreditsMotionKeys);

    this.#scene.beginDirectAnimation(musicCredits, [musicCreditsMotion], startFrame, endFrame, false, 1, callback);

    var codingCreditsMotion = new Animation("codingCreditsMotion", "top", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    var codingCreditsMotionKeys = [];
    //codingCredits.text = "Happy Holidays"; 
    codingCreditsMotionKeys.push({ frame: startFrame, value: -400 });
    codingCreditsMotionKeys.push({ frame: endFrame * 0.3, value: 350 });
    codingCreditsMotionKeys.push({ frame: endFrame * 0.9, value: 350 });
    codingCreditsMotionKeys.push({ frame: endFrame, value: -400 });
    codingCreditsMotion.setKeys(codingCreditsMotionKeys);

    this.#scene.beginDirectAnimation(codingCredits, [codingCreditsMotion], startFrame, endFrame, false, 1, callback);



  }


  loadAssets() {
    return new Promise((resolve) => {

      this.createMaterials();
      // Asset manager for loading texture and particle system
      this.#assetsManager = new AssetsManager(this.#scene);
      const particleTexture = this.#assetsManager.addTextureTask("explosion texture", particleExplosionTextureUrl)
      const particleExplosion = this.#assetsManager.addTextFileTask("explosion", particleExplosionUrl);


      const fireSoundData = this.#assetsManager.addBinaryFileTask("fireSound", fireSoundUrl);


      //load starfield
      SceneLoader.ImportMesh("", "", starFieldGlb, this.#scene, (newMeshes) => {
        this.#meshes.starfield = newMeshes[1];
        this.#meshes.starfield.scaling = new Vector3(4500, 4500, 4500);
        this.#meshes.starfield.material = this.#meshesMats.starfield;
      });

      // load all tasks
      this.#assetsManager.load();

      // after all tasks done, set up particle system
      this.#assetsManager.onFinish = (tasks) => {
        console.log("tasks successful", tasks);

        // prepare to parse particle system files
        const particleJSON = JSON.parse(particleExplosion.text);
        explosionParticleSystem = ParticleSystem.Parse(particleJSON, this.#scene, "", true);

        // set particle texture
        explosionParticleSystem.particleTexture = particleTexture.texture;
        explosionParticleSystem.emitter = new Vector3(0, 0, 0);


        soundsRepo[SoundsFX.FIRE] = new Sound("fireSound", fireSoundData.data, this.#scene);



        resolve(true);
      }

    });


  }

  async createMaterials() {
    this.#meshesMats.starfieldTex = new Texture(starFieldPanoramaTextureUrl, this.#scene, false, false);
    this.#meshesMats.starfield = new NodeMaterial("starfieldMat", this.#scene, { emitComments: false });
    await this.#meshesMats.starfield.loadAsync(starFieldSharedUrl);
    this.#meshesMats.starfield.build(false);
    this.#meshesMats.starfield.getBlockByName("emissiveTex").texture = this.#meshesMats.starfieldTex;
/*
    this.#meshesMats.thrusterFlame = new NodeMaterial("thrusterFlameMat", scene, { emitComments: false });
    await this.#meshesMats.thrusterFlame.loadAsync("https://spacepirates.babylonjs.com/assets/shaders/thrusterFlame.json");
    this.#meshesMats.thrusterFlame.build(false);
    this.#meshesMats.thrusterFlame.backFaceCulling = false;
    this.#meshesMats.thrusterFlame.alphaMode = 1;

    this.#meshesMats.vortex = new NodeMaterial("vortexMat", scene, { emitComments: false });
    await this.#meshesMats.vortex.loadAsync("https://spacepirates.babylonjs.com/assets/shaders/vortex.json");
    this.#meshesMats.vortex.build(false);
    this.#meshesMats.vortex.backFaceCulling = false;
    this.#meshesMats.vortex.alphaMode = 1;

    this.#meshesMats.valkyrieProjectile = new NodeMaterial("valkyrieProjectileMat", scene, { emitComments: false });
    await this.#meshesMats.valkyrieProjectile.loadAsync("https://spacepirates.babylonjs.com/assets/shaders/projectileUVShader.json");
    this.#meshesMats.valkyrieProjectile.build(false);
    this.#meshesMats.valkyrieProjectile.alphaMode = 1;
    this.#meshesMats.valkyrieProjectile.getBlockByName("coreColor").value = new Color3(6.79, 0.8, 0.4);
    this.#meshesMats.valkyrieProjectile.getBlockByName("midLevel").value = 0.3;
    this.#meshesMats.valkyrieProjectile.getBlockByName("outerLevel").value = 0.25;
    this.#meshesMats.raiderProjectile = this.#meshesMats.valkyrieProjectile.clone("raiderProjectileMat");
    this.#meshesMats.raiderProjectile.getBlockByName("coreColor").value = new Color3(0.30, 3.90, 6.42);
    this.#meshesMats.raiderProjectile.getBlockByName("midLevel").value = 0.5;
    this.#meshesMats.raiderProjectile.getBlockByName("outerLevel").value = 0.25;

    this.#meshesMats.decal = new NodeMaterial("decalMat", scene, { emitComments: false });
    await this.#meshesMats.decal.loadAsync("https://spacepirates.babylonjs.com/assets/shaders/shields.json");
    this.#meshesMats.decal.build(false);
    this.#meshesMats.decal.getBlockByName("hitColor").value = this.#meshesMats.valkyrieShieldColor;
    this.#meshesMats.decal.backFaceCulling = false;
    this.#meshesMats.decal.alphaMode = 1;*/
  }

  loop() {
    // Render every frame
    const divFps = document.getElementById("fps");
    this.#engine.runRenderLoop(() => {

      const now = performance.now();

      this.#inputController.update();
      this.updateAllText();

      if (gameState == States.STATE_PRE_INTRO) {
        //RAS
      }
      else if (gameState == States.STATE_MENU) {

        let height = document.documentElement.clientHeight;
        let width = document.documentElement.clientWidth;


        for (let index = this.stars.length - 1; index > -1; index--) {

          let star = this.stars[index];

          star.z -= 5;

          if (star.z < 0) {

            this.stars.push(this.stars.splice(index, 1)[0]);
            star.z = this.max_depth;
            continue;

          }

          let translate_x = width * 0.5;
          let translate_y = height * 0.5;

          let field_of_view = (height + width) * 0.5;

          let star_x = (star.x - translate_x) / (star.z / field_of_view) + translate_x;
          let star_y = (star.y - translate_y) / (star.z / field_of_view) + translate_y;

          let scale = field_of_view / (field_of_view + star.z);

          let color = Math.floor(scale * 256);

          //context.fillStyle = "rgb(" + color + "," + color + "," + color + ")";
          //context.fillRect(star_x, star_y, star.size * scale, star.size * scale);

        }

        if (this.#inputController.actions["Space"]) {
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
        if (this.#inputController.actions["KeyP"]) {
          this.#bPause = true;
          changeGameState(States.STATE_PAUSE);
        }


      }
      else if (gameState == States.STATE_PAUSE) {
        if (this.#inputController.actions["KeyP"]) {
          this.#bPause = false;
          changeGameState(States.STATE_RUNNING);
        }

      }

      //Render : (auto)

      //Debug
      if (this.#inputController.actions["KeyD"]) {
        this.#bInspector = !this.#bInspector;
        if (this.#bInspector) {
          Inspector.Show(this.#scene, { embedMode: true });
          console.log(this.#cameras.main);
          this.#cameras.main.attachControl(this.#canvas, true);

        }
        else {
          this.#cameras.main.detachControl();
          Inspector.Hide();
        }
      }

      //Fin update 
      this.#inputController.endupdate();

      //Affichage FPS
      divFps.innerHTML = this.#engine.getFps().toFixed() + " fps";
      this.#scene.render();


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
    let guiParent = this.#scene.getNodeByName(constants.START_BUTTON_MESH_TARGET);
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
    let guiParent = this.#scene.getNodeByName(constants.START_BUTTON_MESH_TARGET);
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
    this.canvasWidth = document.querySelector("canvas").width;
    this.canvasHeight = document.querySelector("canvas").height;
  }

  fixTextScale() {
    this.textScale = Math.min(1, this.canvasWidth / 1280);
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

class InputController {

  #scene;
  #canvas;
  #engine;
  #gamepadManager;

  inputMap = {};
  actions = {};

  constructor(engine, scene, canvas) {
    this.#scene = scene;
    this.#canvas = canvas;
    this.#engine = engine;
    this.#gamepadManager = new GamepadManager();

    this.#scene.onKeyboardObservable.add((kbInfo) => {
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


export default Gyruss;
