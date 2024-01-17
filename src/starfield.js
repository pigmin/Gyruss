import { Color3, Color4, MeshBuilder, NodeMaterial, PointsCloudSystem, SceneLoader, StandardMaterial, Texture, TransformNode, Vector3 } from "@babylonjs/core";
import { GlobalManager } from "./globalmanager";

import starFieldGlb from "../assets/gltf/starsGeo.glb";
import starFieldPanoramaTextureUrl from "../assets/textures/starfield_panorama_texture.jpg";

import starFieldShaderUrl from "../assets/shaders/starfieldShader.json";

class StarField {
    #starfieldSystem;
    #starfieldSystem2;
    #enabled;

    #StarCount = 2500;
    #StarSpread = 12.0;
    #StarPositions = Array();
    #Stars = Array();
    #meshes = {};
    #meshesMats = {};
    #BigStarModel;

    constructor() {
        this.#enabled = false;
        this.#meshes.starField = null;
        this.root = new TransformNode(0, 0, 0);
    }

    async init() {

        await this.createMaterials();
        await this.loadMeshes();
        await this.loadAssets();

        this.#starfieldSystem = new PointsCloudSystem("starField", 2, GlobalManager.scene);
        this.#starfieldSystem.recycleParticle = function (particle) {

            particle.position = new Vector3(
                (Math.random() * 2 - 1) * 48,
                (Math.random() * 2 - 1) * 24,
                120 + (Math.random()) * 50
            );
            let intensity = Math.random();
            particle.color = new Color4(intensity, intensity + 0.05, 0.1 + intensity, 0.25);
            particle.velocity = new Vector3(0, 0, (- 0.125 * Math.random()));

            // particle.heightLim = 16 + 0.5 * Math.random();
        }
        this.#starfieldSystem.updateParticle = function (particle) {
            if (particle.position.z < 0) {
                this.recycleParticle(particle);
            }
            particle.position.addInPlace(particle.velocity);
        }
        this.#starfieldSystem.addPoints(2000, this.#starfieldSystem.recycleParticle);
        await this.#starfieldSystem.buildMeshAsync();

        this._initBurst();

        this.setEnabled(false);
    }

    setEnabled(bEnable) {
        this.#enabled = bEnable;
        if (bEnable)
        {
            this.#starfieldSystem.mesh.setEnabled(true);
            this.#BigStarModel.visibility = 1;
            this.#meshes.starfield.setEnabled(true);
        }
        else {
            this.#starfieldSystem.mesh.setEnabled(false);
            this.#BigStarModel.visibility = 0;
            this.#meshes.starfield.setEnabled(false);
        }

    }

    update() {
        //@todo : deltaTime
        if (this.#enabled) {
            this.#starfieldSystem.setParticles();
            this._tickBurst(1, 0.1);
        }
    }

    render() {

    }

    async loadMeshes() {
        //starfield
        return new Promise( (resolve)  => {
            SceneLoader.ImportMesh("", "", starFieldGlb, GlobalManager.scene, (newMeshes) => {
                this.#meshes.starfield = newMeshes[1];
                this.#meshes.starfield.scaling = new Vector3(4500, 4500, 4500);
                this.#meshes.starfield.material = this.#meshesMats.starfield;
                this.#meshes.starfield.parent = GlobalManager.activeCamera;
                resolve(true);
            });
        });
    }

    async createMaterials() {
        this.#meshesMats.starfieldTex = new Texture(starFieldPanoramaTextureUrl, GlobalManager.scene, false, false);
        this.#meshesMats.starfield = new NodeMaterial("starfieldMat", GlobalManager.scene, { emitComments: false });
        await this.#meshesMats.starfield.loadAsync(starFieldShaderUrl);
        this.#meshesMats.starfield.build(false);
        this.#meshesMats.starfield.getBlockByName("emissiveTex").texture = this.#meshesMats.starfieldTex;
    }

    async loadAssets() {
    }

    _initBurst() {
        while (this.#StarPositions.length < this.#StarCount) {
            this.#StarPositions.push(
                new Vector3(
                    (Math.random() * 2 - 1) * this.#StarSpread * 2,
                    (Math.random() * 2 - 1) * this.#StarSpread,
                    (Math.random() * 2 - 1) * this.#StarSpread * 10
                )
            )
        }

        this.#BigStarModel = MeshBuilder.CreateCylinder("BigStar", { height: 30, diameterBottom: 0.02, diameterTop: 0.01, tessellation: 16 }, GlobalManager.scene);
        this.#BigStarModel.position = new Vector3(0, 0, 1000);
        this.#BigStarModel.rotation = new Vector3(Math.PI / 2, 0., 0.0);
        var StarMaterial = new StandardMaterial("StarMaterial", GlobalManager.scene);
        let intensity = 0.2 + Math.random() * 0.8;
        StarMaterial.diffuseColor = new Color3(intensity);
        StarMaterial.emissiveColor = new Color3(0.4, 0.8, 1);
        StarMaterial.alpha = 0.5;
        this.#BigStarModel.material = StarMaterial;
        this.#BigStarModel.visibility = 0;

        for (var i = 0; i < this.#StarCount; i++) {
            this.#Stars.push(this.#BigStarModel.createInstance("bigstar" + i));
            this.#Stars[i].position = this.#StarPositions[i];
            var s = Math.random();
            this.#Stars[i].scaling = new Vector3(s, s, s);
            this.#Stars[i].parent = GlobalManager.activeCamera;
        }
    }

    _tickBurst(bursting, gameSpeed) {
        const burstStrength = Math.max(bursting - 0.5, 0) * gameSpeed;
        this.#Stars.forEach((star) => {
            star.position.z -= 1 / 60 * 200 * burstStrength;
            if (star.position.z < -50) {
                star.position.set(
                    (Math.random() * 2 - 1) * this.#StarSpread * 2,
                    (Math.random() * 2 - 1) * this.#StarSpread,
                    (Math.random() * 2 - 1) * this.#StarSpread * 10
                )
            }
            star.scaling.y = burstStrength + 0.001;
        });
    }

}

export default StarField;