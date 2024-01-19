//Gyruss

import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Scene } from "@babylonjs/core/scene";
import { Color3, AssetsManager, ShadowGenerator, DirectionalLight, Animation, Engine, CubeTexture, UniversalCamera, GlowLayer, ArcRotateCamera, FlyCamera, SpotLight, Texture, VolumetricLightScatteringPostProcess, Constants, VideoTexture, MeshBuilder, StandardMaterial } from "@babylonjs/core";



import { Inspector } from '@babylonjs/inspector';

import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version
import "@babylonjs/loaders/glTF";


import environmentModelUrl from "../assets/gltf/graffiti_on_a_wall_-_low_poly.glb";
import cabinetModelUrl from "../assets/gltf/arcade machine gyruss.glb";
import lightModelUrl from "../assets/gltf/work_light.glb";
import playNeonModelUrl from "../assets/gltf/play_neon2.glb";
import electricityModelUrl from "../assets/gltf/a_soviet_electricity_meter.glb";


import workLightAnimUrl from "../assets/animations/worklight.json";

import sunTexture2Url from "../assets/textures/sun.png";
import screenVideoTextureUrl from "../assets/textures/Gyruss _ arcade attract mode auto demo _ 1983 -NOSOUND.mp4";
import envfileUrl from "../assets/env/environment.env";
import { AdvancedDynamicTexture, Button, Control, TextBlock } from "@babylonjs/gui";


import * as constants from "./constants";
import { GlobalManager } from "./globalmanager";
import { InputController } from "./inputcontroller";
import { Valkyrie } from "./valkyrie";
import { SoundManager } from "./soundmanager";
import StarField from "./starfield";

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

