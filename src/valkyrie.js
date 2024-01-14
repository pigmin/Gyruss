import { Entity } from "./entity";
import { GlobalManager } from "./globalmanager";
import { InputController } from "./inputcontroller";
import { AnimationGroup, AssetsManager, Color3, EasingFunction, NodeMaterial, ParticleSystem, SceneLoader, SineEase, Vector3 } from "@babylonjs/core";




import thrusterFlameShaderUrl from "../assets/shaders/thrusterFlame.json";
import vortexShaderUrl from "../assets/shaders/vortex.json";
import projectilesShaderUrl from "../assets/shaders/projectileUVShader.json";
import shieldsShaderUrl from "../assets/shaders/shields.json";

import particleExplosionUrl from "../assets/particles/systems/explosionParticleSystem.json"
import particleExplosionTextureUrl from "../assets/particles/textures/dotParticle.png"


import valkyrieMeshUrl from "../assets/gltf/valkyrie_mesh.glb";
import projectilesMeshUrl from "../assets/gltf/projectile_mesh.glb";
import thrusterFlameMeshUrl from "../assets/gltf/thrusterFlame_mesh.glb";
import vortexMeshUrl from "../assets/gltf/vortex_mesh.glb";



export class Valkyrie extends Entity {

    static name = "Valkyrie";

    #meshes = {};
    #meshesMats = {};

    #keys = {};
    #anim = {};
    #clipLength = 60;

    #explosionParticleSystem;

    constructor(x, y, z) {

        super(x, y, z);

        this.#meshes.thrusters = [];
        this.#meshes.thrusterFlames = [];
        this.#meshes.vortex = [];
        this.#meshes.cannons = [];
        this.#meshes.projectiles = [];
        this.#anim.clip = [];
    }

    async init() {

        await this.createMaterials();
        await this.loadMeshes();
        await this.loadAssets();

        this.#meshesMats.valkyrieShieldColor = new Color3(3.01, 1.72, 0.30);
        this.#meshesMats.raiderShieldColor = new Color3(0.42, 3.27, 3.72);

    }

