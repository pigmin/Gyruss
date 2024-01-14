//Singleton like class


class GlobalManager {
    static name = "GlobalManager";

    #canvas;
    #engine;
    #currentScene;
    
    glowLayer;
    shadowGenerator;

    valkyrie;

    static get instance() {
        return (globalThis[Symbol.for(`PF_${GlobalManager.name}`)] ||= new this());
    }

    get canvas() {
        return this.#canvas;
    }
    get engine() {
        return this.#engine;
    }
    
    get scene() {
        return this.#currentScene;
    }

    set scene(currentScene) {
        if (currentScene)
            this.#currentScene = currentScene;
    }


    constructor() { 
    }

    setup(canvas, engine) {
        this.#canvas = canvas;
        this.#engine = engine;
    }

    init() {

    }

    detroy() {
        
    }

}

//Destructuring on ne prends que la propriété statique instance
const {instance} = GlobalManager;
export { instance as GlobalManager };