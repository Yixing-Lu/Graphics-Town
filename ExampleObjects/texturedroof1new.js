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
        //add 4.18
        "attribute vec3 vnormal;" +
        "uniform vec3 lightdir;" +
        "varying vec3 outColor;" +

        "varying vec2 vTexCoord;" +
        "uniform mat4 pMatrix;" +
        "uniform mat4 vMatrix;" +
        "uniform mat4 mMatrix;" +
        "void main(void) {" +
        "  gl_Position = pMatrix * vMatrix * mMatrix * vec4(aPosition, 1.0);" +
        "  vTexCoord = aTexCoord;" +

        //add 4.18
        "vec4 normal = normalize(mMatrix * vec4(vnormal,0.0));" +
        "float diffuse = .5 + .5*abs(dot(normal, vec4(lightdir,0.0)));" +
        "outColor =vec3(diffuse,diffuse,diffuse);" +

        "}";

    var fragmentSource = "" +
        "precision highp float;" +
        "varying vec2 vTexCoord;" +
        "uniform sampler2D uTexture;" +
        //add 4.26
        "uniform sampler2D uTexture2;"+
        //add 4.18
        "varying vec3 outColor;" +

        "void main(void) {" +
        //add 4.26
        "vec3 texColor2=texture2D(uTexture2, vTexCoord).xyz*outColor;" +
        //add 4.18
        "vec3 texColor=texture2D(uTexture, vTexCoord).xyz*outColor;" +

        "  gl_FragColor =vec4(outColor.x*texColor.xyz+(1.0-outColor.x)*texColor2.xyz,1.0);" +
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

var localnormal = new Float32Array([
         0,1,0,
         0,1,0,
         0,1,0,
         0,1,0,
         0,1,0,
         0,1,0,
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
      image.src = "https://farm1.staticflickr.com/925/27701725798_8acc6da992_b.jpg";

      //add 4.26
      var image2 = new Image();
    image2.onload = function() { loadTexture(image2,texture2); };
      image2.crossOrigin = "anonymous";
      image2.src = "https://farm1.staticflickr.com/824/27855699228_f3953e3314_b.jpg";

 //
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
        this.buffers = [null, null,null];
        this.texture = null;
        //add 4.26
        this.texture2 = null;
    }

    TexturedPlane.prototype.init = function (drawingState) {
        var gl = drawingState.gl;

        this.program = createGLProgram(gl, vertexSource, fragmentSource);
        this.attributes = findAttribLocations(gl, this.program, ["aPosition", "aTexCoord","vnormal"]);
        this.uniforms = findUniformLocations(gl, this.program, ["pMatrix", "vMatrix", "mMatrix", "uTexture","uTexture2","lightdir"]);

        this.texture = createGLTexture(gl, image, true);
        //add 4.26
        this.texture2 = createGLTexture(gl, image2, true);

        this.buffers[0] = createGLBuffer(gl, vertices, gl.STATIC_DRAW);
        this.buffers[1] = createGLBuffer(gl, uvs, gl.STATIC_DRAW);
        this.buffers[2] = createGLBuffer(gl, localnormal, gl.STATIC_DRAW);
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
        //add 4.18
        gl.uniform3fv(this.uniforms.lightdir, drawingState.sunDirection);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.uniforms.uTexture, 0);
        //add 4.26
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.texture2);
        gl.uniform1i(this.uniforms.uTexture2, 1);



        enableLocations(gl, this.attributes)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[0]);
        gl.vertexAttribPointer(this.attributes.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[1]);
        gl.vertexAttribPointer(this.attributes.aTexCoord, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[2]);
        gl.vertexAttribPointer(this.attributes.vnormal, 3, gl.FLOAT, false, 0, 0);



        gl.drawArrays(gl.TRIANGLES, 0, 6);

        disableLocations(gl, this.attributes);
    }
    //ground

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