    async loadMeshes() {

        //VAISSEAU
        SceneLoader.ImportMesh("", "", valkyrieMeshUrl, GlobalManager.scene, (newMeshes) => {
            this.#meshes.valkyrie = newMeshes[0];
            for (let child of newMeshes) {
                if (child.material != undefined && child.material.name === "lambert1") child.material.dispose();
            }
            for (let child of newMeshes[1].getChildren()) {
                if (child.name === "valkyrieShield_mesh") {
                    this.#meshes.valkyrieShield = child;
                }
                if (child.name === "valkyrie_thruster_L1" || child.name === "valkyrie_thruster_L2" || child.name === "valkyrie_thruster_R1" || child.name === "valkyrie_thruster_R2") {
                    this.#meshes.thrusters.push(child);
                }
                if (child.name === "valkyrie_cannon_L" || child.name === "valkyrie_cannon_R") {
                    this.#meshes.cannons.push(child);
                }
            }
            this.#meshes.valkyrieShield.setEnabled(false);


            //PROJECTILES
            SceneLoader.ImportMesh("", "", projectilesMeshUrl, GlobalManager.scene, (newMeshes) => {

                this.#meshes.projectileSource = newMeshes[1];
                for (let child of newMeshes) {
                    if (child.material != undefined && child.material.name === "lambert1") child.material.dispose();
                }
                this.#meshes.projectileSource.material = this.#meshesMats.projectile;
                for (let index in this.#meshes.cannons) {
                    this.#meshes.projectiles.push(this.#meshes.projectileSource.clone("projectile_" + index));
                    this.#meshes.projectiles[index].parent = this.#meshes.cannons[index];
                    if (this.#meshes.projectiles[index].parent.name.split("_")[0] === "valkyrie") {
                        this.#meshes.projectiles[index].material = this.#meshesMats.valkyrieProjectile;
                    } else {
                        this.#meshes.projectiles[index].material = this.#meshesMats.raiderProjectile;
                    }
                    this.#meshes.projectiles[index].position.z = Math.random() * 0.025 + ((index % 2) * 0.1) + 0.03;
                }
                this.#meshes.projectileSource.setEnabled(false);


                //load thruster mesh
                SceneLoader.ImportMesh("", "", thrusterFlameMeshUrl, GlobalManager.scene, (newMeshes) => {
                    this.#meshes.thrusterFlameSource = newMeshes[1];
                    for (let child of newMeshes) {
                        if (child.material != undefined && child.material.name === "lambert1") child.material.dispose();
                    }
                    for (let index in this.#meshes.thrusters) {
                        this.#meshes.thrusterFlames.push(this.#meshes.thrusterFlameSource.clone("thrusterFlame_" + index));
                        this.#meshes.thrusterFlames[index].parent = this.#meshes.thrusters[index];
                    }
                    this.#meshes.thrusterFlameSource.setEnabled(false);
                    for (let index in this.#meshes.thrusterFlames) {
                        this.#meshes.thrusterFlames[index].material = this.#meshesMats.thrusterFlame.clone("thrusterMat_" + index);
                        this.#meshes.thrusterFlames[index].material.getBlockByName("rand").value = new Vector2(Math.random(), Math.random());
                        this.#meshes.thrusterFlames[index].material.getBlockByName("power").value = 0.0;
                        if (this.#meshes.thrusterFlames[index].parent.name.split("_")[0] === "valkyrie") {
                            this.#meshes.thrusterFlames[index].material.getBlockByName("coreColor").value = Color3.FromInts(211, 20, 20);
                            this.#meshes.thrusterFlames[index].material.getBlockByName("midColor").value = Color3.FromInts(211, 100, 20);
                            this.#meshes.thrusterFlames[index].material.getBlockByName("sparkColor").value = Color3.FromInts(216, 168, 48);
                            this.#meshes.thrusterFlames[index].material.getBlockByName("afterburnerColor").value = Color3.FromInts(229, 13, 248);
                        } else {
                            this.#meshes.thrusterFlames[index].material.getBlockByName("coreColor").value = Color3.FromInts(24, 122, 156);
                            this.#meshes.thrusterFlames[index].material.getBlockByName("midColor").value = Color3.FromInts(49, 225, 230);
                            this.#meshes.thrusterFlames[index].material.getBlockByName("sparkColor").value = Color3.FromInts(48, 216, 167);
                            this.#meshes.thrusterFlames[index].material.getBlockByName("afterburnerColor").value = Color3.FromInts(13, 248, 168);
                        }
                    }


                    //load vortex mesh
                    //load thruster mesh
                    SceneLoader.ImportMesh("", "", vortexMeshUrl, GlobalManager.scene, (newMeshes) => {
                        this.#meshes.vortexSource = newMeshes[1];
                        for (let child of newMeshes) {
                            if (child.material != undefined && child.material.name === "lambert1") child.material.dispose();
                        }
                        for (let index in this.#meshes.thrusters) {
                            if (this.#meshes.thrusters[index].name.split("_")[0] === "valkyrie") {
                                this.#meshes.vortex.push(this.#meshes.vortexSource.clone("vortex_" + index));
                                this.#meshes.vortex[index].parent = this.#meshes.thrusters[index];
                            }
                        }
                        this.#meshes.vortexSource.setEnabled(true);
                        for (let index in this.#meshes.vortex) {
                            this.#meshes.vortex[index].material = this.#meshesMats.vortex.clone("vortexMat_" + index);
                            this.#meshes.vortex[index].material.getBlockByName("rand").value = new Vector2(Math.random(), Math.random());
                            this.#meshes.vortex[index].material.getBlockByName("power").value = 0.0;
                            if (this.#meshes.thrusterFlames[index].parent.name === "valkyrie_thruster_L1" || this.#meshes.thrusterFlames[index].parent.name === "valkyrie_thruster_L2") {
                                this.#meshes.vortex[index].material.getBlockByName("direction").value = 1;
                            } else {
                                this.#meshes.vortex[index].material.getBlockByName("direction").value = -1;
                            }
                        }


                        this.initAnimations();
                        this.enableGlow();
                        this.playAnim(2);
                    });
                });
            });
        });

    }