// 2,750,000,000 miles from home your journey from Neptune to Earth is threatened by 25 stages of attack by the evil Ideoclan Empire (which consists of Exarsions, Petarions, Terarions, Gigarions and - on the bonus stages - Zigmas and Dogmas.)
/**
 * Shooting a ship	50, 100 or 150 points.
Destroying a whole formation of enemy ships before the next wave attacks	1,000, 1,500, 2,000, 2,500 points.
Bonus for clearing a sector (having not destroyed a whole formation)	1,000 points.
Shooting the three glowing spheres	1,000, 1,500, 2,000 points.
Bonus for shooting each ship on the Chance Stage	100 points.
Bonus for shooting all 40 ships on the Chance Stage	10,000 points.


* You can get double fire if you shoot the sun-like enemy that appears in front of you surrounded by two blue pod-like enemies - try to make this a priority.

* To make getting double fire easier, try to stay at the bottom of the screen until the 'pod and sun' formation appears as it will appear right in front of wherever your ship is after all enemies have entered and they start attacking.
1) There must be at least three enemies left in the level for the 'pod and sun' formation to show. If you lose a life and three enemies are left, the 'pod and sun' will show up one more time, but if you lose a life after that, they will not show any more until the next level. After you get double fire, the sun enemy will be replaced on later levels with another pod. Destroy all three for some bonus points.
2) If you have only one enemy left and cannot seem to destroy it, just leave it alone and eventually it will just leave and the level will end.

* Each level begins with four formations entering. If you destroy enough of these, a fifth formation will enter. As you pass each planet, more formations will enter towards the top of the screen. Learn to control your ship at the top as it will come in real handy on those Mars and Earth warps.

* When formations enter from the edge of the screen, they will not hit you if you are right where they enter. You can use this to your advantage to take out the formation with little or no trouble - just watch out for asteroids.

* Asteroids will always appear in your path - they cannot be destroyed and must be avoided.

* The 'bee-like' creatures with the force field will always appear from the center and move outward. The force field will destroy your ship if you touch it. Destroy one of the creatures to disable their force field.

* Learn the formations of the enemy attack waves during the normal stages, to enable you to collect the bonuses for destroying whole waves of attacking ships.

* Learn the formations of the enemy attack waves during the chance stages, to enable you to collect the bonuses for destroying whole waves of attackers and the 10,000 for destroying all 40 ships.

* The three glowing spheres always appear aligned with where you are located on screen. Remember to avoid any bullets when they appear.

* You can fire bullets ahead of enemy ships and then move aside to destroy them and avoid their shots.



Programmer: Toshio Arima
Designer: Yoshiki Okamoto
Character: Hideki Ooyami
Sound: Masahiro Inoue


 */
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
  #starFieldManager;

  #bPause;

  #ground;

  inputController;
  #bInspector = false;

  #meshes = {};
  #meshesMats = {};
  #lights = {};
  #cameras = {};


  #workLightAnim;
  
  #glow = {};

  #keys = {};
  #anim = {};
  #clipLength = 60;


  #menuUiTexture;
  #gameUI;
  #creditsUI;

  #timeToLaunch = 0;
  #cameraStartPosition = new Vector3(-0.05, 7.76, -29.8);
  #cameraStartTarget = new Vector3(0.05, -0.235, 0.5);

  #cameraMenuPosition = new Vector3(0.035, 1.98, -6.72);
  #cameraMenuTarget = new Vector3(0.035, 0.0, 0.5);

  #cameraGameMidPosition = new Vector3(0, 0.0, -3);
  #cameraGameMidTarget = new Vector3(0, 0, 0);   

  #cameraGamePosition = new Vector3(0, 0.0, 5);
  #cameraGameTarget = new Vector3(0, 0, 7);   

  constructor(canvas, engine) {

    GlobalManager.setup(canvas, engine);

  }

  async start() {

    await this.init();
    //this.loadMenuGUI();
    this.loadGameUI();

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
    //this.#cameras.main = new UniversalCamera("camera", this.#cameraStartPosition, GlobalManager.scene);
        this.#cameras.main = new FlyCamera("camera", this.#cameraStartPosition, GlobalManager.scene);
    this.#cameras.main.minZ = 0.001;
    this.#cameras.main.maxZ = 20000;
    this.#cameras.main.wheelDeltaPercentage = 0.1;
    //this.#cameras.main.position = this.#cameraStartPosition;
    this.#cameras.main.setTarget(this.#cameraStartTarget);
    this.#cameras.main.attachControl(GlobalManager.canvas, true);

    // This targets the camera to scene origin
    // This attaches the camera to the canvas
    //this.#cameras.main.attachControl(GlobalManager.canvas, true);

    env.lighting = CubeTexture.CreateFromPrefilteredData(envfileUrl, GlobalManager.scene);
    env.lighting.gammaSpace = false;
    env.lighting.rotationY = 1.977;
    GlobalManager.scene.environmentTexture = env.lighting;
    GlobalManager.scene.environmentIntensity = .05;
    GlobalManager.activeCamera = this.#cameras.main;


    // directional light needed for shadows
    this.#lights.spotLight = new SpotLight("spotLight", new Vector3(-0.11, 3.37, -0.87), new Vector3(0.0, -0.8, -1), Math.PI/2, 18, GlobalManager.scene);
    this.#lights.spotLight.shadowMinZ = 0.5;
    this.#lights.spotLight.shadowMaxZ = 200;
    //this.#lights.spotLight.position = new Vector3(-0.11, 3.37, -0.87);
    this.#lights.spotLight.diffuse = Color3.FromInts(255, 251, 199);    
    this.#lights.spotLight.intensity = 60;


    this.#lights.workLight = new SpotLight("workLight", new Vector3(-10.18, -5.77, -2.68), new Vector3(0.97, 0.21, 0.14), 2*Math.PI/3, 10, GlobalManager.scene);
    this.#lights.workLight.shadowMinZ = 1;
    this.#lights.workLight.shadowMaxZ = 200;
    //this.#lights.workLight = new DirectionalLight("workLight", new Vector3(0.97, 0.21, 0.14), GlobalManager.scene);
    
    this.#lights.workLight.diffuse = new Color3(255, 251, 59);
    this.#lights.workLight.intensity = 12;
/*
LATER USE FOR GAME AND SUN EFFECTS

      // Create the "God Rays" effect (volumetric light scattering)
    var godrays = new VolumetricLightScatteringPostProcess('godrays', 1.0, GlobalManager.activeCamera, null, 100, Texture.BILINEAR_SAMPLINGMODE, GlobalManager.engine, false);

    // By default it uses a billboard to render the sun, just apply the desired texture
    // position and scale
    godrays.mesh.material.diffuseTexture = new Texture(sunTexture2Url, GlobalManager.scene, true, false, Texture.BILINEAR_SAMPLINGMODE);
    godrays.mesh.material.diffuseTexture.hasAlpha = true;
    godrays.mesh.position = new Vector3(-0.11, 3.43, -0.31);
    godrays.mesh.scaling = new Vector3(4, 1, 1);*/

    //light.position = godrays.mesh.position;

    //For game phase enabled laer
    this.#lights.dirLight = new DirectionalLight("dirLight", new Vector3(0.2, -0.5, -1), GlobalManager.scene);
    this.#lights.dirLight.position = new Vector3(-0.28, 3.78, -0.98);
    this.#lights.dirLight.diffuse = Color3.FromInts(255, 251, 199);
    this.#lights.dirLight.intensity = 3;
    //Shut down for intro phase
    this.#lights.dirLight.intensity = 0;
    
    GlobalManager.shadowGenerator = new ShadowGenerator(1024, this.#lights.workLight);
    GlobalManager.shadowGenerator.useBlurExponentialShadowMap = true;
    GlobalManager.shadowGenerator.frustumEdgeFalloff = 1.0;
    //GlobalManager.shadowGenerator.setDarkness(0.6);
    
    GlobalManager.shadowGenerator2 = new ShadowGenerator(1024, this.#lights.spotLight);
    GlobalManager.shadowGenerator2.useBlurExponentialShadowMap = true;
    GlobalManager.shadowGenerator2.frustumEdgeFalloff = 1.0;
    //GlobalManager.shadowGenerator2.setDarkness(0.6);

    InputController.init();
    await SoundManager.init();

    await this.createMaterials();
    await this.loadMeshes();
    await this.loadAssets();


    //SHADOWS TEST 
/*    let mat = new StandardMaterial("mat");

    var ground = MeshBuilder.CreateGround("ground", {width: 100, height: 100, subdivisions: 24});
    ground.position = new Vector3(0, -5.95, 0);
    ground.material = mat;
    ground.receiveShadows = true;

    let c = MeshBuilder.CreateBox("box", {size : 5});
    c.material = mat;
    GlobalManager.shadowGenerator.addShadowCaster(c);
    GlobalManager.shadowGenerator2.addShadowCaster(c);
    c.receiveShadows = true;


    let c2 = MeshBuilder.CreateBox("box", {size : 5});
    c2.material = mat;
    GlobalManager.shadowGenerator.addShadowCaster(c2);
    GlobalManager.shadowGenerator2.addShadowCaster(c2);
    c2.receiveShadows = true;
    c2.position = new Vector3(6.58, -5.44, -2.65);
    // FIN TEST
*/


    this.#starFieldManager = new StarField();
    await this.#starFieldManager.init();

    GlobalManager.valkyrie = new Valkyrie(0, -0.25, (constants.GAME_BASE_Z - 4.75));
    await GlobalManager.valkyrie.init();



    /*  this.#musics[1] = new Sound("music1", musicUrl2, GlobalManager.scene, null, { loop: true, autoplay: false });
      this.#musics[2] = new Sound("music2", musicUrl3, GlobalManager.scene, null, { loop: true, autoplay: false });
      this.#musics[3] = new Sound("music3", musicUrl4, GlobalManager.scene, null, { loop: true, autoplay: false });
      this.#musics[4] = new Sound("music4", musicUrl5, GlobalManager.scene, null, { loop: true, autoplay: false });
      this.#musics[5] = new Sound("music5", musicUrl6, GlobalManager.scene, null, { loop: true, autoplay: false });
      this.#musics[6] = new Sound("music6", musicUrl7, GlobalManager.scene, null, { loop: true, autoplay: false });
      this.#musics[7] = new Sound("music7", musicUrl8, GlobalManager.scene, null, { loop: true, autoplay: false });
      */



    //this.#meshes.valkyrie.position = new Vector3(0, -0.5, 0.0);

    //changeGameState(States.STATE_PRE_INTRO);
    this.launchCreditsAnimation(() => {
      this.#creditsUI.rootContainer.isVisible = false;
      SoundManager.playMusic(SoundManager.Musics.START_MUSIC);
    });
    this.launchPreIntroAnimation(() => {
      //Stop blink anim
      this.#workLightAnim.stop();                  
      changeGameState(States.STATE_MENU);
    });


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
      //outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame / 2,
      value: new Vector3(39, 177, -550),
    });
    keys.push({
      frame: endFrame,
      //inTangent: new Vector3(-1, 0, 0),
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
      //outTangent: new Vector3(1, 0, 0)
    });
    keysTarget.push({
      frame: endFrame,
      //inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraMenuTarget
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
      value: this.#cameraMenuPosition,
      //outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame/2,
      //inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraGameMidPosition,
    });    
    keys.push({
      frame: 2*endFrame/3,
      //inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraGameMidPosition,
    });

    keys.push({
      frame: endFrame,
      //inTangent: new Vector3(-1, 0, 0),
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
      value: this.#cameraMenuTarget,
      //outTangent: new Vector3(1, 0, 0)
    });
    keysTarget.push({
      frame: endFrame/2,
      //inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraGameMidTarget,
    });    
    keysTarget.push({
      frame: endFrame,
      //inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraGameTarget,
    });

    animationcameraTarget.setKeys(keysTarget);

    this.#cameras.main.animations = [];
    this.#cameras.main.animations.push(animationcamera);
    this.#cameras.main.animations.push(animationcameraTarget);

    //VALKYRIE
    GlobalManager.valkyrie.launchGameStartAnimation();
    GlobalManager.scene.beginAnimation(this.#cameras.main, startFrame, endFrame, false, 1, callback);
  }

  launchPreIntroAnimation(callback) {

    const frameRate = 60;
    const startFrame = 0;
    const endFrame = 900;

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
      //outTangent: new Vector3(1, 0, 0)
    });
    keys.push({
      frame: endFrame/3 ,
      value: this.#cameraStartPosition,
      //outTangent: new Vector3(1, 0, 0)
    });    
    keys.push({
      frame: endFrame,
      //inTangent: new Vector3(-1, 0, 0),
      value: this.#cameraMenuPosition,
    });
    animationcamera.setKeys(keys);


    this.#cameras.main.animations = [];
    this.#cameras.main.animations.push(animationcamera);

    GlobalManager.scene.beginAnimation(this.#cameras.main, startFrame, endFrame, false, 1, callback);
    this.#workLightAnim = GlobalManager.scene.beginAnimation(this.#lights.workLight, 0, 200, true, 1);
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

  }

  loadAssets() {
    return new Promise((resolve) => {

      this.#assetsManager = new AssetsManager(GlobalManager.scene);

      const workLightAnimation = this.#assetsManager.addTextFileTask("workLight", workLightAnimUrl);

     // let animations = await BABYLON.Animation.ParseFromFileAsync(null, "https://blakeone.github.io/animations.json");
      
      this.LoadEntity(
        "environment",
        "",
        "",
        environmentModelUrl,
        this.#assetsManager,
        this.#meshes,
        0,
        { position: new Vector3(5, -6, 1.48), scaling: new Vector3(15, 15, -15) , rotation: new Vector3(0, Math.PI/2,0)},
        GlobalManager.scene,
        true,
        (mesh) => {
          mesh.freezeWorldMatrix();
          mesh.convertToFlatShadedMesh();
        }
      );

      this.LoadEntity(
        "cabinet",
        "",
        "",
        cabinetModelUrl,
        this.#assetsManager,
        this.#meshes,
        1,
        { position: new Vector3(-2.4, -7.20, -1.1), scaling: new Vector3(1, 1, -1) },
        GlobalManager.scene,
        true,
        (mesh) => {
          let screenMat = GlobalManager.scene.getMaterialByName("Screen");
          //screenMat.emissiveTexture = null;
          screenMat.albedoColor = new Color3(0, 0, 0);
          screenMat.emissiveColor = new Color3(0.6, 0.6, 0.65);
//          screenMat.emissiveTexture = new VideoTexture("vidtex", screenVideoTextureUrl, GlobalManager.scene);

          mesh.freezeWorldMatrix();
        }
      );


      this.LoadEntity(
        "worklight",
        "",
        "",
        lightModelUrl,
        this.#assetsManager,
        this.#meshes,
        2,
        { position: new Vector3(-9.19, -6.95, -2.94), scaling: new Vector3(8, 8, -8) },
        GlobalManager.scene,
        true,
        (mesh) => {
          mesh.rotation.y = -1.9;
          mesh.freezeWorldMatrix();
        }
      );    

      this.LoadEntity(
        "playNeon",
        "",
        "",
        playNeonModelUrl,
        this.#assetsManager,
        this.#meshes,
        3,
        { position: new Vector3(13.77, 5.13, 3.92), scaling: new Vector3(1, -1, 1) },
        GlobalManager.scene,
        null,
        (mesh) => {
          let neonMat = GlobalManager.scene.getMaterialByName("lambert15SG.001");
          //screenMat.emissiveTexture = null;
          //neonMat.albedoColor = new Color3(0, 0, 0);
          neonMat.emissiveColor = new Color3(1.0, 1.0, 1.0);

          mesh.rotation.y = 0.05;
          mesh.freezeWorldMatrix();
        }
      );
      
      this.LoadEntity(
        "electricity",
        "",
        "",
        electricityModelUrl,
        this.#assetsManager,
        this.#meshes,
        4,
        { position: new Vector3(9.65, 3.23, 1.91), scaling: new Vector3(1, 1, -1) },
        GlobalManager.scene,
        true,
        (mesh) => {
          //mesh.rotation.y = -1.9;
          mesh.freezeWorldMatrix();
        }
      );
      

      // load all tasks
      this.#assetsManager.load();

      // after all tasks done, set up particle system
      this.#assetsManager.onFinish = (tasks) => {
        console.log("tasks successful", tasks);

        // prepare to parse particle system files
        const worklightAnimJson = JSON.parse(workLightAnimation.text);
        this.#lights.workLight.animations = [];
        this.#lights.workLight.animations.push(Animation.Parse(worklightAnimJson.animations[0]));
      
        
        resolve(true);
      }

    });
  }

  async createMaterials() {

  }

  loop() {
    // Render every frame
    const divFps = document.getElementById("fps");
    GlobalManager.engine.runRenderLoop(() => {

      const now = performance.now();

      InputController.update();
      SoundManager.update();
      GlobalManager.update();
      this.#starFieldManager.update();

      this.updateAllText();

      if (gameState == States.STATE_PRE_INTRO) {
        //RAS
      }
      else if (gameState == States.STATE_MENU) {

        if (InputController.actions["Space"]) {
          if (gameState == States.STATE_MENU) {

            changeGameState(States.STATE_START_INTRO);
          }
        }


      }
      else if (gameState == States.STATE_START_INTRO) {
        //this.#cameras.main.setTarget(this.#cameraGameTarget);
        changeGameState(States.STATE_INTRO);
        this.#starFieldManager.setEnabled(true);
        this.launchGameStartAnimation(() => {
          Engine.audioEngine.unlock();
          this.showGameUI(true);
          SoundManager.playMusic(SoundManager.Musics.LEVEL1_MUSIC);
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
        changeGameState(States.STATE_LEVEL_READY);

      }
      else if (gameState == States.STATE_LEVEL_READY) {
        changeGameState(States.STATE_RUNNING);

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

        GlobalManager.valkyrie.update();

      }
      else if (gameState == States.STATE_PAUSE) {
        if (InputController.actions["KeyP"]) {
          this.#bPause = false;
          changeGameState(States.STATE_RUNNING);
        }

      }

      //Render : (auto)

      //Debug
      if (InputController.actions["KeyI"]) {
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
    bEnableShadows,
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

      if (bEnableShadows) {
        GlobalManager.shadowGenerator.addShadowCaster(parent, true);
        GlobalManager.shadowGenerator2.addShadowCaster(parent, true);
        parent.receiveShadows = true;
        for (let mesh of parent.getChildMeshes()) {
          let mat = mesh.material;
          //Turn off because it breaks shadows
          mat.usePhysicalLightFalloff = false;
          mesh.receiveShadows = true;
          mesh.computeWorldMatrix(true);
          //GlobalManager.shadowGenerator.addShadowCaster(mesh);
          //GlobalManager.shadowGenerator2.addShadowCaster(mesh);
        }
      }
      else
        parent.computeWorldMatrix(true);

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

  gotoGameCamera() {
    this.#cameras.main.position = this.#cameraGamePosition.clone();
    this.#cameras.main.setTarget(this.#cameraGameTarget);
  }

  loadMenuGUI() {/*
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
    this.showGUI();
*/
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