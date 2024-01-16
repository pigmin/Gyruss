import { Color4, PointsCloudSystem, Vector3 } from "@babylonjs/core";
import { GlobalManager } from "./globalmanager";

class StarField {
    #starfieldSystem;
    #enabled;

    constructor() {
        this.#enabled = false;
        this.init();
    }

    init() {
        this.#starfieldSystem = new PointsCloudSystem("starField", 3, GlobalManager.scene);
        
        this.#starfieldSystem.recycleParticle = function(particle) {
            particle.position = new Vector3(0.1 - 0.2 * Math.random(), 0.1 - 0.2 * Math.random(), 10);
            //particle.rotation = new Vector3(Math.PI/2, 0, 0);
            let intensity = Math.random();
            particle.color = new Color4(intensity, intensity, intensity, intensity);
            particle.velocity = new Vector3(0.05 - 0.1 * Math.random(),  0.05 - 0.1 * Math.random(), (- 0.05 * Math.random()));
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
        GlobalManager.scene.registerBeforeRender( () => { this.update() } );
    }

    setEnabled(bEnable) {
        this.#enabled = bEnable;
    }

    update() {
        //@todo : deltaTime
        if (this.#enabled)
            this.#starfieldSystem.setParticles()
    }

    render() {

    }

}

export default StarField;