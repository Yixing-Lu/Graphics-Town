/**
 * Created by gleicher on 10/9/15.
 */
/*
 a second example object for graphics town
 check out "simplest" first

 the cube is more complicated since it is designed to allow making many cubes

 we make a constructor function that will make instances of cubes - each one gets
 added to the grobjects list

 we need to be a little bit careful to distinguish between different kinds of initialization
 1) there are the things that can be initialized when the function is first defined
    (load time)
 2) there are things that are defined to be shared by all cubes - these need to be defined
    by the first init (assuming that we require opengl to be ready)
 3) there are things that are to be defined for each cube instance
 */
var grobjects = grobjects || [];

// allow the two constructors to be "leaked" out
var Roof = undefined;

// this is a function that runs at loading time (note the parenthesis at the end)
(function () {
    "use strict";

    // i will use this function's scope for things that will be shared
    // across all cubes - they can all have the same buffers and shaders
    // note - twgl keeps track of the locations for uniforms and attributes for us!
    var shaderProgram = undefined;
    var buffers = undefined;

    // constructor for Cubes
    Roof = function Roof(name, position, size, sizex, sizey, sizez, color) {
        this.name = name;
        this.position = position || [0, 0, 0];
        this.size = size || 1.0;
        this.color = color || [.7, .8, .9];
        this.sizex = sizex;
        this.sizey = sizey;
        this.sizez = sizez;
    }
    Roof.prototype.init = function (drawingState) {
        var gl = drawingState.gl;
        // create the shaders once - for all cubes
        if (!shaderProgram) {
            shaderProgram = twgl.createProgramInfo(gl, ["cube-vs", "cube-fs"]);
        }
        if (!buffers) {
            var arrays = {
                vpos: {
                    numComponents: 3, data: [
                        -.5, -.5, -.5, .5, -.5, -.5, .5, 0, 0.0, -.5, -.5, -.5, .5, 0, 0.0, -.5, 0, 0.0,    // z = 0
                        -.5, -.5, .5, .5, -.5, .5, .5, 0, 0.0, -.5, -.5, .5, .5, 0, 0.0, -.5, 0, 0.0,    // z = 1
                        -.5, -.5, -.5, -.5, 0, 0.0, -.5, -.5, .5,    // x = 0
                        .5, -.5, -.5, .5, 0, 0.0, .5, -.5, .5     // x = 1
                    ]
                },
                vnormal: {
                    numComponents: 3, data: [
                        0, -1, 1, 0, -1, 1, 0, -1, 1, 0, -1, 1, 0, -1, 1, 0, -1, 1,
                        0, 1, -1, 0, 1, -1, 0, 1, -1, 0, 1, -1, 0, 1, -1, 0, 1, -1,
                        -1, 0, 0, -1, 0, 0, -1, 0, 0,    // -1,0,0, -1,0,0, -1,0,0,
                        1, 0, 0, 1, 0, 0, 1, 0, 0,        //1,0,0, 1,0,0, 1,0,0,
                    ]
                }

            };
            buffers = twgl.createBufferInfoFromArrays(drawingState.gl, arrays);
        }

    };
    Roof.prototype.draw = function (drawingState) {
        // we make a model matrix to place the cube in the world
        var modelM = twgl.m4.scaling([this.sizex, this.sizey, this.sizez]);
        twgl.m4.setTranslation(modelM, this.position, modelM);
        // the drawing coce is straightforward - since twgl deals with the GL stuff for us
        var gl = drawingState.gl;
        gl.useProgram(shaderProgram.program);
        twgl.setBuffersAndAttributes(gl, shaderProgram, buffers);
        twgl.setUniforms(shaderProgram, {
            view: drawingState.view, proj: drawingState.proj, lightdir: drawingState.sunDirection,
            cubecolor: this.color, model: modelM
        });
        twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
    };
    Roof.prototype.center = function (drawingState) {
        return this.position;
    }


})();
/*
grobjects.push(new Roof("roof1",[0,1.8,-7],2, [1,0,0]) );//1
grobjects.push(new Roof("roof4",[-2.4,1.25,0],1, [1,1,0]) );//4
grobjects.push(new Roof("roof5",[0,1,0],1, [0,1,1]) );//5
grobjects.push(new Roof("roof6",[4,1.5,-1],1.5, [1,0,0]) );//6
grobjects.push(new Roof("roof8",[-1.6,1.5,5.4],1, [1,1,0]) );//9
grobjects.push(new Roof("roof9",[0.2,1.5,4],1.5, [0,1,1]) );//10
*/

grobjects.push(new Roof("roof1", [0, 1.5, -7], 2, 4, 1, 3, [1, 0, 0]));//1
grobjects.push(new Roof("roof4", [-2.4, 3, 0], 1, 2, 2, 2, [1, 1, 0]));//4
grobjects.push(new Roof("roof5", [0, 1.5, 0], 1, 2, 1, 2, [0, 1, 1]));//5
grobjects.push(new Roof("roof6", [4, 3, -1], 1.5, 3, 2, 1, [1, 0, 0]));//6
grobjects.push(new Roof("roof9", [-1.6, 3, 6], 1, 1.7, 2, 1.7, [1, 1, 0]));//9
grobjects.push(new Roof("roof10", [0.2, 1.5, 4], 1.5, 2.8, 1, 2, [0, 1, 1]));//10