    loadAssets() {
        return new Promise((resolve) => {



            // Asset manager for loading texture and particle system
            let assetsManager = new AssetsManager(GlobalManager.scene);
            const particleTexture = assetsManager.addTextureTask("explosion texture", particleExplosionTextureUrl)
            const particleExplosion = assetsManager.addTextFileTask("explosion", particleExplosionUrl);

            // load all tasks
            assetsManager.load();

            // after all tasks done, set up particle system
            assetsManager.onFinish = (tasks) => {
                console.log("tasks successful", tasks);

                // prepare to parse particle system files
                const particleJSON = JSON.parse(particleExplosion.text);
                this.#explosionParticleSystem = ParticleSystem.Parse(particleJSON, GlobalManager.scene, "", true);

                // set particle texture
                this.#explosionParticleSystem.particleTexture = particleTexture.texture;
                this.#explosionParticleSystem.emitter = new Vector3(0, 0, 0);


                resolve(true);
            }

        });


    }

    async createMaterials() {

        this.#meshesMats.thrusterFlame = new NodeMaterial("thrusterFlameMat", GlobalManager.scene, { emitComments: false });
        await this.#meshesMats.thrusterFlame.loadAsync(thrusterFlameShaderUrl);
        this.#meshesMats.thrusterFlame.build(false);
        this.#meshesMats.thrusterFlame.backFaceCulling = false;
        this.#meshesMats.thrusterFlame.alphaMode = 1;

        this.#meshesMats.vortex = new NodeMaterial("vortexMat", GlobalManager.scene, { emitComments: false });
        await this.#meshesMats.vortex.loadAsync(vortexShaderUrl);
        this.#meshesMats.vortex.build(false);
        this.#meshesMats.vortex.backFaceCulling = false;
        this.#meshesMats.vortex.alphaMode = 1;

        this.#meshesMats.valkyrieProjectile = new NodeMaterial("valkyrieProjectileMat", GlobalManager.scene, { emitComments: false });
        await this.#meshesMats.valkyrieProjectile.loadAsync(projectilesShaderUrl);
        this.#meshesMats.valkyrieProjectile.build(false);
        this.#meshesMats.valkyrieProjectile.alphaMode = 1;
        this.#meshesMats.valkyrieProjectile.getBlockByName("coreColor").value = new Color3(6.79, 0.8, 0.4);
        this.#meshesMats.valkyrieProjectile.getBlockByName("midLevel").value = 0.3;
        this.#meshesMats.valkyrieProjectile.getBlockByName("outerLevel").value = 0.25;
        this.#meshesMats.raiderProjectile = this.#meshesMats.valkyrieProjectile.clone("raiderProjectileMat");
        this.#meshesMats.raiderProjectile.getBlockByName("coreColor").value = new Color3(0.30, 3.90, 6.42);
        this.#meshesMats.raiderProjectile.getBlockByName("midLevel").value = 0.5;
        this.#meshesMats.raiderProjectile.getBlockByName("outerLevel").value = 0.25;

        this.#meshesMats.decal = new NodeMaterial("decalMat", GlobalManager.scene, { emitComments: false });
        await this.#meshesMats.decal.loadAsync(shieldsShaderUrl);
        this.#meshesMats.decal.build(false);
        this.#meshesMats.decal.getBlockByName("hitColor").value = this.#meshesMats.valkyrieShieldColor;
        this.#meshesMats.decal.backFaceCulling = false;
        this.#meshesMats.decal.alphaMode = 1;
    }

    

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
        bAddToShadows,
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

            if (bAddToShadows)
                GlobalManager.shadowGenerator.addShadowCaster(parent);
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

    
    initAnimations() {
        // set up keys for all animations
        this.#keys.enginesMax = [
            { frame: 0, value: 0.0 },
            { frame: this.#clipLength, value: 1.0 }
        ];
        this.#keys.enginesMin = [
            { frame: 0, value: 1.0 },
            { frame: this.#clipLength, value: 0.0 }
        ];
        this.#keys.afterburnOn = [
            { frame: 0, value: 1.0 },
            { frame: this.#clipLength / 2, value: 2.0 }
        ];
        this.#keys.afterburnOff = [
            { frame: 0, value: 2.0 },
            { frame: this.#clipLength / 2, value: 1.0 }
        ];

        // set up easing function and easing mode
        this.#anim.easingFunction = new SineEase();
        this.#anim.easingMode = EasingFunction.EASINGMODE_EASEINOUT;
        this.#anim.easingFunction.setEasingMode(this.#anim.easingMode);
    }


