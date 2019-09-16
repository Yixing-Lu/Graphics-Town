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
var Cube = undefined;
var SpinningCube = undefined;

// this is a function that runs at loading time (note the parenthesis at the end)
(function () {
    "use strict";

    // i will use this function's scope for things that will be shared
    // across all cubes - they can all have the same buffers and shaders
    // note - twgl keeps track of the locations for uniforms and attributes for us!
    var shaderProgram = undefined;
    var buffers = undefined;

    // constructor for Cubes
    Cube = function Cube(name, position, size, sizex, sizey, sizez, color) {
        this.name = name;
        this.position = position || [1, 1, 1];
        this.size = size || 1.0;
        this.color = color || [1,1,1];
        this.sizex = sizex;
        this.sizey = sizey;
        this.sizez = sizez;


    }
    Cube.prototype.init = function (drawingState) {
        var gl = drawingState.gl;
        // create the shaders once - for all cubes
        if (!shaderProgram) {
            shaderProgram = twgl.createProgramInfo(gl, ["cube-vs", "cube-fs"]);
        }
        if (!buffers) {
            var arrays = {
                vpos: {
                    numComponents: 3, data: [
                        -.5, -.5, -.5, .5, -.5, -.5, .5, .5, -.5, -.5, -.5, -.5, .5, .5, -.5, -.5, .5, -.5,    // z = 0
                        -.5, -.5, .5, .5, -.5, .5, .5, .5, .5, -.5, -.5, .5, .5, .5, .5, -.5, .5, .5,    // z = 1
                        //-.5, -.5, -.5, .5, -.5, -.5, .5, -.5, .5, -.5, -.5, -.5, .5, -.5, .5, -.5, -.5, .5,    // y = 0 delete the top and bottom
                        //-.5, .5, -.5, .5, .5, -.5, .5, .5, .5, -.5, .5, -.5, .5, .5, .5, -.5, .5, .5,    // y = 1 delete the top and bottom
                        -.5, -.5, -.5, -.5, .5, -.5, -.5, .5, .5, -.5, -.5, -.5, -.5, .5, .5, -.5, -.5, .5,    // x = 0
                        .5, -.5, -.5, .5, .5, -.5, .5, .5, .5, .5, -.5, -.5, .5, .5, .5, .5, -.5, .5     // x = 1
                    ]
                },
                vnormal: {
                    numComponents: 3, data: [
                        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
                        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
                        //0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,     //y=0 delete the top and bottom
                        //0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,             //y=1 delete the top and bottom
                        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
                        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
                    ]
                }
            };
            buffers = twgl.createBufferInfoFromArrays(drawingState.gl, arrays);
        }

    };
    Cube.prototype.draw = function (drawingState) {
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
    Cube.prototype.center = function (drawingState) {
        return this.position;
    }


    ////////
    // constructor for Cubes
    SpinningCube = function SpinningCube(name, position, size, color, axis) {
        Cube.apply(this, arguments);
        this.axis = axis || 'X';
    }
    SpinningCube.prototype = Object.create(Cube.prototype);
    SpinningCube.prototype.draw = function (drawingState) {
        // we make a model matrix to place the cube in the world
        var modelM = twgl.m4.scaling([this.size, this.size, this.size]);
        var theta = Number(drawingState.realtime) / 200.0;
        if (this.axis == 'X') {
            twgl.m4.rotateX(modelM, theta, modelM);
        } else if (this.axis == 'Z') {
            twgl.m4.rotateZ(modelM, theta, modelM);
        } else {
            twgl.m4.rotateY(modelM, theta, modelM);
        }
        twgl.m4.setTranslation(modelM, this.position, modelM);


        var modelM2 = twgl.m4.translate(modelM, [2 * Math.sin(Number(drawingState.realtime) / 400), 50 - (this.position[2] + Number(drawingState.realtime / 50)) % 50, 2 * Math.cos(Number(drawingState.realtime) / 400)], modelM);

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
    SpinningCube.prototype.center = function (drawingState) {
        return this.position;
    }


})();

// put some objects into the scene
// normally, this would happen in a "scene description" file
// but I am putting it here, so that if you want to get
// rid of cubes, just don't load this file.
/*
grobjects.push(new Cube("cube1",[-2,0.5,   0],1) );
grobjects.push(new Cube("cube2",[ 2,0.5,   0],1, [1,1,0]));
grobjects.push(new Cube("cube3",[ 0, 0.5, -2],1 , [0,1,1]));
grobjects.push(new Cube("cube4",[ 0,0.5,   2],1));

grobjects.push(new SpinningCube("scube 1",[-2,0.5, -2],1) );
grobjects.push(new SpinningCube("scube 2",[-2,0.5,  2],1,  [1,0,0], 'Y'));
grobjects.push(new SpinningCube("scube 3",[ 2,0.5, -2],1 , [0,0,1], 'Z'));
grobjects.push(new SpinningCube("scube 4",[ 2,0.5,  2],1));
*/
/*--------------with color
grobjects.push(new Cube("cube1", [0, 0.5, -7], 2, 4, 1, 3, [1, 0, 0]));//1
grobjects.push(new Cube("cube2", [-4, 1.5, -7], 1, 2, 3, 2, [0, 1, 0]));//2
grobjects.push(new Cube("cube3", [-4.8, 1.5, 0], 1, 2, 3, 2, [0, 0, 1]));//3
grobjects.push(new Cube("cube4", [-2.4, 1, 0], 1, 2, 2, 2, [1, 1, 0]));//4
grobjects.push(new Cube("cube5", [0, 0.5, 0], 1, 2, 1, 2, [0, 1, 1]));//5
grobjects.push(new Cube("cube6", [4, 1, -1], 1.5, 3, 2, 1, [1, 0, 0]));//6
grobjects.push(new Cube("cube7", [5, 0.5, -3.4], 1, 2, 1, 2, [0, 1, 0]));//7
grobjects.push(new Cube("cube8", [7, 0.5, -1.6], 0.7, 1, 1, 2, [1, 1, 0]));//8
grobjects.push(new Cube("cube9", [-1.6, 1, 6], 1, 1.7, 2, 1.7, [1, 1, 0]));//9
grobjects.push(new Cube("cube10", [0.2, 0.5, 4], 1.5, 2.8, 1, 2, [0, 1, 1]));//10
grobjects.push(new Cube("cube11", [3.6, 1, 3.6], 1, 1.7, 2, 1.7, [1, 0, 0]));//11
grobjects.push(new Cube("cube12", [3.1, 0.5, 6], 0.9, 1, 1, 2, [0, 1, 0]));//12
grobjects.push(new Cube("cube13", [5.5, 1, 6], 1, 2, 2, 2, [0, 0, 1]));//13
grobjects.push(new Cube("cube14", [1.1, 0.5, 6], 0.7, 0.5, 1, 1, [0, 0, 1]));//14
*/
grobjects.push(new Cube("cube1", [0, 0.5, -7], 2, 4, 1, 3));//1
grobjects.push(new Cube("cube2", [-4, 1.5, -7], 1, 2, 3, 2));//2
grobjects.push(new Cube("cube3", [-4.8, 1.5, 0], 1, 2, 3, 2));//3
grobjects.push(new Cube("cube4", [-2.4, 1, 0], 1, 2, 2, 2));//4
grobjects.push(new Cube("cube5", [0, 0.5, 0], 1, 2, 1, 2));//5
grobjects.push(new Cube("cube6", [4, 1, -1], 1.5, 3, 2, 1));//6
grobjects.push(new Cube("cube7", [5, 0.5, -3.4], 1, 2, 1, 2));//7
grobjects.push(new Cube("cube8", [7, 0.5, -1.6], 0.7, 1, 1, 2));//8
grobjects.push(new Cube("cube9", [-1.6, 1, 6], 1, 1.7, 2, 1.7));//9
grobjects.push(new Cube("cube10", [0.2, 0.5, 4], 1.5, 2.8, 1, 2));//10
grobjects.push(new Cube("cube11", [3.6, 1, 3.6], 1, 1.7, 2, 1.7));//11
grobjects.push(new Cube("cube12", [3.1, 0.5, 6], 0.9, 1, 1, 2));//12
grobjects.push(new Cube("cube13", [5.5, 1, 6], 1, 2, 2, 2));//13
grobjects.push(new Cube("cube14", [1.1, 0.5, 6], 0.7, 0.5, 1, 1));//14

// utility - generate random  integer
function getRandomInt(min, max) {
    return Math.random() * (max - min) + min;
}

var num = 1000;
for (var i = 1; i < num; i++) {
    grobjects.push(new SpinningCube("scube" + i, [getRandomInt(-9, 9), getRandomInt(0, 50), getRandomInt(-9, 9)], 0.1, [0, 0, 1], 'Y'));
}


//grobjects.push(new SpinningCube("scube 3",[ 2,0.5, -2],0.1 , [0,0,1], 'Y'));
