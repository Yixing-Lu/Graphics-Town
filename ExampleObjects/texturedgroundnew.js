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
        //add 4.26
        "varying vec3 fNormal;"+
        "varying vec3 fPosition;"+
        //"varying vec3 fColor;"+
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
        //add 4.26
        "fNormal=vnormal;"+
        //"fColor = aTexCoord;"+
        "fPosition = (pMatrix * vMatrix * mMatrix * vec4(aPosition, 1.0)).xyz;"+
        //add 4.18
        "vec4 normal = normalize(mMatrix * vec4(vnormal,0.0));" +
        "float diffuse = .5 + .5*abs(dot(normal, vec4(lightdir,0.0)));" +
        "outColor =vec3(diffuse,diffuse,diffuse);" + // vec4(1.0,1.0,1.0,0.0);" +

        "}";

    var fragmentSource = "" +
        "precision highp float;" +
        "varying vec2 vTexCoord;" +
        "uniform sampler2D uTexture;" +
        //add 4.26

        //"varying vec3 fColor;"+
        "uniform vec3 lightdir;" +
        "varying vec3 fPosition;"+
        "uniform mat4 vMatrix;" +
        "uniform mat4 mMatrix;" +
        "varying vec3 fNormal;"+
        "vec3  lightV    = lightdir;"+
        "const float lightI    = 1.0;    " +      //1.0     // only for diffuse component
        "const float ambientC  = 1.5;" +//0.15
        "const float diffuseC  =0.3;" +//0.3
        "const float specularC = 1.0;" +//1.0
        "const float specularE = 10.0;" +//1.0
        "const vec3  lightCol  = vec3(0.0,0.5,0.0);" +
        "const vec3  objectCol = vec3(1.0,0.6,0.0);" +  // yellow-ish orange

        "vec2 blinnPhongDir(vec3 lightDir, vec3 n, float lightInt, float Ka,"+
        "float Kd, float Ks, float shininess) {"+
        "vec3 s = normalize(lightDir);"+
        "vec3 v = normalize(-fPosition);"+
        "vec3 h = normalize(v+s);"+
        "float diffuse = Ka + Kd * lightInt * max(0.0, dot(n, s));"+
        "float spec =  Ks * pow(max(0.0, dot(n,h)), shininess);"+
        "return vec2(diffuse, spec);"+
      "}"+


        //add 4.18
        "varying vec3 outColor;" +
        "void main(void) {" +
        //add 4.26
        "vec3 dNormal=texture2D(uTexture,vTexCoord).xyz;"+
        "vec3 n_perturbed = normalize(dNormal+fNormal);"+
        "vec3 n = (vMatrix * mMatrix * vec4(n_perturbed, 0.0)).xyz;"+
        "vec3 ColorS  = blinnPhongDir(lightV,n,0.0   ,0.0,     0.0,     specularC,specularE).y*lightCol;"+
        "vec3 ColorAD = blinnPhongDir(lightV,n,lightI,ambientC,diffuseC,0.0,      1.0      ).x*dNormal;"+
        "gl_FragColor = vec4(ColorAD+ColorS,1.0);"+



        //"vec3 texColor=texture2D(uTexture, vTexCoord).xyz*outColor;" +
       // "  gl_FragColor =vec4(texColor, 1.0);" +//texture2D(uTexture, vTexCoord);" +//vec4(texColor, 1.0);" +
        "}";


    var vertices = new Float32Array([
         /*0.5,  0.5,  0.0,
        -0.5,  0.5,  0.0,
        -0.5, -0.5,  0.0,

         0.5,  0.5,  0.0,
        -0.5, -0.5,  0.0,
         0.5, -0.5,  0.0
         */

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
      image.src = "https://farm1.staticflickr.com/883/40853254414_9d63a6a894_b.jpg";
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
        this.buffers = [null, null,null]
        this.texture = null;
    }

    TexturedPlane.prototype.init = function (drawingState) {
        var gl = drawingState.gl;

        this.program = createGLProgram(gl, vertexSource, fragmentSource);
        this.attributes = findAttribLocations(gl, this.program, ["aPosition", "aTexCoord","vnormal"]);
        this.uniforms = findUniformLocations(gl, this.program, ["pMatrix", "vMatrix", "mMatrix", "uTexture","lightdir"]);

        this.texture = createGLTexture(gl, image, true);

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
    var test = new TexturedPlane();
        test.position[1] = 0;
        test.position[2] = 0;
        test.position[3] = 0;
        test.scale = [20, 20];
    grobjects.push(test);

})();
