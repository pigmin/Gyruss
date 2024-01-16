import { Color3, Color4, MeshBuilder, PointsCloudSystem, StandardMaterial, Vector3 } from "@babylonjs/core";
import { GlobalManager } from "./globalmanager";

class StarField {
    #starfieldSystem;
    #starfieldSystem2;
    #enabled;

    #StarCount = 2500;
    #StarSpread = 12.0;
    #StarPositions = Array();
    #Stars = Array();

    constructor() {
        this.#enabled = false;
        this.init();
    }

    
    init() {
        this.#starfieldSystem = new PointsCloudSystem("starField", 2, GlobalManager.scene);        
        this.#starfieldSystem.recycleParticle = function(particle) {
            
            particle.position = new Vector3(
                (Math.random() * 2 - 1) * 48,
                (Math.random() * 2 - 1) * 24,
                120 + (Math.random() ) *  50
            );
            let intensity = Math.random();
            particle.color = new Color4(intensity, intensity+0.05, 0.1+intensity, 0.25);
            particle.velocity = new Vector3(0, 0, (- 0.125 * Math.random()));
            
        // particle.heightLim = 16 + 0.5 * Math.random();
        }
        this.#starfieldSystem.updateParticle = function(particle) {
            if (particle.position.z < 0) {
                this.recycleParticle(particle);
            }
            particle.position.addInPlace(particle.velocity);
        }
        this.#starfieldSystem.addPoints(2000, this.#starfieldSystem.recycleParticle);
        this.#starfieldSystem.buildMeshAsync();
        
        
        this._initBurst();        
        GlobalManager.scene.registerBeforeRender( () => { this.update() } );
    }

    setEnabled(bEnable) {
        this.#enabled = bEnable;
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

    _initBurst()
    {
        while (this.#StarPositions.length < this.#StarCount) {
            this.#StarPositions.push(
                new Vector3(
                    (Math.random() * 2 - 1) * this.#StarSpread * 2,
                    (Math.random() * 2 - 1) * this.#StarSpread,
                    (Math.random() * 2 - 1) * this.#StarSpread * 10
                )
            )
        }

        var Star = MeshBuilder.CreateCylinder(
            "Star", { height: 30, diameterBottom: 0.02, diameterTop: 0.01, tessellation: 16 }, GlobalManager.scene);
        Star.position = new Vector3(0, 0, 1000);
        Star.rotation = new Vector3(Math.PI / 2, 0., 0.0);
        var StarMaterial = new StandardMaterial("StarMaterial", GlobalManager.scene);
        let intensity = 0.2 + Math.random()*0.8;
        StarMaterial.diffuseColor = new Color3(intensity);
        StarMaterial.emissiveColor = new Color3(0.4, 0.8, 1);
        StarMaterial.alpha = 0.5;
        Star.material = StarMaterial;

        for (var i = 0; i < this.#StarCount; i++) {
            this.#Stars.push(Star.createInstance("star" + i));
            this.#Stars[i].position = this.#StarPositions[i];
            var s = Math.random();
            this.#Stars[i].scaling = new Vector3(s, s, s);
            this.#Stars[i].parent = GlobalManager.activeCamera;
        }
    }

    _tickBurst(bursting, gameSpeed)
    {
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