    playAnim(nextState) {
        if (this.#anim.group !== undefined) {
            this.#anim.group.dispose();
        }

        this.#anim.group = new AnimationGroup("enginesAnimGroup");
        this.#anim.group.play(false);

        if (nextState === 1) {
            for (let index in this.#meshes.thrusterFlames) {
                this.#anim.clip[index] = new Animation("engineAnim_" + index, "value", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
                this.#anim.clip[index].setEasingFunction(this.#anim.easingFunction);
                this.#anim.clip[index].setKeys(this.#keys.enginesMax);
                this.#anim.group.addTargetedAnimation(this.#anim.clip[index], this.#meshes.thrusterFlames[index].material.getBlockByName("power"));
                if (index < this.#meshes.vortex.length) {
                    this.#anim.group.addTargetedAnimation(this.#anim.clip[index], this.#meshes.vortex[index].material.getBlockByName("power"));
                }
            }
            this.#anim.group.play(true);
            this.#anim.group.loopAnimation = false;
        }
        else if (nextState === 2) {
            for (let index in this.#meshes.thrusterFlames) {
                this.#anim.clip[index] = new Animation("engineAnim_" + index, "value", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
                this.#anim.clip[index].setEasingFunction(this.#anim.easingFunction);
                this.#anim.clip[index].setKeys(this.#keys.afterburnOn);
                this.#anim.group.addTargetedAnimation(this.#anim.clip[index], this.#meshes.thrusterFlames[index].material.getBlockByName("power"));
                if (index < this.#meshes.vortex.length) {
                    this.#anim.group.addTargetedAnimation(this.#anim.clip[index], this.#meshes.vortex[index].material.getBlockByName("power"));
                }
            }
            this.#anim.group.play(true);
            this.#anim.group.loopAnimation = false;
        }
        else if (nextState === 3) {
            for (let index in this.#meshes.thrusterFlames) {
                this.#anim.clip[index] = new Animation("engineAnim_" + index, "value", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
                this.#anim.clip[index].setEasingFunction(this.#anim.easingFunction);
                this.#anim.clip[index].setKeys(this.#keys.afterburnOff);
                this.#anim.group.addTargetedAnimation(this.#anim.clip[index], this.#meshes.thrusterFlames[index].material.getBlockByName("power"));
                if (index < this.#meshes.vortex.length) {
                    this.#anim.group.addTargetedAnimation(this.#anim.clip[index], this.#meshes.vortex[index].material.getBlockByName("power"));
                }
            }
            this.#anim.group.play(true);
            this.#anim.group.loopAnimation = false;
        } else {
            for (let index in this.#meshes.thrusterFlames) {
                this.#anim.clip[index] = new Animation("engineAnim_" + index, "value", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
                this.#anim.clip[index].setEasingFunction(this.#anim.easingFunction);
                this.#anim.clip[index].setKeys(this.#keys.enginesMin);
                this.#anim.group.addTargetedAnimation(this.#anim.clip[index], this.#meshes.thrusterFlames[index].material.getBlockByName("power"));
                if (index < this.#meshes.vortex.length) {
                    this.#anim.group.addTargetedAnimation(this.#anim.clip[index], this.#meshes.vortex[index].material.getBlockByName("power"));
                }
            }
            this.#anim.group.play(true);
            this.#anim.group.loopAnimation = false;
        }
    }


    enableGlow() {

        for (let index in this.#meshes.thrusterFlames) {
            GlobalManager.glowLayer.referenceMeshToUseItsOwnMaterial(this.#meshes.thrusterFlames[index]);
        }
        for (let index in this.#meshes.vortex) {
            GlobalManager.glowLayer.referenceMeshToUseItsOwnMaterial(this.#meshes.vortex[index]);
        }
        for (let index in this.#meshes.projectiles) {
            GlobalManager.glowLayer.referenceMeshToUseItsOwnMaterial(this.#meshes.projectiles[index]);
        }
    }
}

export default Valkyrie;