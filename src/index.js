//Gyruss
import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.uniformBuffer";

import Gyruss from "./gyruss";

let canvas;
let engine;

export const babylonInit = async () => {
    const engineType = location.search.split("engine=")[1]?.split("&")[0] || "webgl";

    // Get the canvas element
    canvas = document.getElementById("renderCanvas");
    // Generate the BABYLON 3D engine
    if (engineType === "webgpu") {
        const webGPUSupported = await WebGPUEngine.IsSupportedAsync;
        if (webGPUSupported) {
            const webgpu = (engine = new WebGPUEngine(canvas, {
                adaptToDeviceRatio: true,
                antialias: true
            }));
            await webgpu.initAsync();
            engine = webgpu;
        } else {
            engine = new Engine(canvas, false, {
                adaptToDeviceRatio: true,
            });
            //Stencil is for hightlayer, unused in this projet 
            //engine = new Engine(canvas, false, { stencil: true });
        }
    } else {
        engine = new Engine(canvas, false, {
            adaptToDeviceRatio: true,
        });
        //Stencil is for hightlayer, unused in this projet 
        //engine = new Engine(canvas, false, {stencil: true});
    }



    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });
};

babylonInit().then(() => {
    // scene started rendering, everything is initialized
    // Register a render loop to repeatedly render the scene
    // Create the scene
    const game = window.game = new Gyruss(canvas, engine);
    game.start();

});


