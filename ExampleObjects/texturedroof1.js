/**
 * Created by Yusef.
 */

/**
 A Very Simple Textured Plane using native WebGL.

 Notice that it is possible to only use twgl for math.

 Also, due to security restrictions the image was encoded as a Base64 string.
 It is very simple to use somthing like this (http://dataurl.net/#dataurlmaker) to create one
 then its as simple as
     var image = new Image()
     image.src = <base64string>


 **/

var grobjects = grobjects || [];


(function() {
    "use strict";

    var vertexSource = ""+
        "precision highp float;" +
        "attribute vec3 aPosition;" +
        "attribute vec2 aTexCoord;" +
        "varying vec2 vTexCoord;" +
        "uniform mat4 pMatrix;" +
        "uniform mat4 vMatrix;" +
        "uniform mat4 mMatrix;" +
        "void main(void) {" +
        "  gl_Position = pMatrix * vMatrix * mMatrix * vec4(aPosition, 1.0);" +
        "  vTexCoord = aTexCoord;" +
        "}";

    var fragmentSource = "" +
        "precision highp float;" +
        "varying vec2 vTexCoord;" +
        "uniform sampler2D uTexture;" +
        "void main(void) {" +
        "  gl_FragColor = texture2D(uTexture, vTexCoord);" +
        "}";


    var vertices = new Float32Array([

        0.5, 0.0, 0.5,
        -0.5, 0.0, 0.5,
        -0.5, 0.0,-0.5,

         0.5,0.0,  0.5,
        -0.5,0.0, -0.5,
         0.5,0.0, -0.5,


        ]);

    var uvs = new Float32Array([
       1.0, 1.0,
       0.0, 1.0,
       0.0, 0.0,

       1.0, 1.0,
       0.0, 0.0,
       1.0, 0.0
    ]);

    //useful util function to simplify shader creation. type is either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
    var createGLShader = function (gl, type, src) {
        var shader = gl.createShader(type)
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            console.log("warning: shader failed to compile!")
            console.log(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    //see above comment on how this works.
    var image = new Image();
    image.onload = function() { loadTexture(image,texture); };
      image.crossOrigin = "anonymous";
      image.src = "https://farm6.staticflickr.com/5564/30725680942_e3bfe50e5e_b.jpg";
      //.staticflickr.com/3/2205/2359335117_08ae4ef88f_b.jpg
      //can use bubble----ground
      //https://farm6.staticflickr.com/5323/30998511026_c6c6625315_b.jpg

      //can use puppy
      //https://farm6.staticflickr.com/5564/30725680942_e3bfe50e5e_b.jpg

      //can use balck white block
      //https://farm6.staticflickr.com/5726/30206830053_87e9530b48_b.jpg


      //https://farm6.staticflickr.com/5726/30206830053_87e9530b48_b.jpg
      //https://farm3.staticflickr.com/2205/2359335117_08ae4ef88f_s.jpg
//https://farm1.staticflickr.com/942/41528290511_c3f63e6e87_s.jpg

    //useful util function to return a glProgram from just vertex and fragment shader source.
    var createGLProgram = function (gl, vSrc, fSrc) {
        var program = gl.createProgram();
        var vShader = createGLShader(gl, gl.VERTEX_SHADER, vSrc);
        var fShader = createGLShader(gl, gl.FRAGMENT_SHADER, fSrc);
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);

        if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
            console.log("warning: program failed to link");
            return null;

        }
        return program;
    }

    //creates a gl buffer and unbinds it when done.
    var createGLBuffer = function (gl, data, usage) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return buffer;
    }

    var findAttribLocations = function (gl, program, attributes) {
        var out = {};
        for(var i = 0; i < attributes.length;i++){
            var attrib = attributes[i];
            out[attrib] = gl.getAttribLocation(program, attrib);
        }
        return out;
    }

    var findUniformLocations = function (gl, program, uniforms) {
        var out = {};
        for(var i = 0; i < uniforms.length;i++){
            var uniform = uniforms[i];
            out[uniform] = gl.getUniformLocation(program, uniform);
        }
        return out;
    }

    var enableLocations = function (gl, attributes) {
        for(var key in attributes){
            var location = attributes[key];
            gl.enableVertexAttribArray(location);
        }
    }

    //always a good idea to clean up your attrib location bindings when done. You wont regret it later.
    var disableLocations = function (gl, attributes) {
        for(var key in attributes){
            var location = attributes[key];
            gl.disableVertexAttribArray(location);
        }
    }

    //creates a gl texture from an image object. Sometiems the image is upside down so flipY is passed to optionally flip the data.
    //it's mostly going to be a try it once, flip if you need to.
    var createGLTexture = function (gl, image, flipY) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        if(flipY){
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,  gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    }

     var TexturedPlane = function () {
        this.name = "TexturedPlane"
        this.position = new Float32Array([0, 0, 0]);
        this.scale = new Float32Array([1, 1]);
        this.program = null;
        this.attributes = null;
        this.uniforms = null;
        this.buffers = [null, null]
        this.texture = null;
    }

    TexturedPlane.prototype.init = function (drawingState) {
        var gl = drawingState.gl;

        this.program = createGLProgram(gl, vertexSource, fragmentSource);
        this.attributes = findAttribLocations(gl, this.program, ["aPosition", "aTexCoord"]);
        this.uniforms = findUniformLocations(gl, this.program, ["pMatrix", "vMatrix", "mMatrix", "uTexture"]);

        this.texture = createGLTexture(gl, image, true);

        this.buffers[0] = createGLBuffer(gl, vertices, gl.STATIC_DRAW);
        this.buffers[1] = createGLBuffer(gl, uvs, gl.STATIC_DRAW);
    }

    TexturedPlane.prototype.center = function () {
        return this.position;
    }

    TexturedPlane.prototype.draw = function (drawingState) {
        var gl = drawingState.gl;

        gl.useProgram(this.program);
        gl.disable(gl.CULL_FACE);

        var modelM = twgl.m4.scaling([this.scale[0],1,this.scale[1]]);
        twgl.m4.setTranslation(modelM,this.position, modelM);

        gl.uniformMatrix4fv(this.uniforms.pMatrix, gl.FALSE, drawingState.proj);
        gl.uniformMatrix4fv(this.uniforms.vMatrix, gl.FALSE, drawingState.view);
        gl.uniformMatrix4fv(this.uniforms.mMatrix, gl.FALSE, modelM);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.uniforms.uTexture, 0);



        enableLocations(gl, this.attributes)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[0]);
        gl.vertexAttribPointer(this.attributes.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[1]);
        gl.vertexAttribPointer(this.attributes.aTexCoord, 2, gl.FLOAT, false, 0, 0);



        gl.drawArrays(gl.TRIANGLES, 0, 6);

        disableLocations(gl, this.attributes);
    }
    //ground
    var test = new TexturedPlane();
        test.position[1] = 0;
        test.position[2] = 0;
        test.position[3] = 0;
        test.scale = [20, 20];
    grobjects.push(test);

var test2 = new TexturedPlane();
    test2.position = [-4, 3, -7];
    test2.scale = [2, 2];
    grobjects.push(test2);
var test3 = new TexturedPlane();
    test3.position = [-4.8, 3, 0];
    test3.scale = [2, 2];
    grobjects.push(test3);
var test7 = new TexturedPlane();
    test7.position = [5, 1, -3.4];
    test7.scale = [2, 2];
    grobjects.push(test7);
var test8 = new TexturedPlane();
    test8.position = [7, 1, -1.6];
    test8.scale = [1, 2];
    grobjects.push(test8);
var test11 = new TexturedPlane();
    test11.position = [3.6, 2, 3.6];
    test11.scale = [1.7, 1.7];
    grobjects.push(test11);
var test12 = new TexturedPlane();
    test12.position = [3.1, 1, 6];
    test12.scale = [1, 2];
    grobjects.push(test12);
var test13 = new TexturedPlane();
    test13.position = [5.5, 2, 6];
    test13.scale = [2, 2];
    grobjects.push(test13);
var test14 = new TexturedPlane();
    test14.position = [1.1, 1, 6];
    test14.scale = [0.5, 1];
    grobjects.push(test14);
})();
